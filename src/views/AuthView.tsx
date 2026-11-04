import React, { useState } from 'react';
import { api } from '../services/api';
import { UserProfile } from '../types';
import { Shield, Sparkles, User, Lock, ArrowRight, UserPlus, LogIn, AlertCircle } from 'lucide-react';

interface AuthViewProps {
  onAuthenticated: (user: UserProfile) => void;
  onOpenSettings: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated, onOpenSettings }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register(username.trim(), password, displayName.trim());
        onAuthenticated(res.user);
      } else {
        const res = await api.login(username.trim(), password);
        onAuthenticated(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Error en autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-danonino-bg flex flex-col justify-center items-center px-4 py-8 text-slate-100">
      <div className="w-full max-w-sm space-y-6">
        {/* Cabecera y Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-danonino-card border border-danonino-cyan/40 shadow-neon">
            <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-danonino-cyan via-white to-danonino-violet">
              D
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Danonino Core</h1>
          <p className="text-xs text-slate-400">
            Inteligencia Conversacional Privada con Aislamiento Estricto
          </p>
        </div>

        {/* Tarjeta de Autenticación */}
        <div className="glass-panel p-6 rounded-3xl border border-danonino-border/60 shadow-2xl space-y-5">
          {/* Selector de Pestaña */}
          <div className="grid grid-cols-2 p-1 bg-danonino-card/80 rounded-2xl border border-danonino-border">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                !isRegister
                  ? 'bg-danonino-cyan text-danonino-bg shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isRegister
                  ? 'bg-danonino-cyan text-danonino-bg shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Registro</span>
            </button>
          </div>

          {/* Mensaje de Error */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nombre o Apodo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Tu nombre (ej. Dan)"
                    className="w-full bg-danonino-card text-xs text-slate-100 pl-9 pr-3 py-2.5 rounded-xl border border-danonino-border focus:outline-none focus:border-danonino-cyan transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Usuario
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="ej. mi_usuario"
                  className="w-full bg-danonino-card text-xs text-slate-100 pl-9 pr-3 py-2.5 rounded-xl border border-danonino-border focus:outline-none focus:border-danonino-cyan font-mono transition-all"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Identificador único de 3 a 30 caracteres.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-danonino-card text-xs text-slate-100 pl-9 pr-3 py-2.5 rounded-xl border border-danonino-border focus:outline-none focus:border-danonino-cyan font-mono transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full mt-2 py-2.5 px-4 bg-danonino-cyan text-danonino-bg font-bold rounded-xl text-xs hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none shadow-neon"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-danonino-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Crear Cuenta Aislada' : 'Iniciar Sesión Privada'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Garantía de Aislamiento */}
          <div className="pt-2 border-t border-danonino-border/40 text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3 h-3 text-danonino-cyan" />
            <span>Tus conversaciones y recuerdos no se comparten con nadie.</span>
          </div>
        </div>

        {/* Ajustes de Conexión del Backend */}
        <div className="text-center">
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-[11px] text-slate-500 hover:text-danonino-cyan underline transition-colors"
          >
            Configurar URL del Servidor / Red
          </button>
        </div>
      </div>
    </div>
  );
};
