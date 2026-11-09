import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, MessageCircle, ArrowUpRight } from 'lucide-react';
import { DanoninoAvatar } from '../components/DanoninoAvatar';
import { AgentStatus, CorazonData } from '../types';
import { api, getCurrentUser } from '../services/api';
import { EMO } from '../components/Interior';
import { SECCIONES, SECCION_DUENA } from '../components/NavigationBar';

interface HomeViewProps {
  status: AgentStatus | null;
  onRefresh: () => void;
  esDuena?: boolean;
}

const saludo = (momento?: string) =>
  momento === 'madrugada' ? ['Qué haces', 'despierto'] :
  momento === 'mañana' ? ['Buen', 'día'] :
  momento === 'tarde' ? ['Buenas', 'tardes'] : ['Buenas', 'noches'];

export const HomeView: React.FC<HomeViewProps> = ({ status, esDuena = false }) => {
  const navigate = useNavigate();
  const [clics, setClics] = useState(0);
  const [corazon, setCorazon] = useState<CorazonData | null>(null);
  const yo = getCurrentUser();
  const [a, b] = saludo(status?.tiempo?.momentoDia);

  useEffect(() => { api.getCorazon().then(setCorazon).catch(() => {}); }, []);

  const modos = ['idle', 'curious', 'speaking', 'thinking'] as const;
  const modo = clics > 0 ? modos[clics % modos.length] : status?.mode === 'thinking' ? 'thinking' : status?.mode === 'dreaming' ? 'sleeping' : 'idle';
  const top = corazon ? [...corazon.barras].sort((x, y) => (y.valor - y.base) - (x.valor - x.base))[0] : null;
  const colorAnimo = top ? EMO[top.emocion].color : '#ff6a45';
  const indice = esDuena ? [...SECCIONES, SECCION_DUENA] : SECCIONES;

  const numeros = [
    { n: status?.usuarioActual?.mensajesPrivados ?? status?.sesion?.mensajesSesion ?? 0, t: 'mensajes' },
    { n: status?.usuarioActual?.recuerdosSemanticos ?? status?.metricasCognitivas?.memoriasTotales ?? 0, t: 'recuerdos' },
    { n: status?.usuarioActual?.ciclosSueno ?? status?.metricasCognitivas?.ciclosSueno ?? 0, t: 'sueños' }
  ];

  return (
    <div className="px-5 pb-32 pt-3 space-y-7 entrar">
      <section>
        <div className="flex items-center gap-2">
          <span className="kicker text-danonino-tomate">№ 01</span>
          <span className="h-px flex-1 bg-danonino-border" />
          <span className="kicker">{status?.tiempo?.fechaTexto || 'Lima'}</span>
        </div>
        <h1 className="titular text-[44px] mt-4">
          {a} <em>{b}</em>{yo?.displayName ? <>,<br />{yo.displayName.split(' ')[0]}.</> : '.'}
        </h1>
      </section>

      <section className="relative hoja rounded-[28px] p-5 overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-30 animate-deriva" style={{ background: colorAnimo }} />
        <div className="relative flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="absolute inset-[-6px] rounded-full opacity-70 animate-respirar" style={{ boxShadow: `0 0 0 2px ${colorAnimo}55, 0 0 30px ${colorAnimo}40` }} />
            <DanoninoAvatar size="lg" mode={modo} onClick={() => setClics((c) => c + 1)} />
          </div>
          <button onClick={() => navigate('/corazon')} className="text-left flex-1 min-w-0">
            <span className="kicker" style={{ color: colorAnimo }}>Su ánimo</span>
            <p className="font-display text-[18px] leading-snug text-slate-100 mt-1">{corazon?.frase || 'Despertando…'}</p>
          </button>
        </div>
        <div className="relative grid grid-cols-[1fr_auto] gap-2.5 mt-5">
          <button onClick={() => navigate('/live')} className="boton-tomate"><Phone className="w-4 h-4" />Hablar con él</button>
          <button onClick={() => navigate('/chat')} className="boton-fantasma"><MessageCircle className="w-4 h-4" />Chat</button>
        </div>
      </section>

      <section className="grid grid-cols-3 divide-x divide-danonino-border border-y border-danonino-border">
        {numeros.map((x) => (
          <div key={x.t} className="py-3.5 text-center">
            <div className="titular text-[28px] tabular-nums">{x.n}</div>
            <div className="kicker mt-1">{x.t}</div>
          </div>
        ))}
      </section>

      <section>
        <span className="kicker">Índice</span>
        <ol className="mt-2">
          {indice.map((s, i) => {
            const Icono = s.icono;
            return (
              <li key={s.to}>
                <button onClick={() => navigate(s.to)} className="w-full flex items-center gap-4 py-3.5 border-b border-danonino-border/70 text-left group active:bg-danonino-card/40">
                  <span className="font-mono text-[10px] text-slate-500 w-5">{String(i + 2).padStart(2, '0')}</span>
                  <Icono className="w-4 h-4 shrink-0" style={{ color: s.color }} />
                  <span className="flex-1">
                    <span className="font-display text-[19px] text-slate-100 leading-none">{s.titulo}</span>
                    <span className="block text-[11.5px] text-slate-500 mt-1">{s.nota}</span>
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-600 group-active:text-danonino-tomate" />
                </button>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
};
