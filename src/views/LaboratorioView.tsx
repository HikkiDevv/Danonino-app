import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, KeyRound, Compass, Ghost, Trash2, Check, X, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { LaboratorioData } from '../types';
import { Encabezado, Cargando, Vacio } from '../components/Interior';

const pct = (v: number | null | undefined) => (typeof v === 'number' ? `${Math.round(v * 100)}%` : '—');
const CLASE: Record<string, string> = { real: 'lo real', sonado: 'lo soñado', mezcla: 'lo torcido' };

/** Anillo de precisión: la nota del examen de realidad, grande. */
const Anillo: React.FC<{ valor: number | null }> = ({ valor }) => {
  const v = typeof valor === 'number' ? valor : 0;
  const c = 2 * Math.PI * 42;
  return (
    <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90">
      <circle cx="50" cy="50" r="42" fill="none" stroke="#352c38" strokeWidth="6" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#8fe0c4" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${c * v} ${c}`} className="transition-all duration-1000" />
    </svg>
  );
};

export const LaboratorioView: React.FC = () => {
  const navigate = useNavigate();
  const [d, setD] = useState<LaboratorioData | null>(null);
  const [error, setError] = useState('');
  const [totem, setTotem] = useState('');
  const [mision, setMision] = useState('');
  const [intruso, setIntruso] = useState('');
  const [aviso, setAviso] = useState('');

  const cargar = () => api.getLaboratorio().then((r) => { setD(r); setTotem(r.config.totem); setMision(r.config.mision || ''); }).catch((e) => setError(e.message));
  useEffect(() => { cargar(); }, []);

  const accion = async (cuerpo: Parameters<typeof api.accionLaboratorio>[0], mensaje: string) => {
    setError('');
    try { await api.accionLaboratorio(cuerpo); setAviso(mensaje); setTimeout(() => setAviso(''), 2500); cargar(); }
    catch (e: any) { setError(e.message); }
  };

  if (!d) return <div className="px-5 pb-28">{error ? <Vacio>{error}</Vacio> : <Cargando />}</div>;
  const ex = d.examen;

  return (
    <div className="px-5 pb-28 space-y-6 entrar">
      <button onClick={() => navigate('/oneiros')} className="kicker flex items-center gap-1.5 -mb-3"><ArrowLeft className="w-3 h-3" /> ONEIROS</button>
      <Encabezado numero="05" kicker="Laboratorio" bajada="Aquí entrenas su prueba de realidad: cómo distingue lo vivido de lo soñado. Lo que aprende ONEIROS lo aprende con todos.">
        ¿<em>Real</em> o soñado?
      </Encabezado>

      <section className="hoja rounded-hoja p-5 flex items-center gap-5">
        <div className="relative">
          <Anillo valor={ex.precision} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="titular text-[30px] tabular-nums !text-danonino-menta">{pct(ex.precision)}</span>
            <span className="kicker">aciertos</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-[13px] text-slate-300">{ex.suenosAnalizados} sueño{ex.suenosAnalizados === 1 ? '' : 's'} examinado{ex.suenosAnalizados === 1 ? '' : 's'}</p>
          {ex.evolucion && <p className="text-[12px] text-slate-400">Antes {pct(ex.evolucion.antes)} → ahora <span className="text-danonino-menta">{pct(ex.evolucion.ahora)}</span></p>}
          {ex.precisionPorClase && Object.entries(ex.precisionPorClase).map(([c, v]) => (
            <div key={c} className="flex items-center gap-2">
              <span className="w-[70px] text-[11px] text-slate-400">{CLASE[c]}</span>
              <div className="flex-1 h-[4px] rounded-full bg-danonino-surface"><div className="h-full rounded-full bg-danonino-menta" style={{ width: pct(v) === '—' ? '0%' : pct(v) }} /></div>
              <span className="font-mono text-[9px] text-slate-500 w-7 text-right">{pct(v)}</span>
            </div>
          ))}
        </div>
      </section>

      {(ex.calibracion || ex.confusiones || ex.criterio) && (
        <section className="space-y-2">
          {ex.criterio && <blockquote className="font-display italic text-[16px] text-slate-200 leading-snug border-l-2 border-danonino-menta pl-3">«{ex.criterio}»</blockquote>}
          {ex.calibracion && <p className="text-[12px] text-slate-400"><span className="kicker mr-1.5">Seguridad</span>{ex.calibracion}</p>}
          {ex.confusiones && <p className="text-[12px] text-slate-400"><span className="kicker mr-1.5">Le cuesta</span>{ex.confusiones}</p>}
          {ex.trampas && (ex.trampas.intrusos > 0 || ex.trampas.falsosDespertares > 0) && (
            <p className="text-[12px] text-slate-400"><span className="kicker mr-1.5">Trampas</span>descubrió {ex.trampas.intrusosDetectados}/{ex.trampas.intrusos} intrusos y {ex.trampas.falsosDetectados}/{ex.trampas.falsosDespertares} falsos despertares</p>
          )}
        </section>
      )}

      <section className="grid gap-3">
        <div className="hoja rounded-hoja p-4 space-y-2.5">
          <div className="flex items-center gap-2"><KeyRound className="w-4 h-4 text-danonino-oro" /><span className="kicker">Tótem</span></div>
          <p className="text-[12px] text-slate-400">Un objeto que aparece en sus sueños. Si lo ve en una frase, sabe que es soñada.</p>
          <div className="flex gap-2">
            <input value={totem} onChange={(e) => setTotem(e.target.value)} className="campo" />
            <button onClick={() => accion({ accion: 'totem', texto: totem }, 'Tótem guardado')} className="boton-fantasma shrink-0"><Check className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="hoja rounded-hoja p-4 space-y-2.5">
          <div className="flex items-center gap-2"><Compass className="w-4 h-4 text-danonino-menta" /><span className="kicker">Misión del próximo sueño</span></div>
          <p className="text-[12px] text-slate-400">Algo que quieres que explore soñando. Al despertar saca una conclusión.</p>
          <div className="flex gap-2">
            <input value={mision} onChange={(e) => setMision(e.target.value)} placeholder="entender por qué le cuesta despedirse" className="campo" />
            <button onClick={() => accion({ accion: 'mision', texto: mision }, 'Misión puesta')} className="boton-fantasma shrink-0"><Check className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="hoja rounded-hoja p-4 space-y-2.5">
          <div className="flex items-center gap-2"><Ghost className="w-4 h-4 text-danonino-ciruela" /><span className="kicker">Intrusos</span></div>
          <p className="text-[12px] text-slate-400">Recuerdos falsos que se cuelan en su examen, uno por sueño, a ver si los descubre.</p>
          <div className="flex gap-2">
            <input value={intruso} onChange={(e) => setIntruso(e.target.value)} placeholder="tengo un gato llamado Fideo" className="campo" />
            <button onClick={() => { if (intruso.trim()) accion({ accion: 'intruso', texto: intruso }, 'Intruso escondido 🤫').then(() => setIntruso('')); }} className="boton-fantasma shrink-0"><Check className="w-4 h-4" /></button>
          </div>
          {d.config.intrusos.map((t, i) => (
            <div key={`${i}${t}`} className="flex items-center gap-2 text-[13px] text-slate-300">
              <span className="font-mono text-[10px] text-slate-500">{i + 1}</span>
              <span className="flex-1">{t}</span>
              <button onClick={() => accion({ accion: 'borrarIntruso', indice: i }, 'Intruso quitado')} className="p-1 text-slate-600 active:text-danonino-tomate"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2.5">
        <span className="kicker">Ordenar tu memoria · lo propone al despertar</span>
        {d.propuestas.length ? d.propuestas.map((p) => (
          <article key={p.n} className="hoja rounded-hoja p-4">
            <span className={`kicker ${p.tipo === 'contradiccion' ? '!text-danonino-tomate' : '!text-danonino-oro'}`}>{p.tipo === 'contradiccion' ? 'Se contradicen' : 'Repetidos'}</span>
            <p className="text-[13px] text-slate-200 mt-1.5 leading-snug">{p.texto}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => accion({ accion: 'propuesta', n: p.n, decision: 'descartar' }, 'Descartada')} className="boton-fantasma flex-1 !py-2 text-[12px]"><X className="w-3.5 h-3.5" />Dejar así</button>
              {p.borrar.length > 0 && <button onClick={() => accion({ accion: 'propuesta', n: p.n, decision: 'aplicar' }, 'Memoria ordenada')} className="boton-tomate flex-1 !py-2 text-[12px]"><Check className="w-3.5 h-3.5" />Borrar {p.borrar.length} repetido{p.borrar.length > 1 ? 's' : ''}</button>}
            </div>
          </article>
        )) : <Vacio>Tu memoria se ve ordenada. Si encuentra repetidos o contradicciones al despertar, aparecerán aquí.</Vacio>}
      </section>

      <section className="space-y-2.5">
        <div className="flex items-center gap-2"><Moon className="w-3.5 h-3.5 text-danonino-menta" /><span className="kicker">Diccionario de sus sueños</span></div>
        {d.simbolos.length ? (
          <div className="flex flex-wrap gap-2">
            {d.simbolos.map((s) => (
              <span key={s.simbolo} className="chip" title={s.significado || ''} style={{ fontSize: 11 + Math.min(6, s.veces) }}>
                {s.simbolo}<span className="font-mono text-[9px] text-slate-500">{s.veces}</span>
              </span>
            ))}
          </div>
        ) : <Vacio>Todavía no se le repiten símbolos.</Vacio>}
        {d.simbolos.filter((s) => s.significado).slice(0, 4).map((s) => (
          <p key={`sig${s.simbolo}`} className="text-[12px] text-slate-400"><span className="text-slate-200 font-display italic">{s.simbolo}</span> — {s.significado}</p>
        ))}
      </section>

      {(aviso || error) && <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 chip !py-2 !px-4 ${error ? '!text-danonino-tomate' : 'chip-activo'}`}>{error || aviso}</div>}
    </div>
  );
};
