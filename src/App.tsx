import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { NavigationBar } from './components/NavigationBar';
import { HomeView } from './views/HomeView';
import { ChatView } from './views/ChatView';
import { LiveCallView } from './views/LiveCallView';
import { MemoryView } from './views/MemoryView';
import { ActivityView } from './views/ActivityView';
import { AuthView } from './views/AuthView';
import { ProfileModal } from './components/ProfileModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  api,
  getBaseApiUrl,
  getUserToken,
  getCurrentUser,
  setCurrentUser as saveCurrentUser,
  clearAuthSession
} from './services/api';
import { AgentStatus, HabitatState, UserProfile } from './types';
import { Settings, X, Save } from 'lucide-react';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(() => {
    const token = getUserToken();
    return token ? getCurrentUser() : null;
  });
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(getBaseApiUrl());

  const isLiveView = location.pathname === '/live';

  const refreshState = async () => {
    if (!getUserToken()) return;
    try {
      const st = await api.getStatus().catch(() => null);
      if (st) setStatus(st);
    } catch (err) {
      console.error('Error refrescando estado general:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshState();
      const interval = setInterval(refreshState, 15000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleAuthenticated = (user: UserProfile) => {
    setCurrentUserState(user);
    saveCurrentUser(user);
    refreshState();
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUserState(null);
    setShowProfile(false);
    // Limpieza estricta de memoria local del chat
    localStorage.removeItem('danonino_local_chat');
    localStorage.removeItem('danonino_active_conv');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('danonino_api_url', customApiUrl.trim());
    setShowSettings(false);
    refreshState();
  };

  // Si no hay usuario autenticado o sesión activa, mostrar pantalla de bienvenida / login
  if (!currentUser || !getUserToken()) {
    return (
      <>
        <AuthView
          onAuthenticated={handleAuthenticated}
          onOpenSettings={() => setShowSettings(true)}
        />

        {showSettings && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="glass-panel p-5 rounded-3xl max-w-sm w-full space-y-4 border border-danonino-cyan/50 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-danonino-cyan" />
                  <h3 className="text-sm font-bold text-slate-100">Conexión con Danonino Core</h3>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    URL del Backend Termux (API)
                  </label>
                  <input
                    type="text"
                    value={customApiUrl}
                    onChange={(e) => setCustomApiUrl(e.target.value)}
                    placeholder="https://túnel.trycloudflare.com/api"
                    className="w-full bg-danonino-card text-xs text-slate-100 px-3 py-2 rounded-xl border border-danonino-border focus:outline-none focus:border-danonino-cyan font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Predeterminado mundial: Cloudflare Tunnel de Termux
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('danonino_api_url');
                      setCustomApiUrl(getBaseApiUrl());
                    }}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Restablecer
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 bg-danonino-cyan text-danonino-bg font-bold rounded-xl text-xs hover:opacity-90 active:scale-95 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar y Conectar</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-danonino-bg text-slate-100 flex flex-col font-sans selection:bg-danonino-violet">
      {/* Cabecera Superior Fija con Perfil de Usuario */}
      {!isLiveView && (
        <Header
          status={status}
          user={currentUser}
          onRefresh={refreshState}
          onOpenSettings={() => setShowSettings(true)}
          onOpenProfile={() => setShowProfile(true)}
        />
      )}

      {/* Contenido Principal con Rutas */}
      <main className="flex-1 w-full max-w-md mx-auto">
        <Routes>
          <Route path="/" element={<HomeView status={status} onRefresh={refreshState} />} />
          <Route path="/chat" element={<ChatView status={status} />} />
          <Route path="/live" element={<LiveCallView />} />
          <Route path="/memory" element={<MemoryView />} />
          <Route path="/activity" element={<ActivityView />} />
        </Routes>
      </main>

      {/* Barra de Navegación Inferior Móvil */}
      <NavigationBar />

      {/* Modal de Perfil de Usuario */}
      <ProfileModal
        user={currentUser}
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onLogout={handleLogout}
        onUserUpdated={(u) => {
          setCurrentUserState(u);
          saveCurrentUser(u);
        }}
      />

      {/* Modal de Configuración y Enlace Backend */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel p-5 rounded-3xl max-w-sm w-full space-y-4 border border-danonino-cyan/50 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-danonino-cyan" />
                <h3 className="text-sm font-bold text-slate-100">Conexión con Danonino Core</h3>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  URL del Backend Termux (API)
                </label>
                <input
                  type="text"
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                  placeholder="https://túnel.trycloudflare.com/api"
                  className="w-full bg-danonino-card text-xs text-slate-100 px-3 py-2 rounded-xl border border-danonino-border focus:outline-none focus:border-danonino-cyan font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('danonino_api_url');
                    setCustomApiUrl(getBaseApiUrl());
                  }}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Restablecer
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-danonino-cyan text-danonino-bg font-bold rounded-xl text-xs hover:opacity-90 active:scale-95 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar y Conectar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
