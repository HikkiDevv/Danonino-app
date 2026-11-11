import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { House, MessageCircle, Phone, Users, LayoutGrid, Heart, BookOpen, Moon, FlaskConical, Brain, Activity, Sticker, Smartphone, Palette, Gamepad2, X } from 'lucide-react';

export const SECCIONES = [
  { to: '/corazon', titulo: 'Corazón', nota: 'Lo que siente ahora', icono: Heart, color: '#ff8fa8' },
  { to: '/aprendizaje', titulo: 'Aprendizaje', nota: 'Lecciones y opiniones', icono: BookOpen, color: '#f2bd5c' },
  { to: '/mundo', titulo: 'Su mundo', nota: 'Gustos, hallazgos y dibujos', icono: Palette, color: '#ff8fa8' },
  { to: '/juegos', titulo: 'Juegos', nota: 'Mascotas y marcadores', icono: Gamepad2, color: '#8fe0c4' },
  { to: '/oneiros', titulo: 'ONEIROS', nota: 'Sus sueños', icono: Moon, color: '#8fe0c4' },
  { to: '/laboratorio', titulo: 'Laboratorio', nota: '¿Real o soñado?', icono: FlaskConical, color: '#8fe0c4' },
  { to: '/memory', titulo: 'Memoria', nota: 'Lo que sabe de ti', icono: Brain, color: '#ff6a45' },
  { to: '/activity', titulo: 'Actividad', nota: 'Lo que hizo', icono: Activity, color: '#c98bd6' },
  { to: '/stickers', titulo: 'Stickers', nota: 'Su colección', icono: Sticker, color: '#f2bd5c' }
];
export const SECCION_DUENA = { to: '/whatsapp', titulo: 'WhatsApp', nota: 'Diario, estados y perfil', icono: Smartphone, color: '#ff6a45' };

const Pestana: React.FC<{ to: string; label: string; icon: React.FC<any> }> = ({ to, label, icon: Icon }) => (
  <NavLink to={to} end={to === '/'} className="flex-1">
    {({ isActive }) => (
      <span className={`flex flex-col items-center gap-1 py-1.5 transition-colors ${isActive ? 'text-slate-100' : 'text-slate-500'}`}>
        <Icon className="w-[19px] h-[19px]" strokeWidth={isActive ? 2.3 : 1.7} />
        <span className={`font-mono text-[8.5px] tracking-[0.12em] uppercase ${isActive ? 'text-danonino-tomate' : ''}`}>{label}</span>
      </span>
    )}
  </NavLink>
);

export const NavigationBar: React.FC<{ esDuena?: boolean }> = ({ esDuena = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  useEffect(() => setAbierto(false), [location.pathname]);

  // En la llamada en vivo la barra desaparece: la experiencia es inmersiva
  if (location.pathname === '/live') return null;

  const secciones = esDuena ? [...SECCIONES, SECCION_DUENA] : SECCIONES;
  const enMas = secciones.some((s) => location.pathname.startsWith(s.to));

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-50 px-3 pb-3 safe-bottom pointer-events-none">
        <div className="pointer-events-auto max-w-md mx-auto relative flex items-end rounded-[26px] border border-danonino-border bg-danonino-surface/95 backdrop-blur-md px-1.5 pt-1 pb-1 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.85)]">
          <Pestana to="/" label="Inicio" icon={House} />
          <Pestana to="/chat" label="Chat" icon={MessageCircle} />
          <div className="flex-1 flex justify-center">
            <button onClick={() => navigate('/live')} className="-mt-6 w-[58px] h-[58px] rounded-full bg-danonino-tomate text-[#1b0f0b] flex items-center justify-center shadow-[0_10px_26px_-8px_rgba(255,106,69,0.8)] ring-[5px] ring-danonino-bg active:scale-95 transition-transform" aria-label="Llamar a Danonino">
              <Phone className="w-6 h-6" strokeWidth={2.2} />
            </button>
          </div>
          <Pestana to="/grupos" label="Grupos" icon={Users} />
          <button onClick={() => setAbierto(true)} className="flex-1">
            <span className={`flex flex-col items-center gap-1 py-1.5 ${enMas ? 'text-slate-100' : 'text-slate-500'}`}>
              <LayoutGrid className="w-[19px] h-[19px]" strokeWidth={enMas ? 2.3 : 1.7} />
              <span className={`font-mono text-[8.5px] tracking-[0.12em] uppercase ${enMas ? 'text-danonino-tomate' : ''}`}>Más</span>
            </span>
          </button>
        </div>
      </nav>

      {abierto && (
        <div className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-sm flex items-end" onClick={() => setAbierto(false)}>
          <div className="w-full max-w-md mx-auto hoja rounded-t-[30px] px-5 pt-4 pb-8 safe-bottom animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-danonino-border mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="titular text-[26px]">Por <em>dentro</em></h2>
              <button onClick={() => setAbierto(false)} className="p-1.5 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {secciones.map((s, i) => {
                const Icono = s.icono;
                const activa = location.pathname.startsWith(s.to);
                return (
                  <button key={s.to} onClick={() => navigate(s.to)} style={{ animationDelay: `${i * 35}ms` }} className={`animate-fade-in text-left rounded-2xl border p-3.5 transition-colors ${activa ? 'border-danonino-tomate bg-danonino-tomate/10' : 'border-danonino-border bg-danonino-bg/40'} ${s === SECCION_DUENA ? 'col-span-2 flex items-center gap-3' : ''}`}>
                    <Icono className="w-5 h-5" style={{ color: s.color }} />
                    <div className={s === SECCION_DUENA ? '' : 'mt-3'}>
                      <div className="font-display text-[17px] leading-none text-slate-100">{s.titulo}</div>
                      <div className="text-[11px] text-slate-400 mt-1">{s.nota}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
