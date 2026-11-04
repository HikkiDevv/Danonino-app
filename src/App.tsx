import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { NavigationBar } from './components/NavigationBar';
import { HomeView } from './views/HomeView';
import { ChatView } from './views/ChatView';
import { HabitatView } from './views/HabitatView';
import { MemoryView } from './views/MemoryView';
import { EvolutionView } from './views/EvolutionView';
import { ActivityView } from './views/ActivityView';
import { api, getBaseApiUrl, getAuthToken } from './services/api';
import { AgentStatus, HabitatState } from './types';
import { Settings, X, Save, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [habitat, setHabitat] = useState<HabitatState | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(getBaseApiUrl());
  const [customToken, setCustomToken] = useState(getAuthToken());

  const refreshState = async () => {
    try {
      const [st, hab] = await Promise.all([
        api.getStatus().catch(() => null),
        api.getHabitat().catch(() => null)
      ]);
      if (st) setStatus(st);
      if (hab) setHabitat(hab);
    } catch (err) {
      console.error('Error refrescando estado general:', err);
    }
  };

  useEffect(() => {
    refreshState();
    // Sondeo suave cada 15 segundos
    const interval = setInterval(refreshState, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('danonino_api_url', customApiUrl.trim());
    localStorage.setItem('danonino_api_token', customToken.trim());
    setShowSettings(false);
    refreshState();
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-danonino-bg text-slate-100 flex flex-col font-sans selection:bg-danonino-violet">
        {/* Cabecera Superior Fija */}
        <Header
          status={status}
          onRefresh={refreshState}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Contenido Principal con Rutas */}
        <main className="flex-1 w-full max-w-md mx-auto">
          <Routes>
            <Route path="/" element={<HomeView status={status} habitat={habitat} onRefresh={refreshState} />} />
            <Route path="/chat" element={<ChatView status={status} />} />
            <Route path="/habitat" element={<HabitatView habitat={habitat} status={status} />} />
            <Route path="/memory" element={<MemoryView />} />
            <Route path="/evolution" element={<EvolutionView />} />
            <Route path="/activity" element={<ActivityView />} />
          </Routes>
        </main>

        {/* Barra de Navegación Inferior Móvil */}
        <NavigationBar />

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
                    placeholder="http://127.0.0.1:8768/api o https://mi-tunel.com/api"
                    className="w-full bg-danonino-card text-xs text-slate-100 px-3 py-2 rounded-xl border border-danonino-border focus:outline-none focus:border-danonino-cyan font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Predeterminado local en Termux: <code>http://127.0.0.1:8768/api</code>
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Token de Autenticación
                  </label>
                  <input
                    type="password"
                    value={customToken}
                    onChange={(e) => setCustomToken(e.target.value)}
                    placeholder="X-Danonino-Token"
                    className="w-full bg-danonino-card text-xs text-slate-100 px-3 py-2 rounded-xl border border-danonino-border focus:outline-none focus:border-danonino-cyan font-mono"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem('danonino_api_url');
                      localStorage.removeItem('danonino_api_token');
                      setCustomApiUrl(getBaseApiUrl());
                      setCustomToken(getAuthToken());
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
    </BrowserRouter>
  );
};

export default App;
