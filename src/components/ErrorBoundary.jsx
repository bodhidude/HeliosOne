import { Component } from 'react';

/**
 * ErrorBoundary catches unhandled rendering errors in child components,
 * preventing the entire app from white-screening.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] glass-panel border-alert-red/30 text-center p-8 m-4">
          <div className="text-alert-red text-sm font-bold font-mono tracking-widest mb-2">
            [ SYSTEM FAULT DETECTED ]
          </div>
          <div className="text-slate-400 text-xs font-mono mb-4">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded border border-slate-600 cursor-pointer transition-all"
          >
            REINITIALIZE
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
