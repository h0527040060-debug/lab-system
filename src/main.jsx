import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './store/AppContext.jsx'
import { ToastProvider } from './store/ToastContext.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div dir="rtl" style={{ padding: 24, fontFamily: 'monospace', background: '#fff1f2', minHeight: '100vh' }}>
          <h2 style={{ color: '#dc2626' }}>שגיאת JavaScript — נא שלח את הטקסט הזה:</h2>
          <pre style={{ background: '#fee2e2', padding: 16, borderRadius: 8, overflowX: 'auto', fontSize: 13 }}>
            {String(this.state.error)}{'\n'}{this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
)
