import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { C } from '../tokens';

const ToastContext = createContext(null);

const COLORS = {
  success: { bg: C.success, text: '#fff' },
  error:   { bg: C.danger,  text: '#fff' },
  info:    { bg: C.fg2,     text: '#fff' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  // action = { label: string, onClick: fn } — shows an Undo button
  // toasts with action stay 5s; plain toasts 3.2s
  const showToast = useCallback((message, type = 'success', action = null) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type, action }]);
    timers.current[id] = setTimeout(() => dismiss(id), action ? 5000 : 3200);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, right: 20, left: 20, maxWidth: 400, marginLeft: 'auto', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => {
          const col = COLORS[t.type] || COLORS.info;
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: col.bg, color: col.text, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, padding: '10px 14px', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.20)', animation: 'toastIn 220ms cubic-bezier(0.16,1,0.3,1)', pointerEvents: 'all', maxWidth: 340, minWidth: 180 }}>
              <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
              {t.action && (
                <button onClick={() => { t.action.onClick(); dismiss(t.id); }}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: col.text, background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 4, cursor: 'pointer', padding: '4px 10px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  {t.action.label}
                </button>
              )}
              <button onClick={() => dismiss(t.id)}
                style={{ background: 'none', border: 'none', color: col.text, cursor: 'pointer', opacity: 0.65, fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0 }}>×</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }
