import React, {
  createContext,
  useContext,
  useState,
  useCallback
} from "react"

const ToastCtx = createContext(null)

export function ToastProvider({
  children
}) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((
    message,
    type = "info",
    duration = 4000
  ) => {
    const id =
      Date.now().toString() +
      Math.random().toString(36).slice(2)
    setToasts(t => [
      ...t,
      { id, message, type }
    ])
    setTimeout(
      () => setToasts(t =>
        t.filter(x => x.id !== id)
      ),
      duration
    )
  }, [])

  const remove = useCallback(id => {
    setToasts(t =>
      t.filter(x => x.id !== id)
    )
  }, [])

  const toast = {
    success: (m, d) => add(m, "success", d),
    error:   (m, d) => add(m, "error",   d),
    warning: (m, d) => add(m, "warning", d),
    info:    (m, d) => add(m, "info",    d),
  }

  const COLORS = {
    success: {
      bg:"#dcfce7", border:"#16a34a",
      color:"#166534", icon:"✓"
    },
    error: {
      bg:"#fee2e2", border:"#dc2626",
      color:"#7f1d1d", icon:"✕"
    },
    warning: {
      bg:"#fef9c3", border:"#d97706",
      color:"#78350f", icon:"⚠"
    },
    info: {
      bg:"#dbeafe", border:"#2563eb",
      color:"#1e3a8a", icon:"ℹ"
    },
  }

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div style={{
        position:"fixed", bottom:24,
        right:24, zIndex:9999,
        display:"flex",
        flexDirection:"column",
        gap:10, maxWidth:360,
      }}>
        {toasts.map(t => {
          const c = COLORS[t.type]
          return (
            <div key={t.id} style={{
              background:   c.bg,
              border:
                `1px solid ${c.border}`,
              borderLeft:
                `4px solid ${c.border}`,
              borderRadius: 10,
              padding:      "12px 16px",
              display:      "flex",
              alignItems:   "center",
              gap:          10,
              boxShadow:
                "0 4px 20px rgba(0,0,0,0.1)",
              animation:
                "fadeInUp 0.3s ease",
            }}>
              <span style={{
                fontWeight:700,
                color:c.border,
                fontSize:"1rem",
                flexShrink:0,
              }}>
                {c.icon}
              </span>
              <span style={{
                flex:1,
                fontSize:"0.875rem",
                color:c.color,
                fontWeight:500,
              }}>
                {t.message}
              </span>
              <button
                onClick={() => remove(t.id)}
                style={{
                  background:"none",
                  border:"none",
                  cursor:"pointer",
                  color:c.color,
                  fontWeight:700,
                  fontSize:"1rem",
                  padding:0,
                  flexShrink:0,
                }}
              >×</button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error(
    "useToast must be inside ToastProvider"
  )
  return ctx
}

export default ToastProvider
