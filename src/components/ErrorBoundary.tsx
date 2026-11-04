import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorText: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorText: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorText: error?.message || 'Error desconocido' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-danonino-bg text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-panel p-6 rounded-3xl max-w-sm w-full border border-danonino-border/80 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Sincronización en curso</h2>
              <p className="text-xs text-slate-400 mt-1">
                La interfaz se está reconectando con Danonino Core.
              </p>
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, errorText: '' });
                window.location.reload();
              }}
              className="w-full py-2.5 px-4 bg-danonino-cyan text-danonino-bg font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-neon"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restablecer Pantalla</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
