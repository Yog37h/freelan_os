import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Global error boundary. Catches unhandled errors in the React tree
 * and shows a recovery UI instead of crashing the entire app.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0a0a',
            color: '#ffffff',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 480, padding: '2rem' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: 28,
              }}
            >
              ⚠️
            </div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
                background: 'linear-gradient(to bottom, #fff, rgba(255,255,255,0.6))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                color: '#a1a1aa',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
              }}
            >
              An unexpected error occurred. You can try refreshing the page or going back to the
              dashboard.
            </p>
            {this.state.error && (
              <pre
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '1rem',
                  fontSize: '0.8rem',
                  color: '#ef4444',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  marginBottom: '1.5rem',
                  maxHeight: 120,
                  overflow: 'auto',
                  textAlign: 'left',
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.65rem 1.5rem',
                  background: '#ffffff',
                  color: '#000000',
                  border: 'none',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Refresh Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '0.65rem 1.5rem',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
