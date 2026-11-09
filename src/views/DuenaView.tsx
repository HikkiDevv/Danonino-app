import React, { useEffect, useRef, useState } from 'react';
import { Send, Trash2, Pencil, Check, X, Eye, MessageCircle, ImagePlus, Shuffle, Wifi, WifiOff, Music2 } from 'lucide-react';
import { api, conSesion, imagenABase64 } from '../services/api';
import { DuenaResumen, FotoPerfil } from '../types';
import { Encabezado, Cargando, Vacio, hace, EMO } from '../components/Interior';

type Pestana = 'diario' | 'estados' | 'perfil';
const NOMBRE_FOTO: Record<string, string> = { cualquiera: 'Cualquiera', enamorado: 'Enamorado', dormido: 'Dormido', ...Object.fromEntries(Object.entries(EMO).map(([k, v]) => [k, v.nombre])) };
const COLOR_FOTO = (e: string) => (EMO as any)[e]?.color || (e === 'enamorado' ? '#ff8fa8' : e === 'dormido' ? '#8d8178' : '#f4ecdf');
const hora = (ts: number) => new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

export const DuenaView: React.FC = () => {
  const [d, setD] = useState<DuenaResumen | null>(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [pestana, setPestana] = useState<Pestana>('diario');
  const [nuevo, setNuevo] = useState('');
  const [editando, setEditando] = useState<{ ts: number; texto: string } | null>(null);
  const [fotoNueva, setFotoNueva] = useState<string | null>(null);
  const [emocionesNueva, setEmocionesNueva] = useState<string[]>(['cualquiera']);
  const [fotoEditada, setFotoEditada] = useState<FotoPerfil | null>(null);
  const [info, setInfo] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const cargar = () => api.getDuena().then((r) => { setD(r); setInfo(r.perfil.config.infoManual || ''); }).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, []);
  const avisar = (t: string) => { setAviso(t); setTimeout(() => setAviso(''), 2500); };
  const hacer = async (fn: () => Promise<any>, ok: string) => {
    setError('');
    try { await fn(); avisar(ok); cargar(); } catch (e: any) { setError(e.message); }
  };

  if (!d) return <div className="px-5 pb-28">{error ? <Vacio>{error}</Vacio> : <Cargando />}</div>;
  const cfg = d.perfil.config;

  return (
    <div className="px-5 pb-28 space-y-6 entrar">
      <Encabezado numero="07" kicker="Solo tú" bajada="Lo que Danonino escribe, publica y muestra en WhatsApp. Esta sección solo existe en tu cuenta.">
        Su vida en <em>WhatsApp</em>
      </Encabezado>

      <div className={`chip w-fit ${d.conectado ? '!text-danonino-menta' : '!text-danonino-tomate'}`}>
        {d.conectado ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}{d.conectado ? 'Conectado a WhatsApp' : 'WhatsApp desconectado'}
      </div>

      <nav className="flex gap-2">
        {(['diario', 'estados', 'perfil'] as Pestana[]).map((p) => (
          <button key={p} onClick={() => setPestana(p)} className={`chip ${pestana === p ? 'chip-activo' : ''}`}>{p === 'diario' ? 'Diario' : p === 'estados' ? 'Estados' : 'Foto e info'}</button>
        ))}
      </nav>

      {pestana === 'diario' && (
        <section className="space-y-4">
          {d.diario.length ? d.diario.map((e) => (
            <article key={e.fecha} className="relative hoja rounded-hoja p-5 pl-6 overflow-hidden">
              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-danonino-tomate/70" />
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display text-[20px]">{new Date(`${e.fecha}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </div>
              {e.tema && <p className="kicker mt-1">sobre {e.tema}</p>}
              <p className="mt-3 text-[14px] leading-[1.65] text-slate-200 whitespace-pre-line font-display" style={{ fontVariationSettings: "'opsz' 14" }}>{e.texto}</p>
            </article>
          )) : <Vacio>Todavía no hay entradas guardadas. Escribe su diario cada noche a las 22:00.</Vacio>}
        </section>
      )}

      {pestana === 'estados' && (
        <section className="space-y-5">
          <div className="hoja rounded-hoja p-4 space-y-2.5">
            <span className="kicker">Publicar un estado ahora</span>
            <textarea value={nuevo} onChange={(e) => setNuevo(e.target.value)} rows={3} maxLength={650} placeholder="Lo que quieras que publique en sus estados…" className="campo resize-none" />
            <button disabled={!nuevo.trim()} onClick={() => hacer(() => api.publicarEstado(nuevo.trim()).then(() => setNuevo('')), 'Sale en sus estados en unos segundos')} className="boton-tomate w-full"><Send className="w-4 h-4" />Publicar</button>
          </div>

          <div className="space-y-2.5">
            <span className="kicker">En cola · aún no salen</span>
            {d.cola.length ? d.cola.map((c) => (
              <div key={c.ts} className="hoja rounded-2xl p-3.5">
                <div className="flex items-center justify-between">
                  <span className="kicker">{hora(c.ts)} · {c.tipo}</span>
                  <div className="flex gap-1">
                    {c.texto && c.tipo !== 'musica' && <button onClick={() => setEditando({ ts: c.ts, texto: c.texto })} className="p-1 text-slate-500"><Pencil className="w-3.5 h-3.5" /></button>}
                    <button onClick={() => window.confirm('¿Cancelar este estado?') && hacer(() => api.cancelarCola(c.ts), 'Cancelado')} className="p-1 text-slate-500 active:text-danonino-tomate"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {editando?.ts === c.ts ? (
                  <div className="mt-2 space-y-2">
                    <textarea value={editando.texto} onChange={(e) => setEditando({ ts: c.ts, texto: e.target.value })} rows={3} className="campo resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => setEditando(null)} className="boton-fantasma flex-1 !py-2"><X className="w-3.5 h-3.5" /></button>
                      <button onClick={() => hacer(() => api.editarCola(c.ts, editando.texto).then(() => setEditando(null)), 'Editado')} className="boton-tomate flex-1 !py-2"><Check className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1.5 text-[13px] text-slate-200 leading-snug">{c.cancion ? <span className="inline-flex items-center gap-1.5"><Music2 className="w-3.5 h-3.5 text-danonino-menta" />{c.cancion}{c.texto ? ` — ${c.texto}` : ''}</span> : c.texto || '(sticker o imagen)'}</p>
                )}
              </div>
            )) : <Vacio>No hay estados en cola ahora.</Vacio>}
          </div>

          <div className="space-y-2.5">
            <span className="kicker">Publicados</span>
            {d.publicados.map((p) => (
              <div key={p.id} className="flex gap-3 py-2.5 border-b border-danonino-border/60 last:border-0">
                <span className="kicker w-12 shrink-0 pt-0.5">{hace(p.ts)}</span>
                <p className="flex-1 text-[13px] text-slate-300 leading-snug line-clamp-3">{p.texto}</p>
                <div className="shrink-0 text-right space-y-1">
                  <div className="flex items-center gap-1 justify-end font-mono text-[10px] text-slate-400"><Eye className="w-3 h-3" />{p.vistas}</div>
                  {p.respuestas > 0 && <div className="flex items-center gap-1 justify-end font-mono text-[10px] text-danonino-tomate"><MessageCircle className="w-3 h-3" />{p.respuestas}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pestana === 'perfil' && (
        <section className="space-y-5">
          <div className="hoja rounded-hoja p-4 space-y-3">
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-[14px] text-slate-100">Foto según su ánimo</span>
                <span className="block text-[12px] text-slate-400 mt-0.5">Rota al azar entre las fotos que encajan con lo que siente</span>
              </span>
              <input type="checkbox" checked={cfg.activo} onChange={(e) => hacer(() => api.configurarPerfil({ activo: e.target.checked }), e.target.checked ? 'Encendido' : 'Apagado')} className="w-5 h-5 accent-[#ff6a45]" />
            </label>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-slate-400 flex-1">Cambia como mucho cada</span>
              <select value={cfg.cadaHoras} onChange={(e) => hacer(() => api.configurarPerfil({ cadaHoras: Number(e.target.value) }), 'Guardado')} className="campo !w-auto !py-1.5">
                {[1, 2, 3, 4, 6, 8, 12, 24].map((h) => <option key={h} value={h}>{h} h</option>)}
              </select>
            </div>
            <button onClick={() => hacer(() => api.probarFotoPerfil(), 'Foto cambiada')} disabled={!d.perfil.fotos.length} className="boton-fantasma w-full !py-2 text-[13px]"><Shuffle className="w-4 h-4" />Cambiarla ahora</button>
            {d.perfil.ultima && <p className="kicker">Puesta {hace(d.perfil.ultima.ts)} · {NOMBRE_FOTO[d.perfil.ultima.emocion] || d.perfil.ultima.emocion}</p>}
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <button onClick={() => input.current?.click()} className="aspect-square rounded-2xl border border-dashed border-danonino-tomate/60 text-danonino-tomate flex flex-col items-center justify-center gap-1"><ImagePlus className="w-6 h-6" /><span className="kicker !text-danonino-tomate">Foto</span></button>
            {d.perfil.fotos.map((f) => (
              <button key={f.id} onClick={() => setFotoEditada(f)} className={`relative aspect-square rounded-2xl overflow-hidden border ${d.perfil.ultima?.id === f.id ? 'border-danonino-tomate' : 'border-danonino-border'}`}>
                <img src={conSesion(`/duena/fotos/${f.id}`)} alt="" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-0.5">
                  {f.emociones.slice(0, 3).map((e) => <span key={e} className="w-2 h-2 rounded-full ring-1 ring-black/40" style={{ background: COLOR_FOTO(e) }} />)}
                </span>
              </button>
            ))}
          </div>
          <input ref={input} type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { setFotoNueva(await imagenABase64(f, 900)); setEmocionesNueva(['cualquiera']); } catch (er: any) { setError(er.message); } } }} />

          <div className="hoja rounded-hoja p-4 space-y-3">
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-[14px] text-slate-100">Info según su ánimo</span>
                <span className="block text-[12px] text-slate-400 mt-0.5">«hoy no estoy para nadie», «pensando en alguien»…</span>
              </span>
              <input type="checkbox" checked={cfg.infoAuto && !cfg.infoManual} onChange={(e) => hacer(() => api.configurarPerfil({ infoAuto: e.target.checked, ...(e.target.checked ? { infoManual: '' } : {}) }), 'Guardado')} className="w-5 h-5 accent-[#ff6a45]" />
            </label>
            <span className="kicker block">O fija una info tuya</span>
            <div className="flex gap-2">
              <input value={info} onChange={(e) => setInfo(e.target.value)} maxLength={139} placeholder="Escribe la info…" className="campo" />
              <button onClick={() => hacer(() => api.configurarPerfil({ infoManual: info.trim() }), info.trim() ? 'Info puesta' : 'Vuelve la automática')} className="boton-fantasma shrink-0"><Check className="w-4 h-4" /></button>
            </div>
          </div>
        </section>
      )}

      {(fotoNueva || fotoEditada) && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end" onClick={() => { setFotoNueva(null); setFotoEditada(null); }}>
          <div className="w-full max-w-md mx-auto hoja rounded-t-[28px] p-5 pb-8 safe-bottom animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <img src={fotoNueva || (fotoEditada ? conSesion(`/duena/fotos/${fotoEditada.id}`) : '')} alt="" className="w-24 h-24 rounded-2xl object-cover" />
              <p className="text-[13px] text-slate-300 leading-snug">¿Con qué ánimo la pone? Puedes elegir varios. «Cualquiera» la usa cuando ninguna otra encaja.</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {d.perfil.emociones.map((e) => {
                const lista = fotoNueva ? emocionesNueva : fotoEditada?.emociones || [];
                const activa = lista.includes(e);
                const cambiar = () => {
                  const nueva = activa ? lista.filter((x) => x !== e) : [...lista, e];
                  if (fotoNueva) setEmocionesNueva(nueva); else if (fotoEditada) setFotoEditada({ ...fotoEditada, emociones: nueva });
                };
                return <button key={e} onClick={cambiar} className={`chip ${activa ? 'chip-activo' : ''}`}><span className="w-2 h-2 rounded-full" style={{ background: COLOR_FOTO(e) }} />{NOMBRE_FOTO[e] || e}</button>;
              })}
            </div>
            <div className="flex gap-2 mt-5">
              {fotoEditada && <button onClick={() => window.confirm('¿Borrar esta foto?') && hacer(() => api.borrarFotoPerfil(fotoEditada.id).then(() => setFotoEditada(null)), 'Borrada')} className="boton-fantasma !text-danonino-tomate"><Trash2 className="w-4 h-4" /></button>}
              <button onClick={() => fotoNueva
                ? hacer(() => api.subirFotoPerfil(fotoNueva, emocionesNueva.length ? emocionesNueva : ['cualquiera']).then(() => setFotoNueva(null)), 'Foto guardada')
                : fotoEditada && hacer(() => api.editarFotoPerfil(fotoEditada.id, fotoEditada.emociones).then(() => setFotoEditada(null)), 'Guardado')} className="boton-tomate flex-1"><Check className="w-4 h-4" />Guardar</button>
            </div>
          </div>
        </div>
      )}

      {(aviso || error) && <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 chip !py-2 !px-4 ${error ? '!text-danonino-tomate' : 'chip-activo'}`}>{error || aviso}</div>}
    </div>
  );
};
