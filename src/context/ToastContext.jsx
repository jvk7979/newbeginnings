import { createContext, useContext, useState, useCallback } from 'react';
import { C } from '../tokens';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: 80, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
          {toasts.map(t => {
            const colors = {
              success: { bg: C.successBg, border: C.success + '44', text: C.success },
              error:   { bg: C.dangerBg,  border: C.danger  + '44', text: C.danger  },
              info:    { bg: C.accentBg,  border: C.accent  + '44', text: C.accent  },
            };
            const col = colors[t.type] || colors.success;
            return (
              <div key={t.id} style={{ padding: '10px 16px', borderRadius: 8, background: col.bg, border: `1px solid ${col.border}`, color: col.text, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', animation: 'toastIn 220ms cubic-bezier(0.16,1,0.3,1)', whiteSpace: 'nowrap' }}>
                {t.message}
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }
