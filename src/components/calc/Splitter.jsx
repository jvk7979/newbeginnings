import { useRef } from 'react';

// Vertical splitter handle that drags left/right to resize whatever panel
// sits to its LEFT against whatever sits to its right inside the same flex
// container. Reports the new left-panel width as a percentage of the full
// parent container (which can include fixed-width siblings — callers
// translate the reported pct into a layout however suits them).
//
// Keyboard arrows nudge ±2 percentage points for accessibility. Pointer-
// capture means the drag keeps tracking even if the cursor leaves the
// handle. The default aria label names the Calculations panels; pass
// ariaLabel for other surfaces (Atlas map ↔ ranking, etc.).
export default function Splitter({
  currentWidth,
  onResize,
  min = 30,
  max = 80,
  ariaLabel = 'Resize Assumptions / Output panels',
  className = '',
}) {
  const ref = useRef(null);
  const dragRef = useRef(false);

  const onPointerDown = (e) => {
    dragRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.cursor = 'col-resize';
  };

  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const container = ref.current?.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0) return;
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    onResize(Math.max(min, Math.min(max, pct)));
  };

  const endDrag = (e) => {
    if (!dragRef.current) return;
    dragRef.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    document.body.style.cursor = '';
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); onResize(Math.max(min, currentWidth - 2)); }
    if (e.key === 'ArrowRight') { e.preventDefault(); onResize(Math.min(max, currentWidth + 2)); }
    if (e.key === 'Home')       { e.preventDefault(); onResize(min); }
    if (e.key === 'End')        { e.preventDefault(); onResize(max); }
  };

  return (
    <div
      ref={ref}
      className={`calc-splitter ${className}`.trim()}
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={Math.round(currentWidth)}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label={ariaLabel}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      onKeyDown={onKeyDown}>
      <div className="calc-splitter-grip" aria-hidden="true" />
    </div>
  );
}
