import React, { useState, useEffect } from 'react';
import { Search, Brain, Clock, Share2, Tag, Shield, Sparkles, Filter } from 'lucide-react';
import { api } from '../services/api';
import { MemoryItem } from '../types';

export const MemoryView: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'timeline' | 'constellation'>('timeline');
  const [loading, setLoading] = useState(false);
  const [activeMemory, setActiveMemory] = useState<MemoryItem | null>(null);

  const categories = [
    { id: 'todos', label: 'Todos' },
    { id: 'Identidad', label: 'Identidad' },
    { id: 'Persona', label: 'Personas' },
    { id: 'Recuerdo', label: 'Recuerdos' },
    { id: 'Proyecto', label: 'Proyectos' },
    { id: 'Concepto', label: 'Conceptos' }
  ];

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const cat = selectedCategory === 'todos' ? '' : selectedCategory;
      const res = await api.getMemories(searchQuery, cat, 40);
      if (res.ok && res.memories) {
        setMemories(res.memories);
      }
    } catch (err: any) {
      console.error('Error cargando recuerdos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMemories();
  };

  return (
    <div className="pb-24 px-4 pt-4 max-w-md mx-auto space-y-4 animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-center justify-between glass-panel p-3.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-danonino-violet" />
          <div>
            <h2 className="text-sm font-bold text-slate-100">Memoria Viva</h2>
            <p className="text-[10px] text-slate-400">Persistencia SQLite FTS5 y Grafo</p>
          </div>
        </div>

        {/* Selector de Vista: Timeline / Constelación */}
        <div className="flex items-center bg-danonino-card p-1 rounded-xl border border-danonino-border text-xs">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              viewMode === 'timeline' ? 'bg-danonino-violet text-white font-medium' : 'text-slate-400'
            }`}
          >
            Línea
          </button>
          <button
            onClick={() => setViewMode('constellation')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              viewMode === 'constellation' ? 'bg-danonino-cyan text-danonino-bg font-bold' : 'text-slate-400'
            }`}
          >
            Grafo
          </button>
        </div>
      </div>

      {/* Buscador FTS5 */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar en recuerdos verificados..."
          className="w-full bg-danonino-card text-xs text-slate-100 placeholder:text-slate-500 pl-9 pr-4 py-2.5 rounded-xl border border-danonino-border focus:outline-none focus:border-danonino-violet transition-colors"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
      </form>

      {/* Píldoras de Categorías */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1 rounded-full text-[11px] whitespace-nowrap transition-all ${
              selectedCategory === c.id
                ? 'bg-danonino-violet text-white font-medium shadow-md shadow-danonino-violet/20'
                : 'bg-danonino-card text-slate-400 border border-danonino-border hover:text-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Vista de Constelación / Grafo Conceptual */}
      {viewMode === 'constellation' ? (
        <div className="glass-panel p-5 rounded-3xl min-h-[320px] relative overflow-hidden flex flex-col items-center justify-center border border-danonino-cyan/30">
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

          {/* Nodos de Constelación Interactivos */}
          <div className="relative z-10 w-full h-64 flex flex-wrap items-center justify-around gap-3 p-2">
            {memories.slice(0, 10).map((m, idx) => (
              <div
                key={m.id || idx}
                onClick={() => setActiveMemory(m)}
                className="cursor-pointer flex flex-col items-center p-2 rounded-2xl bg-danonino-card/80 border border-danonino-border hover:border-danonino-cyan transition-all hover:scale-105 active:scale-95 shadow-lg group max-w-[100px]"
              >
                <div
                  className="w-3.5 h-3.5 rounded-full shadow-md animate-pulse"
                  style={{ backgroundColor: m.color || '#8b5cf6' }}
                />
                <span className="text-[10px] font-medium text-slate-200 mt-1 truncate w-full text-center">
                  {m.title || m.category}
                </span>
                <span className="text-[8px] text-slate-400 font-mono">
                  {m.connections || 1} enlaces
                </span>
              </div>
            ))}
          </div>

          <div className="relative z-10 text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-2 bg-danonino-card/90 px-3 py-1 rounded-full border border-danonino-border">
            <Share2 className="w-3 h-3 text-danonino-cyan" />
            <span>Toca un nodo para ver conexiones y contenido</span>
          </div>
        </div>
      ) : (
        /* Vista de Línea de Tiempo */
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-10 text-xs text-slate-400">Consultando recuerdos SQLite...</div>
          ) : memories.length === 0 ? (
            <div className="text-center py-12 glass-panel rounded-2xl text-xs text-slate-400">
              No se encontraron recuerdos con los criterios especificados.
            </div>
          ) : (
            memories.map((m) => (
              <div
                key={m.id}
                onClick={() => setActiveMemory(m)}
                className="glass-panel p-3.5 rounded-2xl border border-danonino-border/70 hover:border-danonino-violet/60 transition-all cursor-pointer space-y-2 active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${m.color || '#8b5cf6'}20`,
                      color: m.color || '#c084fc'
                    }}
                  >
                    {m.category || 'General'}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{m.timestamp ? String(m.timestamp).slice(0, 16) : 'Reciente'}</span>
                  </div>
                </div>

                {m.title && (
                  <h4 className="text-xs font-bold text-slate-200">{m.title}</h4>
                )}

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {m.text}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de Detalle de Recuerdo */}
      {activeMemory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-5 rounded-3xl max-w-sm w-full space-y-4 border border-danonino-violet/60 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-danonino-lavender">
                {activeMemory.category}
              </span>
              <button
                onClick={() => setActiveMemory(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            {activeMemory.title && (
              <h3 className="text-sm font-bold text-slate-100">{activeMemory.title}</h3>
            )}

            <p className="text-xs text-slate-200 leading-relaxed max-h-52 overflow-y-auto no-scrollbar whitespace-pre-wrap bg-danonino-card/80 p-3 rounded-xl border border-danonino-border">
              {activeMemory.text}
            </p>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-danonino-border pt-3">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-danonino-success" />
                <span>Memoria Verificada</span>
              </div>
              <span>{activeMemory.timestamp}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
