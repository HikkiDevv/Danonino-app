import React, { useEffect, useState } from 'react';
import { Trash2, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { AprendizajeData, AprendizajeBloque } from '../types';
import { Encabezado, hace, Cargando, Vacio } from '../components/Interior';

type Pestana = 'lecciones' | 'opiniones' | 'consejos';

export const AprendizajeView: React.FC = () => {
  const [d, setD] = useState<AprendizajeData | null>(null);
  const [error, setError] = useState('');
  const [pestana, setPestana] = useState<Pestana>('lecciones');
  const [whatsapp, setWhatsapp] = useState(false);

  const cargar = () => api.getAprendizaje().then(setD).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, []);

  const borrar = async (cuerpo: Parameters<typeof api.borrarAprendizaje>[0]) => {
    if (!window.confirm('¿Que lo olvide? No se puede deshacer.')) return;
    await api.borrarAprendizaje({ ...cuerpo, whatsapp }).catch((e) => setError(e.message));
    cargar();
  };

  if (!d) return <div className="px-5 pb-28">{error ? <Vacio>{error}</Vacio> : <Cargando />}</div>;
  const b: AprendizajeBloque = whatsapp && d.whatsapp ? d.whatsapp : d;
  const cuentas: Record<Pestana, number> = { lecciones: b.lecciones.length, opiniones: b.cambios.length, consejos: b.consejos.length };

  return (
    <div className="px-5 pb-28 space-y-6 entrar">
      <Encabezado numero="03" kicker="Aprendizaje" bajada="Lo que le corrigieron, las veces que lo convencieron de algo y los consejos que le dieron. Puedes hacer que olvide lo que no te guste.">
        Lo que <em>aprendió</em>
      </Encabezado>

      {d.whatsapp && (
        <div className="flex gap-2">
          <button onClick={() => setWhatsapp(false)} className={`chip ${!whatsapp ? 'chip-activo' : ''}`}>Tu Danonino</button>
          <button onClick={() => setWhatsapp(true)} className={`chip ${whatsapp ? 'chip-activo' : ''}`}>El de WhatsApp</button>
        </div>
      )}

      <nav className="grid grid-cols-3 gap-2">
        {(['lecciones', 'opiniones', 'consejos'] as Pestana[]).map((p) => (
          <button key={p} onClick={() => setPestana(p)} className={`hoja rounded-2xl px-3 py-3 text-left transition-colors ${pestana === p ? '!border-danonino-oro' : ''}`}>
            <div className={`titular text-[26px] tabular-nums ${pestana === p ? '!text-danonino-oro' : ''}`}>{cuentas[p]}</div>
            <div className="kicker mt-1">{p}</div>
          </button>
        ))}
      </nav>

      {pestana === 'lecciones' && (
        <section className="space-y-2.5">
          {b.lecciones.length ? b.lecciones.map((l) => (
            <article key={`${l.ts}${l.texto}`} className="hoja rounded-hoja p-4 flex gap-3">
              <span className="font-display italic text-danonino-oro text-[26px] leading-none mt-0.5">“</span>
              <div className="flex-1">
                <p className="text-[14px] text-slate-100 leading-snug">{l.texto}</p>
                <p className="kicker mt-2">{hace(l.ts)}{l.veces > 1 ? ` · se lo corrigieron ${l.veces} veces` : ''}</p>
              </div>
              <button onClick={() => borrar({ tipo: 'leccion', texto: l.texto })} className="self-start p-1 text-slate-600 active:text-danonino-tomate" aria-label="Olvidar"><Trash2 className="w-3.5 h-3.5" /></button>
            </article>
          )) : <Vacio>Nadie lo ha corregido todavía. Cuando se equivoque, dile «no es eso» y aprenderá.</Vacio>}
        </section>
      )}

      {pestana === 'opiniones' && (
        <section className="space-y-2.5">
          {b.cambios.length ? b.cambios.map((c) => (
            <article key={c.ts} className="hoja rounded-hoja p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="kicker !text-danonino-oro">{c.tema || 'sin tema'}</span>
                <button onClick={() => borrar({ tipo: 'cambio', ts: c.ts })} className="p-1 -mt-1 text-slate-600 active:text-danonino-tomate" aria-label="Olvidar"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <p className="text-[13px] text-slate-500 line-through decoration-slate-600 mt-2 leading-snug">{c.antes}</p>
              <div className="flex items-start gap-2 mt-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-danonino-oro mt-0.5 shrink-0" />
                <p className="text-[14px] text-slate-100 leading-snug">{c.ahora}</p>
              </div>
              <p className="kicker mt-2">{hace(c.ts)}</p>
            </article>
          )) : <Vacio>Todavía nadie lo convenció de nada. Discute con él con buenos argumentos.</Vacio>}
        </section>
      )}

      {pestana === 'consejos' && (
        <section className="space-y-2.5">
          {b.consejos.length ? b.consejos.map((c) => (
            <article key={c.ts} className="hoja rounded-hoja p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display italic text-[15px] text-slate-300 leading-snug">{c.pregunta}</p>
                <button onClick={() => borrar({ tipo: 'consejo', ts: c.ts })} className="p-1 -mt-1 text-slate-600 active:text-danonino-tomate" aria-label="Olvidar"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <p className="text-[14px] text-slate-100 mt-2 leading-snug">{c.respuesta}</p>
              <p className="kicker mt-2">{hace(c.ts)}</p>
            </article>
          )) : <Vacio>Aún no ha pedido consejos. Los pide en los grupos de WhatsApp, una vez por semana.</Vacio>}
        </section>
      )}
      {error && <p className="text-[12px] text-danonino-tomate">{error}</p>}
    </div>
  );
};
