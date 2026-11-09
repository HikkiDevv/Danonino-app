import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, X, Check } from 'lucide-react';
import { api, conSesion, imagenABase64 } from '../services/api';
import { StickerItem } from '../types';
import { Encabezado, Cargando, Vacio } from '../components/Interior';

export const StickersView: React.FC = () => {
  const [lista, setLista] = useState<StickerItem[] | null>(null);
  const [filtro, setFiltro] = useState<string>('todos');
  const [abierto, setAbierto] = useState<StickerItem | null>(null);
  const [etiquetas, setEtiquetas] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const [pendiente, setPendiente] = useState<string | null>(null);

  const cargar = () => api.getMisStickers().then((r) => setLista(r.stickers)).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, []);

  const etiquetasTodas = useMemo(() => {
    const c = new Map<string, number>();
    for (const s of lista || []) for (const e of s.etiquetas) c.set(e, (c.get(e) || 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([e]) => e);
  }, [lista]);

  const visibles = (lista || []).filter((s) => filtro === 'todos' ? true : filtro === 'mios' ? s.propio : s.etiquetas.includes(filtro));

  const elegirArchivo = async (f?: File) => {
    if (!f) return;
    try { setPendiente(await imagenABase64(f, 700)); setEtiquetas(''); } catch (e: any) { setError(e.message); }
  };
  const subir = async () => {
    if (!pendiente) return;
    setSubiendo(true); setError('');
    try { await api.subirSticker(pendiente, etiquetas); setPendiente(null); cargar(); }
    catch (e: any) { setError(e.message); }
    finally { setSubiendo(false); }
  };
  const guardarEtiquetas = async () => {
    if (!abierto) return;
    await api.editarSticker(abierto.id, etiquetas.split(/[,\s]+/).filter(Boolean)).catch((e) => setError(e.message));
    setAbierto(null); cargar();
  };
  const borrar = async (s: StickerItem) => {
    if (!window.confirm('¿Borrar este sticker de tu colección?')) return;
    await api.borrarSticker(s.id).catch((e) => setError(e.message));
    setAbierto(null); cargar();
  };

  return (
    <div className="px-5 pb-28 space-y-5 entrar">
      <Encabezado numero="06" kicker="Stickers" bajada="Los de su colección y los tuyos. Los que subas solo los usa tu Danonino.">
        Su <em>cajón</em> de stickers
      </Encabezado>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5">
        {['todos', 'mios', ...etiquetasTodas].map((e) => (
          <button key={e} onClick={() => setFiltro(e)} className={`chip shrink-0 ${filtro === e ? 'chip-activo' : ''}`}>{e === 'mios' ? 'los míos' : e}</button>
        ))}
      </div>

      {!lista ? <Cargando /> : (
        <div className="grid grid-cols-3 gap-2.5">
          <button onClick={() => input.current?.click()} className="aspect-square rounded-2xl border border-dashed border-danonino-tomate/60 text-danonino-tomate flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
            <Plus className="w-6 h-6" /><span className="kicker !text-danonino-tomate">Subir</span>
          </button>
          {visibles.map((s) => (
            <button key={s.id} onClick={() => { setAbierto(s); setEtiquetas(s.etiquetas.join(', ')); }} className="relative aspect-square hoja rounded-2xl p-2 active:scale-95 transition-transform">
              <img src={conSesion(`/stickers/${s.id}`)} alt={s.descripcion || s.etiquetas.join(', ')} loading="lazy" className="w-full h-full object-contain" />
              {s.propio && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danonino-tomate" />}
            </button>
          ))}
        </div>
      )}
      {lista && !visibles.length && <Vacio>No hay stickers con esa etiqueta.</Vacio>}
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => elegirArchivo(e.target.files?.[0])} />
      {error && <p className="text-[12px] text-danonino-tomate">{error}</p>}

      {(pendiente || abierto) && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end" onClick={() => { setPendiente(null); setAbierto(null); }}>
          <div className="w-full max-w-md mx-auto hoja rounded-t-[28px] p-5 pb-8 safe-bottom animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="kicker">{pendiente ? 'Sticker nuevo' : abierto?.propio ? 'Tu sticker' : 'De su colección'}</span>
              <button onClick={() => { setPendiente(null); setAbierto(null); }} className="p-1 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="w-40 h-40 mx-auto rounded-2xl bg-danonino-surface p-3">
              <img src={pendiente || (abierto ? conSesion(`/stickers/${abierto.id}`) : '')} alt="" className="w-full h-full object-contain" />
            </div>
            {(pendiente || abierto?.propio) ? (
              <div className="mt-4 space-y-3">
                <label className="kicker block">¿Para qué emoción? (separa con comas)</label>
                <input value={etiquetas} onChange={(e) => setEtiquetas(e.target.value)} placeholder="risa, burla, amor…" className="campo" />
                <div className="flex gap-2">
                  {abierto?.propio && <button onClick={() => borrar(abierto)} className="boton-fantasma !text-danonino-tomate"><Trash2 className="w-4 h-4" /></button>}
                  <button disabled={subiendo} onClick={pendiente ? subir : guardarEtiquetas} className="boton-tomate flex-1"><Check className="w-4 h-4" />{pendiente ? (subiendo ? 'Subiendo…' : 'Guardar sticker') : 'Guardar etiquetas'}</button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-center text-[13px] text-slate-400">{abierto?.etiquetas.join(' · ')}{abierto?.usos ? ` — lo usó ${abierto.usos} veces` : ''}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
