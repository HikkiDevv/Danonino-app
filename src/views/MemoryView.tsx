import React, { useState, useEffect } from 'react';
import { Search, Brain, Clock, Tag, Trash2, Edit3, Check, X, Shield, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { MemoryItem } from '../types';

export const MemoryView: React.FC = () => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const categories = [
    { id: 'todos', label: 'Todos' },
    { id: 'general', label: 'General' },
    { id: 'Preferencia', label: 'Preferencias' },
    { id: 'Persona', label: 'Personas' },
    { id: 'Proyecto', label: 'Proyectos' },
    { id: 'Conversación', label: 'Conversaciones' }
  ];

  const fetchMemories = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const cat = selectedCategory === 'todos' ? '' : selectedCategory;
      const res = await api.getMemories(searchQuery, cat, 50);
      if (res.ok && res.memories) {
        setMemories(res.memories);
      }
    } catch (err: any) {
      console.error('Error cargando recuerdos:', err.message);
      setStatusMessage('Error al consultar memoria');
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

  const startEdit = (m: MemoryItem) => {
    setEditingId(m.id);
    setEditText(m.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return;
    try {
      await api.updateMemory(id, editText.trim());
      setMemories((prev) =>
        prev.map((item) => (item.id === id ? { ...item, text: editText.trim() } : item))
      );
      setEditingId(null);
      setStatusMessage('Recuerdo actualizado con éxito');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage('Error al guardar cambios: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Deseas eliminar este recuerdo de tu perfil?')) return;
    try {
      await api.deleteMemory(id);
      setMemories((prev) => prev.filter((item) => item.id !== id));
      setStatusMessage('Recuerdo eliminado');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage('Error al eliminar recuerdo: ' + err.message);
    }
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return 'Reciente';
    try {
      const date = new Date(isoStr);
      if (isNaN(date.getTime())) return isoStr;
      return date.toLocaleDateString([], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="pb-24 px-4 pt-4 max-w-md mx-auto space-y-4 animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-center justify-between glass-panel p-3.5 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <Brain className="w-5 h-5 text-danonino-cyan" />
          <div>
            <h2 className="text-sm font-bold text-slate-100">Memoria Personal</h2>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Shield className="w-3 h-3 text-danonino-cyan" />
              <span>Aislamiento estricto por cuenta</span>
            </div>
          </div>
        </div>

        <button
          onClick={fetchMemories}
          disabled={loading}
          className="p-2 rounded-xl bg-danonino-card border border-danonino-border hover:border-danonino-cyan text-slate-300 transition-colors"
          title="Actualizar recuerdos"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-danonino-cyan' : ''}`} />
        </button>
      </div>

      {/* Buscador SQLite FTS5 */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar en recuerdos personales..."
          className="w-full bg-danonino-card text-xs text-slate-100 placeholder:text-slate-500 pl-9 pr-4 py-2.5 rounded-xl border border-danonino-border focus:outline-none focus:border-danonino-cyan transition-colors"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
      </form>

      {/* Filtros de Categorías */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1 rounded-full text-[11px] whitespace-nowrap transition-all ${
              selectedCategory === c.id
                ? 'bg-danonino-cyan text-danonino-bg font-bold shadow-md shadow-danonino-cyan/20'
                : 'bg-danonino-card text-slate-400 border border-danonino-border hover:text-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {statusMessage && (
        <div className="p-2.5 rounded-xl bg-danonino-card/90 border border-danonino-cyan/30 text-danonino-cyan text-[11px] font-mono animate-fade-in">
          {statusMessage}
        </div>
      )}

      {/* Lista de Recuerdos */}
      <div className="space-y-3">
        {loading && memories.length === 0 ? (
          <div className="glass-panel p-8 text-center text-xs text-slate-400 space-y-2 rounded-2xl">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-danonino-cyan" />
            <p>Consultando base de recuerdos...</p>
          </div>
        ) : memories.length === 0 ? (
          <div className="glass-panel p-8 text-center text-xs text-slate-400 space-y-2 rounded-2xl">
            <Brain className="w-6 h-6 mx-auto text-slate-600" />
            <p className="font-semibold text-slate-300">No hay recuerdos registrados</p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Danonino consolidará recuerdos de tus conversaciones automáticamente durante los ciclos de reflexión.
            </p>
          </div>
        ) : (
          memories.map((m) => (
            <div
              key={m.id}
              className="glass-panel p-3.5 rounded-2xl border border-danonino-border/80 hover:border-danonino-cyan/40 transition-colors space-y-2.5"
            >
              {/* Header de Tarjeta */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-danonino-card border border-danonino-border text-danonino-cyan font-mono font-medium">
                    {m.category || 'General'}
                  </span>
                  {m.sender && (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[9px]">
                      Origen: {m.sender}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-slate-400 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(m.timestamp)}</span>
                </div>
              </div>

              {/* Cuerpo del Recuerdo / Edición Inline */}
              {editingId === m.id ? (
                <div className="space-y-2 pt-1">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full bg-danonino-bg text-xs text-slate-100 p-2.5 rounded-xl border border-danonino-cyan focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      className="px-2.5 py-1 rounded-lg bg-danonino-card border border-danonino-border text-slate-400 hover:text-slate-200 text-[11px] flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Cancelar</span>
                    </button>
                    <button
                      onClick={() => saveEdit(m.id)}
                      className="px-2.5 py-1 rounded-lg bg-danonino-cyan text-danonino-bg font-bold text-[11px] flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Guardar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-200 leading-relaxed break-words">{m.text}</p>
              )}

              {/* Botones de Acción */}
              {editingId !== m.id && (
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-danonino-border/40">
                  <button
                    onClick={() => startEdit(m)}
                    className="p-1 text-slate-400 hover:text-danonino-cyan transition-colors rounded"
                    title="Editar recuerdo"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 transition-colors rounded"
                    title="Eliminar recuerdo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
