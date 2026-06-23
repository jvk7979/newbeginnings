// src/pages/WorldMarket/WorldMap.jsx
//
// SVG choropleth world map with zoom, pan, and hover tooltip.
// Zoom: scroll wheel (zoom-at-cursor) + +/- buttons.
// Pan: click-drag.
// Tooltip: country name, import value, top products on hover.

import { useMemo, memo, useState, useRef, useEffect, useCallback } from 'react';
import { feature } from 'topojson-client';
import worldTopo from 'world-atlas/countries-110m.json';
import { getQuickProducts, fmtUsd } from './comtradeDataset';

// ── Projection ─────────────────────────────────────────────────────────────

const W = 960, H = 480;
const LAT_MIN = -58, LAT_MAX = 84;
const SCALE_MIN = 1, SCALE_MAX = 10;

function project(lng, lat) {
  const x = ((lng + 180) / 360) * W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H;
  return [x, y];
}

function ringToPath(ring) {
  let d = '', prevLng = null, penDown = false;
  for (const coord of ring) {
    const lng = coord[0], lat = coord[1];
    if (lat < LAT_MIN || lat > LAT_MAX) { penDown = false; prevLng = null; continue; }
    if (prevLng !== null && Math.abs(lng - prevLng) > 180) penDown = false;
    const [x, y] = project(lng, lat);
    d += (penDown ? 'L' : 'M') + x.toFixed(1) + ',' + y.toFixed(1);
    penDown = true; prevLng = lng;
  }
  return d ? d + 'Z' : '';
}

function featurePath(f) {
  const g = f.geometry;
  if (!g) return '';
  const rings = g.type === 'Polygon'
    ? g.coordinates
    : g.type === 'MultiPolygon' ? g.coordinates.flat() : [];
  return rings.map(ringToPath).join(' ');
}

const WORLD_GEO = feature(worldTopo, worldTopo.objects.countries);

const COUNTRY_PATHS = WORLD_GEO.features
  .filter(f => Number(f.id) !== 10)
  .map(f => ({ code: Number(f.id), name: f.properties?.name || '', d: featurePath(f) }))
  .filter(c => c.d);

// ── Colour ─────────────────────────────────────────────────────────────────

// 12-colour vivid political palette — green, orange, blue, red, purple,
// yellow, teal, pink, lime, deep-orange, indigo, emerald.
// Each country gets one hue by (code % 12); neighbouring countries almost
// always land on different slots because their ISO codes differ enough.
const PALETTE_HUES = [124, 28, 211, 4, 272, 48, 184, 332, 82, 18, 238, 162];

function countryFill(code, t) {
  if (t == null) return '#c8cdd4';          // grey — no trade relationship
  const hue = PALETTE_HUES[code % 12];
  // Lightness shifts slightly with export volume (bigger → darker/richer).
  const lig = Math.round(55 - t * 20);     // 55% → 35%
  return `hsl(${hue}, 72%, ${lig}%)`;
}

// ── Transform helpers ──────────────────────────────────────────────────────

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function constrainTransform(tx, ty, scale) {
  return {
    scale,
    tx: clamp(tx, W * (1 - scale), 0),
    ty: clamp(ty, H * (1 - scale), 0),
  };
}

// ── Country path (memoised) ────────────────────────────────────────────────

const CountryPath = memo(function CountryPath({ d, fill, stroke, strokeWidth, code, onSelect, onEnter, onLeave }) {
  return (
    <path
      d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth}
      style={{ cursor: 'pointer', transition: 'fill 120ms' }}
      onClick={() => onSelect(code)}
      onMouseEnter={() => onEnter(code)}
      onMouseLeave={onLeave}
    />
  );
});

// ── Main component ─────────────────────────────────────────────────────────

export default function WorldMap({ partnerData, selectedCode, onSelect, onHover }) {
  const svgRef       = useRef(null);
  const dragRef      = useRef({ active: false });
  const transformRef = useRef({ scale: 1, tx: 0, ty: 0 });

  const [transform,    setTransformState] = useState({ scale: 1, tx: 0, ty: 0 });
  const [hoveredCode,  setHoveredCode]    = useState(null);
  const [tooltip,      setTooltip]        = useState({ x: 0, y: 0 });

  // Keep ref in sync so wheel/drag handlers always have fresh values.
  const setTransform = useCallback((next) => {
    const val = typeof next === 'function' ? next(transformRef.current) : next;
    transformRef.current = val;
    setTransformState(val);
  }, []);

  const maxVal = useMemo(() => {
    if (!partnerData) return 1;
    return Math.max(1, ...Object.values(partnerData).map(d => d.value_usd));
  }, [partnerData]);

  // ── Wheel zoom (must be non-passive to call preventDefault) ───────────────
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const pt = el.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const ctm = el.getScreenCTM();
      if (!ctm) return;
      const { x: mx, y: my } = pt.matrixTransform(ctm.inverse());
      const factor = e.deltaY < 0 ? 1.25 : 1 / 1.25;
      setTransform(prev => {
        const ns = clamp(prev.scale * factor, SCALE_MIN, SCALE_MAX);
        const r  = ns / prev.scale;
        return constrainTransform(mx - (mx - prev.tx) * r, my - (my - prev.ty) * r, ns);
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [setTransform]);

  // ── Drag-to-pan ───────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    dragRef.current = {
      active: true,
      startX: e.clientX, startY: e.clientY,
      startTx: transformRef.current.tx,
      startTy: transformRef.current.ty,
    };
    e.currentTarget.style.cursor = 'grabbing';
  }, []);

  const handleMouseUp = useCallback((e) => {
    dragRef.current.active = false;
    e.currentTarget.style.cursor = 'grab';
  }, []);

  const handleMouseMove = useCallback((e) => {
    // Update tooltip position relative to map container
    const col = svgRef.current?.closest('.wm-map-col');
    if (col) {
      const r = col.getBoundingClientRect();
      setTooltip({ x: e.clientX - r.left, y: e.clientY - r.top });
    }

    const drag = dragRef.current;
    if (!drag.active) return;
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const pxToSvg = W / rect.width; // SVG units per screen pixel
    const dx = (e.clientX - drag.startX) * pxToSvg;
    const dy = (e.clientY - drag.startY) * pxToSvg;
    setTransform(prev => constrainTransform(drag.startTx + dx, drag.startTy + dy, prev.scale));
  }, [setTransform]);

  // ── Hover tracking ────────────────────────────────────────────────────────
  const handleEnter = useCallback((code) => {
    setHoveredCode(code);
    onHover?.(code);
  }, [onHover]);

  const handleLeave = useCallback(() => {
    setHoveredCode(null);
    onHover?.(null);
  }, [onHover]);

  const handleMouseLeave = useCallback((e) => {
    dragRef.current.active = false;
    e.currentTarget.style.cursor = 'grab';
    setHoveredCode(null);
    onHover?.(null);
  }, [onHover]);

  // ── Zoom buttons ──────────────────────────────────────────────────────────
  function zoomAt(factor) {
    setTransform(prev => {
      const ns = clamp(prev.scale * factor, SCALE_MIN, SCALE_MAX);
      const cx = W / 2, cy = H / 2;
      const r  = ns / prev.scale;
      return constrainTransform(cx - (cx - prev.tx) * r, cy - (cy - prev.ty) * r, ns);
    });
  }

  // ── Tooltip content ───────────────────────────────────────────────────────
  const hovPartner  = hoveredCode != null ? partnerData?.[hoveredCode] : null;
  const hovName     = COUNTRY_PATHS.find(c => c.code === hoveredCode)?.name || '';
  const quickProds  = hoveredCode != null ? getQuickProducts(hoveredCode) : [];

  // ── Render ────────────────────────────────────────────────────────────────
  const { scale, tx, ty } = transform;

  return (
    <>
      {/* SVG map */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', width: '100%', height: '100%', position: 'absolute', inset: 0, cursor: 'grab' }}
        aria-label="World map — India's exports by destination"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <rect width={W} height={H} fill="var(--c-bg0)" />
        <g transform={`translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${scale.toFixed(4)})`}>
          {COUNTRY_PATHS.map(({ code, d }) => {
            const partner = partnerData?.[code];
            const t = partner ? Math.pow(partner.value_usd / maxVal, 0.32) : null;
            const fill = countryFill(code, t);
            const isSel = selectedCode === code;
            const isHov = hoveredCode === code;
            return (
              <CountryPath
                key={code} code={code} d={d} fill={fill}
                stroke={isSel ? 'var(--c-accent)' : isHov ? '#fff' : 'rgba(255,255,255,0.35)'}
                strokeWidth={(isSel ? 2 : isHov ? 1.2 : 0.4) / scale}
                onSelect={onSelect}
                onEnter={handleEnter}
                onLeave={handleLeave}
              />
            );
          })}
        </g>
      </svg>

      {/* Zoom buttons */}
      <div className="wm-zoom-controls">
        <button className="wm-zoom-btn" onClick={() => zoomAt(1.5)} title="Zoom in">+</button>
        <button className="wm-zoom-btn" onClick={() => zoomAt(1 / 1.5)} title="Zoom out">−</button>
        <button className="wm-zoom-btn wm-zoom-reset" onClick={() => setTransform({ scale: 1, tx: 0, ty: 0 })} title="Reset">⊙</button>
      </div>

      {/* Hover tooltip */}
      {hoveredCode != null && (
        <div
          className="wm-hover-tip"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
          onMouseEnter={() => { setHoveredCode(null); onHover?.(null); }}
        >
          <div className="wm-tip-name">{hovPartner ? hovName : hovName || `Country ${hoveredCode}`}</div>
          {hovPartner
            ? <div className="wm-tip-val">{fmtUsd(hovPartner.value_usd)} imports from India</div>
            : <div className="wm-tip-val wm-tip-nodata">No direct import data</div>
          }
          {quickProds.length > 0 && (
            <div className="wm-tip-products">
              <div className="wm-tip-prod-label">Top products</div>
              {quickProds.map(p => <div key={p} className="wm-tip-prod-item">{p}</div>)}
            </div>
          )}
        </div>
      )}
    </>
  );
}
