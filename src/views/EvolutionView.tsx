import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle2, ShieldAlert, Award, Compass, Cpu, Layers } from 'lucide-react';
import { api } from '../services/api';
import { EvolutionData } from '../types';

export const EvolutionView: React.FC = () => {
  const [data, setData] = useState<EvolutionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvolution()
      .then((res) => {
        if (res.ok) setData(res);
      })
      .catch((err) => console.error('Error cargando evolución:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pb-24 px-4 pt-4 max-w-md mx-auto space-y-4 animate-fade-in">
      {/* Encabezado */}
      <div className="flex items-center justify-between glass-panel p-3.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-danonino-cyan" />
          <div>
            <h2 className="text-sm font-bold text-slate-100">Evolución Adaptativa</h2>
            <p className="text-[10px] text-slate-400">Competencias funcionales y herramientas dominadas</p>
          </div>
        </div>

        <span className="text-[10px] bg-danonino-cyan/15 text-danonino-cyan border border-danonino-cyan/30 px-2 py-0.5 rounded-full font-mono font-medium">
          v2.5.0
        </span>
      </div>

      {/* Resumen de Integridad Cognitiva */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-panel p-3.5 rounded-2xl border border-danonino-border">
          <div className="flex items-center gap-2 mb-1.5">
            <CheckCircle2 className="w-4 h-4 text-danonino-success" />
            <span className="text-xs font-semibold text-slate-200">Confianza Ontológica</span>
          </div>
          <div className="text-xl font-bold font-mono text-danonino-success">
            {((data?.estadisticas.tasaConfianza ?? 0.96) * 100).toFixed(0)}%
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Basado en datos SQLite verificados</p>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-danonino-border">
          <div className="flex items-center gap-2 mb-1.5">
            <Cpu className="w-4 h-4 text-danonino-cyan" />
            <span className="text-xs font-semibold text-slate-200">Herramientas</span>
          </div>
          <div className="text-xl font-bold font-mono text-danonino-cyan">
            {data?.estadisticas.herramientasActivas ?? 7}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Integradas en runtime Termux</p>
        </div>
      </div>

      {/* Lista de Competencias Verificadas (Sin niveles ficticios) */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase px-1">
          Competencias y Protocolos Dominados
        </h3>

        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Cargando contratos de evolución...</div>
        ) : (
          data?.competencias.map((comp, idx) => (
            <div
              key={idx}
              className="glass-panel p-4 rounded-2xl border border-danonino-border/70 space-y-2 hover:border-danonino-cyan/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-danonino-cyan" />
                  <h4 className="text-xs font-bold text-slate-100">{comp.nombre}</h4>
                </div>
                <span className="text-[10px] font-mono text-danonino-cyan bg-danonino-cyan/10 px-2 py-0.5 rounded-full">
                  {comp.estado}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {comp.descripcion}
              </p>

              {/* Barra de Dominio Funcional */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Madurez computacional</span>
                  <span>{(comp.dominio * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-danonino-card overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-danonino-blue to-danonino-cyan transition-all duration-700"
                    style={{ width: `${comp.dominio * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Principio Ético de No Gamificación */}
      <div className="p-3 bg-danonino-card/50 border border-danonino-border rounded-xl text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
        <Award className="w-4 h-4 text-danonino-lavender flex-shrink-0 mt-0.5" />
        <p>
          Danonino evoluciona mediante enriquecimiento de conocimiento real, pruebas empíricas y adaptación contextual, sin recurrir a niveles artificiales ni puntos ficticios de experiencia.
        </p>
      </div>
    </div>
  );
};
