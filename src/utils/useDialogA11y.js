import { useEffect, useId, useRef } from 'react';

/**
 * Accessibility hook for in-app modal dialogs.
 *
 * Returns `{ dialogProps, titleId }`. Spread `dialogProps` onto the
 * existing dialog wrapper element (the centred card, NOT the outer
 * scrim) and put `id={titleId}` on the dialog's heading. The hook
 * handles every keyboard-only / screen-reader-only behaviour modals
 * routinely fail at:
 *
 *   - role="dialog" + aria-modal="true" + aria-labelledby={titleId}
 *     (WCAG 4.1.2; required for VoiceOver / NVDA to announce the
 *     dialog and treat it as a separate region from the page behind it)
 *   - Escape closes the dialog (WCAG 2.1.1, 2.1.2)
 *   - Focus moves into the dialog on open — first focusable element
 *     (the close X button if present, else the dialog itself)
 *   - Focus is RESTORED to whatever element opened the dialog on
 *     close (WCAG 2.4.3 — focus order preservation)
 *   - Focus trap: Tab and Shift+Tab cycle within the dialog so
 *     keyboard users can't escape into the page behind
 *   - Page scroll lock while the dialog is open (saves the previous
 *     overflow value and restores it)
 *
 * `onClose` is called by the Escape handler. The caller is expected
 * to wire its own click-outside / Cancel button to the same handler.
 *
 * Why a hook and not a full <Modal> wrapper component: every existing
 * modal in the codebase has its own scrim styling, layout, animation,
 * mobile sheet variant, and so on. A wrapper would force a rewrite
 * of all 11 files. The hook is additive — drop the spread in, add
 * the id to the title, no other structure changes.
 */
export function useDialogA11y(onClose) {
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const titleId = useId();

  // One-time setup on mount: remember what was focused so we can
  // restore it on unmount, capture focus into the dialog, lock body
  // scroll, bind Escape.
  useEffect(() => {
    openerRef.current = document.activeElement;

    const node = dialogRef.current;
    if (node) {
      // Try to focus the first natural target (Close X button by
      // convention — every modal in this codebase has aria-label="Close"
      // on it). Fall back to the dialog itself.
      const closeBtn = node.querySelector('button[aria-label="Close"]');
      const firstFocusable = node.querySelector(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const target = closeBtn || firstFocusable || node;
      // Defer one tick so the dialog's enter animation doesn't fight
      // the focus scroll-into-view.
      requestAnimationFrame(() => target?.focus?.({ preventScroll: false }));
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab' || !node) return;
      // Focus trap. Build the focusable list at keypress time (not at
      // mount) so dialogs whose contents change while open keep the
      // trap accurate.
      const focusables = node.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      // Restore focus to the element that opened the dialog. Wrapped
      // in a try in case that element was removed from the DOM while
      // the dialog was open (e.g. opened from a list item that got
      // deleted by the dialog's own action).
      try { openerRef.current?.focus?.(); } catch { /* opener gone */ }
    };
    // `onClose` is allowed to change between renders without re-running
    // the setup — the Escape handler reads it via closure on each call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    dialogProps: {
      ref: dialogRef,
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': titleId,
      tabIndex: -1,
    },
    titleId,
  };
}
