import React from 'react';
import { BarraEmocion, NombreEmocion } from '../types';

// Cada emoción con su color en el cuaderno: el tomate es el enojo, el oro la alegría, la menta la curiosidad
export const EMO: Record<NombreEmocion, { nombre: string; color: string }> = {
  alegria: { nombre: 'Alegría', color: '#f2bd5c' },
  curiosidad: { nombre: 'Curiosidad', color: '#8fe0c4' },
  ternura: { nombre: 'Ternura', color: '#ff8fa8' },
  orgullo: { nombre: 'Orgullo', color: '#e8a23e' },
  sorpresa: { nombre: 'Sorpresa', color: '#ffe3a3' },
  tristeza: { nombre: 'Tristeza', color: '#8aa6e0' },
  enojo: { nombre: 'Enojo', color: '#ff6a45' },
  ansiedad: { nombre: 'Ansiedad', color: '#c98bd6' },
  verguenza: { nombre: 'Vergüenza', color: '#e8907a' },
  aburrimiento: { nombre: 'Aburrimiento', color: '#8d8178' }
};

export const hace = (ts: number): string => {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
};

/** Cabecera editorial de cada pantalla: número de página, etiqueta y titular en serif. */
export const Encabezado: React.FC<{ numero: string; kicker: string; children: React.ReactNode; bajada?: React.ReactNode }> = ({ numero, kicker, children, bajada }) => (
  <header className="pt-2 pb-1">
    <div className="flex items-center gap-2">
      <span className="kicker text-danonino-tomate">№ {numero}</span>
      <span className="h-px flex-1 bg-danonino-border" />
      <span className="kicker">{kicker}</span>
    </div>
    <h1 className="titular text-[34px] mt-3">{children}</h1>
    {bajada && <p className="text-[13px] text-slate-400 mt-2 leading-relaxed max-w-[34ch]">{bajada}</p>}
  </header>
);

export const Vacio: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="hoja rounded-hoja p-5 text-center text-[13px] text-slate-400 italic font-display">{children}</div>
);

export const Cargando: React.FC = () => (
  <div className="py-16 flex justify-center"><span className="w-2 h-2 rounded-full bg-danonino-tomate animate-respirar" /></div>
);

// Posiciones fijas y orgánicas para que la constelación sea siempre reconocible
const POS: Record<NombreEmocion, [number, number]> = {
  alegria: [50, 34], curiosidad: [24, 52], ternura: [76, 56], orgullo: [70, 22], sorpresa: [30, 20],
  tristeza: [44, 74], enojo: [82, 82], ansiedad: [16, 82], verguenza: [62, 88], aburrimiento: [90, 38]
};

/**
 * Constelación de ánimo: cada emoción es una luz que crece con su intensidad y respira.
 * Las que están en su nivel de base quedan como puntos tenues; las que sobresalen brillan.
 */
export const Constelacion: React.FC<{ barras: BarraEmocion[]; alto?: number }> = ({ barras, alto = 260 }) => {
  const orden = [...barras].sort((a, b) => a.valor - b.valor);
  const top = [...barras].sort((a, b) => (b.valor - b.base) - (a.valor - a.base))[0];
  return (
    <div className="relative w-full" style={{ height: alto }} aria-label="Constelación de emociones">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <defs>
          <filter id="halo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" /></filter>
        </defs>
        {/* Hilos entre las emociones más presentes */}
        {orden.filter((b) => b.valor - b.base > 0.08).map((b, i, l) => i > 0 && (
          <line key={`l${b.emocion}`} x1={POS[l[i - 1].emocion][0]} y1={POS[l[i - 1].emocion][1]} x2={POS[b.emocion][0]} y2={POS[b.emocion][1]} stroke="#f4ecdf" strokeOpacity="0.08" strokeWidth="0.3" />
        ))}
        {orden.map((b) => {
          const [x, y] = POS[b.emocion];
          const r = 2.2 + b.valor * 11;
          return (
            <g key={b.emocion}>
              <circle cx={x} cy={y} r={r * 1.5} fill={EMO[b.emocion].color} opacity={0.12 + b.valor * 0.35} filter="url(#halo)" />
              <circle cx={x} cy={y} r={r * 0.55} fill={EMO[b.emocion].color} opacity={0.35 + b.valor * 0.6} />
            </g>
          );
        })}
      </svg>
      {barras.map((b) => {
        const [x, y] = POS[b.emocion];
        const destaca = b.valor - b.base > 0.1 || b.emocion === top?.emocion;
        return (
          <span
            key={b.emocion}
            className={`absolute -translate-x-1/2 translate-y-3 kicker whitespace-nowrap ${destaca ? '!text-slate-100' : 'opacity-50'}`}
            style={{ left: `${x}%`, top: `${y}%`, fontSize: 8.5 }}
          >
            {EMO[b.emocion].nombre}
          </span>
        );
      })}
    </div>
  );
};

/** Barra fina con la base marcada: se ve cuánto se aleja de su humor normal. */
export const BarraFina: React.FC<{ b: BarraEmocion }> = ({ b }) => (
  <div className="flex items-center gap-3">
    <span className="w-[92px] text-[12px] text-slate-300">{EMO[b.emocion].nombre}</span>
    <div className="relative flex-1 h-[6px] rounded-full bg-danonino-surface overflow-hidden">
      <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700" style={{ width: `${Math.round(b.valor * 100)}%`, background: EMO[b.emocion].color }} />
      <div className="absolute inset-y-[-2px] w-px bg-slate-100/40" style={{ left: `${Math.round(b.base * 100)}%` }} />
    </div>
    <span className="w-8 text-right font-mono text-[10px] text-slate-400">{Math.round(b.valor * 100)}</span>
  </div>
);
