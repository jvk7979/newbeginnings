import { useRef } from 'react';

// Vertical splitter handle that drags left/right to resize the Assumptions
// (left) vs Output (right) panels. Reports new left-panel width as a
// percentage of its parent container. Keyboard arrows nudge ±2 percentage
// points for accessibility. Pointer-capture means the drag keeps tracking
// even if the cursor leaves the handle.
export default function Splitter({ currentWidth, onResize, min = 30, max = 80 }) {
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
      className="calc-splitter"
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={Math.round(currentWidth)}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label="Resize Assumptions / Output panels"
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
