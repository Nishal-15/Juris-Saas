import React from "react"

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          height: "100%", minHeight: "60vh",
          padding: "20px", textAlign: "center"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>⚖️</div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            color: "var(--bg-dark, #0d0f1a)",
            marginBottom: "16px"
          }}>
            Something went wrong
          </h2>
          <p style={{
            color: "#64748b", marginBottom: "24px",
            maxWidth: "400px", lineHeight: "1.6"
          }}>
            This section had an error. Your data is safe.
          </p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
            style={{ padding: "10px 24px" }}
          >
            Reload Page
          </button>
          
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              marginTop: "32px", padding: "16px",
              background: "#fee2e2", color: "#b91c1c",
              borderRadius: "8px", maxWidth: "80%",
              overflowX: "auto", textAlign: "left",
              fontSize: "14px"
            }}>
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
