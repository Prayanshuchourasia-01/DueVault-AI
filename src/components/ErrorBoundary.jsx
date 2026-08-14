import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[DueVault ErrorBoundary Caught Error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearDataAndReload = () => {
    if (confirm("Reset local app cache? Your routines and data in Firestore will remain safe.")) {
      localStorage.removeItem('duevault_perm_banner_dismissed');
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-200 font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full space-y-6 shadow-2xl animate-fade-in relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="mx-auto bg-rose-500/20 p-4 rounded-2xl w-fit text-rose-400">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Something unexpected occurred</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                The application encountered an unexpected runtime state. Your data remains safe.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-left font-mono text-[11px] text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <RefreshCw className="w-4 h-4" />
                Reload DueVault
              </button>
              <button
                onClick={this.handleClearDataAndReload}
                className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
              >
                Reset App Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
