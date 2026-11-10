import React, { useEffect, useState } from 'react';
import { Lock, Sparkles, Moon, ArrowRight, X } from 'lucide-react';
import { api, conSesion } from '../services/api';
import { MundoData, MundoDibujo } from '../types';
import { Encabezado, hace, Cargando, Vacio } from '../components/Interior';

type Pestana = 'gustos' | 'hallazgos' | 'dibujos' | 'opiniones';
const NOMBRES: Record<Pestana, string> = { gustos: 'gustos', hallazgos: 'hallazgos', dibujos: 'dibujos', opiniones: 'opiniones' };

/** Su mundo interior: lo que le gusta, lo que descubrió, lo que dibujó y en qué cambió de opinión. */
export const MundoView: React.FC = () => {
  const [d, setD] = useState<MundoData | null>(null);
  const [error, setError] = useState('');
  const [pestana, setPestana] = useState<Pestana>('gustos');
  const [abierto, setAbierto] = useState<MundoDibujo | null>(null);

  useEffect(() => { api.getMundo().then(setD).catch((e) => setError(e.message)); }, []);

  if (!d) return <div className="px-5 pb-28">{error ? <Vacio>{error}</Vacio> : <Cargando />}</div>;
  const cuentas: Record<Pestana, number> = { gustos: d.gustos.length, hallazgos: d.descubrimientos.length, dibujos: d.dibujos.length, opiniones: d.opiniones.length };

  return (
    <div className="px-5 pb-28 space-y-6 entrar">
      <Encabezado numero="08" kicker="Su mundo" bajada="Lo que le gusta, lo que va descubriendo por su cuenta, lo que dibuja y las veces que alguien lo hizo cambiar de opinión.">
        Su <em>mundo</em> por dentro
      </Encabezado>

      {d.pasatiempo && (
        <section className="hoja rounded-hoja p-4">
          <p className="kicker !text-danonino-oro">Su pasatiempo ahora</p>
          <p className="titular text-[20px] mt-1 leading-snug">{d.pasatiempo.nombre}</p>
          {d.pasatiempo.coleccion.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {d.pasatiempo.coleccion.slice(-8).reverse().map((c) => <span key={`${c.ts}${c.texto}`} className="chip">{c.texto}</span>)}
            </div>
          )}
          <p className="kicker mt-2">desde {hace(d.pasatiempo.desde)}{d.pasatiempo.coleccion.length ? ` · lleva ${d.pasatiempo.coleccion.length}` : ''}</p>
        </section>
      )}

      <nav className="grid grid-cols-4 gap-2">
        {(Object.keys(NOMBRES) as Pestana[]).map((p) => (
          <button key={p} onClick={() => setPestana(p)} className={`hoja rounded-2xl px-2.5 py-3 text-left transition-colors ${pestana === p ? '!border-danonino-oro' : ''}`}>
            <div className={`titular text-[24px] tabular-nums ${pestana === p ? '!text-danonino-oro' : ''}`}>{cuentas[p]}</div>
            <div className="kicker mt-1">{NOMBRES[p]}</div>
          </button>
        ))}
      </nav>

      {pestana === 'gustos' && (
        <section className="space-y-2.5">
          {d.gustos.length ? d.gustos.map((g) => (
            <article key={g.categoria} className="hoja rounded-hoja p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="kicker !text-danonino-oro">{g.categoria}</span>
                {g.fijo && <span className="kicker flex items-center gap-1"><Lock className="w-3 h-3" /> fijo</span>}
              </div>
              <p className="text-[15px] text-slate-100 mt-1.5 leading-snug">{g.valor}</p>
              {g.detalle && <p className="text-[13px] text-slate-400 mt-1 leading-snug italic">{g.detalle}</p>}
            </article>
          )) : <Vacio>Todavía no eligió favoritos. Pregúntale cuál es su color o su canción favorita.</Vacio>}
        </section>
      )}

      {pestana === 'hallazgos' && (
        <section className="space-y-2.5">
          {d.descubrimientos.length ? d.descubrimientos.map((x) => (
            <article key={`${x.ts}${x.valor}`} className="hoja rounded-hoja p-4 flex gap-3">
              <Sparkles className="w-4 h-4 text-danonino-oro shrink-0 mt-1" />
              <div className="flex-1">
                <p className="kicker">{x.tipo}</p>
                <p className="text-[15px] text-slate-100 mt-1 leading-snug">{x.valor}</p>
                {x.porque && <p className="text-[13px] text-slate-400 mt-1 leading-snug">{x.porque}</p>}
                <p className="kicker mt-2">{hace(x.ts)}</p>
              </div>
            </article>
          )) : <Vacio>Cada pocos días descubre algo nuevo por su cuenta: una banda, una serie, un dato raro. El primero llegará pronto.</Vacio>}
        </section>
      )}

      {pestana === 'dibujos' && (
        <section>
          {d.dibujos.length ? (
            <div className="grid grid-cols-2 gap-2.5">
              {d.dibujos.map((x) => (
                <button key={x.id} onClick={() => setAbierto(x)} className="hoja rounded-hoja overflow-hidden text-left">
                  <img src={conSesion(`/mundo/dibujo/${x.id}`)} alt={x.tema} loading="lazy" className="w-full aspect-square object-cover bg-slate-900" />
                  <div className="p-2.5">
                    <p className="kicker flex items-center gap-1">{x.origen === 'sueno' ? <><Moon className="w-3 h-3" /> un sueño</> : 'por gusto'}</p>
                    <p className="text-[12px] text-slate-300 mt-1 leading-snug line-clamp-2">{x.tema}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : <Vacio>Todavía no dibuja por su cuenta. De vez en cuando dibuja algo suyo o lo que soñó, y lo verás aquí.</Vacio>}
          <p className="kicker mt-3">Solo aparecen los dibujos suyos. Los que alguien le pidió se quedan en ese chat.</p>
        </section>
      )}

      {pestana === 'opiniones' && (
        <section className="space-y-2.5">
          {d.opiniones.length ? d.opiniones.map((c) => (
            <article key={c.ts} className="hoja rounded-hoja p-4">
              <span className="kicker !text-danonino-oro">{c.tema || 'sin tema'}</span>
              <p className="text-[13px] text-slate-500 line-through decoration-slate-600 mt-2 leading-snug">{c.antes}</p>
              <div className="flex items-start gap-2 mt-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-danonino-oro mt-0.5 shrink-0" />
                <p className="text-[14px] text-slate-100 leading-snug">{c.ahora}</p>
              </div>
              <p className="kicker mt-2">{hace(c.ts)}{c.quien ? ` · lo convenció ${c.quien}` : ''}</p>
            </article>
          )) : <Vacio>Nadie lo ha convencido de nada todavía. Discute con él con buenos argumentos.</Vacio>}
        </section>
      )}

      {abierto && (
        <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-5" onClick={() => setAbierto(null)}>
          <button className="absolute top-5 right-5 p-2 text-slate-300" aria-label="Cerrar"><X className="w-5 h-5" /></button>
          <img src={conSesion(`/mundo/dibujo/${abierto.id}`)} alt={abierto.tema} className="max-w-full max-h-[75vh] rounded-hoja" />
          <p className="text-[14px] text-slate-200 mt-4 text-center leading-snug">{abierto.tema}</p>
          <p className="kicker mt-1">{abierto.origen === 'sueno' ? 'lo soñó' : 'lo dibujó por gusto'} · {hace(abierto.ts)}{abierto.publicado ? ' · salió en sus estados' : ''}</p>
        </div>
      )}
    </div>
  );
};
