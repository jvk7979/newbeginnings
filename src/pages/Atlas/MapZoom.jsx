// src/pages/Atlas/MapZoom.jsx
//
// Shared zoom + pan capability for the Atlas SVG maps (IndiaMap / APMap).
//
// Exports:
//   - useMapZoom(deps)  — a hook returning { zoom, panX, panY, transform,
//     svgHandlers, zoomIn, zoomOut, reset }. `transform` is the string to
//     drop straight onto the content <g>. `svgHandlers` spread onto the
//     <svg> wire up wheel-zoom and click-drag pan. Passing a changing
//     `resetKey` (e.g. the view level) resets zoom/pan automatically — the
//     India ↔ AP-district switch should pass a distinct key.
//   - <ZoomControls/> — the floating +/−/reset box, styled like the app's
//     other floating panels (cream glass, C.border, soft shadow).

import { useCallback, useEffect, useRef, useState } from 'react';
import { C } from '../../tokens';

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const ZOOM_STEP = 1.4;          // multiplicative step for the +/− buttons
const WHEEL_SENSITIVITY = 0.0016;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// `viewW`/`viewH` are the SVG viewBox dimensions — needed to convert a
// pointer position (in client px) into viewBox coordinates so wheel-zoom
// stays anchored under the cursor and pan distances map 1:1.
export function useMapZoom({ viewW, viewH, resetKey, defaultZoom = 1 } = {}) {
  // The default/reset pan keeps a >1 defaultZoom centred on the viewBox
  // (content scales from the SVG origin, so without this offset a zoomed
  // default would slide the map off the bottom-right and clip it).
  const defaultPan = {
    x: -((viewW || 0) * (defaultZoom - 1)) / 2,
    y: -((viewH || 0) * (defaultZoom - 1)) / 2,
  };
  const [zoom, setZoom] = useState(defaultZoom);
  const [pan, setPan] = useState(defaultPan);
  const svgRef = useRef(null);
  const drag = useRef(null);    // { startX, startY, panX, panY, moved }

  // Reset whenever the caller's resetKey changes (India ↔ AP switch).
  useEffect(() => {
    setZoom(defaultZoom);
    setPan({
      x: -((viewW || 0) * (defaultZoom - 1)) / 2,
      y: -((viewH || 0) * (defaultZoom - 1)) / 2,
    });
  }, [resetKey, defaultZoom, viewW, viewH]);

  // Clamp the pan so the scaled content can't be dragged entirely off the
  // canvas — keeps at least the full viewBox reachable at any zoom.
  const clampPan = useCallback((x, y, z) => {
    const maxX = viewW ? viewW * (z - 1) : 0;
    const maxY = viewH ? viewH * (z - 1) : 0;
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  }, [viewW, viewH]);

  // Zoom toward a focal point (in viewBox coords) so content under the
  // cursor / box-centre stays put.
  const zoomTo = useCallback((nextZoom, focalX, focalY) => {
    setZoom((prevZoom) => {
      const z = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
      setPan((prevPan) => {
        const fx = focalX == null ? (viewW || 0) / 2 : focalX;
        const fy = focalY == null ? (viewH || 0) / 2 : focalY;
        // Keep the focal point fixed: solve for the pan that holds
        // (focal - pan) / zoom constant across the zoom change.
        const ratio = z / prevZoom;
        const nx = fx - (fx - prevPan.x) * ratio;
        const ny = fy - (fy - prevPan.y) * ratio;
        return clampPan(nx, ny, z);
      });
      return z;
    });
  }, [viewW, viewH, clampPan]);

  const zoomIn  = useCallback(() => zoomTo(zoom * ZOOM_STEP), [zoom, zoomTo]);
  const zoomOut = useCallback(() => zoomTo(zoom / ZOOM_STEP), [zoom, zoomTo]);
  const reset   = useCallback(() => {
    setZoom(defaultZoom);
    setPan({
      x: -((viewW || 0) * (defaultZoom - 1)) / 2,
      y: -((viewH || 0) * (defaultZoom - 1)) / 2,
    });
  }, [defaultZoom, viewW, viewH]);

  // Convert a pointer event to viewBox coordinates using the SVG's
  // on-screen rect (the viewBox is fit with xMidYMid meet).
  const toViewBox = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg || !viewW || !viewH) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 0, y: 0 };
    // meet → uniform scale, letterboxed; find the smaller axis scale.
    const scale = Math.min(rect.width / viewW, rect.height / viewH);
    const offX = (rect.width  - viewW * scale) / 2;
    const offY = (rect.height - viewH * scale) / 2;
    return {
      x: (e.clientX - rect.left - offX) / scale,
      y: (e.clientY - rect.top  - offY) / scale,
    };
  }, [viewW, viewH]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const { x, y } = toViewBox(e);
    const factor = Math.exp(-e.deltaY * WHEEL_SENSITIVITY);
    zoomTo(zoom * factor, x, y);
  }, [zoom, toViewBox, zoomTo]);

  const onPointerDown = useCallback((e) => {
    // Left button only; ignore clicks on the zoom-control buttons.
    if (e.button !== 0) return;
    drag.current = {
      startX: e.clientX, startY: e.clientY,
      panX: pan.x, panY: pan.y, moved: false,
    };
  }, [pan]);

  const onPointerMove = useCallback((e) => {
    const d = drag.current;
    if (!d) return;
    const svg = svgRef.current;
    if (!svg || !viewW || !viewH) return;
    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width / viewW, rect.height / viewH) || 1;
    const dx = (e.clientX - d.startX) / scale;
    const dy = (e.clientY - d.startY) / scale;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) d.moved = true;
    setPan(clampPan(d.panX + dx, d.panY + dy, zoom));
  }, [viewW, viewH, zoom, clampPan]);

  const endDrag = useCallback(() => { drag.current = null; }, []);

  // Native wheel listener — React's onWheel is passive, so preventDefault
  // there is ignored and the page scrolls instead of the map zooming.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const transform = `translate(${pan.x.toFixed(2)} ${pan.y.toFixed(2)}) scale(${zoom.toFixed(4)})`;

  const svgHandlers = {
    ref: svgRef,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerLeave: endDrag,
    style: { cursor: drag.current?.moved ? 'grabbing' : 'grab' },
  };

  // "Zoomed" / "can zoom out" are measured against the default view (which
  // may itself be a centred defaultZoom > 1), so Reset is only enabled once
  // the user has actually moved away from that default.
  const atDefault =
    Math.abs(zoom - defaultZoom) < 0.001 &&
    Math.abs(pan.x - defaultPan.x) < 0.5 &&
    Math.abs(pan.y - defaultPan.y) < 0.5;

  return {
    zoom, panX: pan.x, panY: pan.y, transform,
    svgHandlers, zoomIn, zoomOut, reset,
    isZoomed: !atDefault,
    canZoomIn: zoom < MAX_ZOOM - 0.001,
    canZoomOut: zoom > MIN_ZOOM + 0.001,
  };
}

// Floating +/−/reset control. Sits bottom-right of the map so it clears the
// Legend (bottom-left) and the India-snapshot box (top-right).
export function ZoomControls({ onZoomIn, onZoomOut, onReset, canZoomIn = true, canZoomOut = true, isZoomed = false }) {
  return (
    <div style={{
      position: 'absolute', bottom: 18, right: 18, zIndex: 8,
      display: 'flex', flexDirection: 'column', gap: 1,
      background: 'rgba(253,250,242,0.94)',
      border: `1px solid ${C.border}`, borderRadius: 10,
      overflow: 'hidden', backdropFilter: 'blur(8px)',
      boxShadow: '0 8px 24px rgba(45,42,38,0.12)',
    }}>
      <ZoomButton label="Zoom in"  onClick={onZoomIn}  disabled={!canZoomIn}>+</ZoomButton>
      <div style={{ height: 1, background: C.border }}/>
      <ZoomButton label="Zoom out" onClick={onZoomOut} disabled={!canZoomOut}>−</ZoomButton>
      <div style={{ height: 1, background: C.border }}/>
      <ZoomButton label="Reset view" onClick={onReset} disabled={!isZoomed} small>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-7 3.3"/>
          <path d="M3 4v4h4"/>
        </svg>
      </ZoomButton>
    </div>
  );
}

function ZoomButton({ children, onClick, label, disabled, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      // Stop the SVG's pan-drag from starting when the user presses a button.
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        width: 34, height: small ? 30 : 34,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? C.fg3 : C.fg1,
        opacity: disabled ? 0.45 : 1,
        fontFamily: "'DM Sans', sans-serif",
        fontSize: small ? 13 : 19, lineHeight: 1, fontWeight: 500,
        transition: 'background 120ms',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = C.bg2; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}
