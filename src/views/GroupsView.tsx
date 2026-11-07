import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bot, Camera, Check, Plus, RefreshCw, Send, Sparkles, UserPlus, Users, X } from 'lucide-react';
import { api, avatarUrl, getCurrentUser, guardarAvatarLocal } from '../services/api';
import { GrupoDanonino, GrupoDetalle, GrupoMensaje, PerfilDanonino } from '../types';

const tarjeta = 'bg-danonino-card border border-danonino-border rounded-2xl p-4 shadow space-y-3';
const campo = 'w-full bg-black/40 border border-danonino-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-danonino-cyan/60';
const botonPrincipal = 'py-2 px-3 rounded-xl bg-gradient-to-r from-danonino-violet to-danonino-cyan text-white font-semibold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50';

const AvatarAgente: React.FC<{ userId: string; tieneAvatar: boolean; version: number; tam?: string }> = ({ userId, tieneAvatar, version, tam = 'w-9 h-9' }) =>
  tieneAvatar ? (
    <img src={avatarUrl(userId, version)} alt="" className={`${tam} rounded-full object-cover border border-danonino-border flex-shrink-0`} />
  ) : (
    <div className={`${tam} rounded-full bg-danonino-violet/30 border border-danonino-border flex items-center justify-center flex-shrink-0`}>
      <Bot className="w-1/2 h-1/2 text-danonino-lavender" />
    </div>
  );

/** Reduce la foto en el móvil: un avatar no necesita pesar megas. */
const reducirImagen = (archivo: File): Promise<string> =>
  new Promise((resolver, rechazar) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const lado = Math.min(img.width, img.height);
      const lienzo = document.createElement('canvas');
      lienzo.width = 512;
      lienzo.height = 512;
      lienzo.getContext('2d')?.drawImage(img, (img.width - lado) / 2, (img.height - lado) / 2, lado, lado, 0, 0, 512, 512);
      URL.revokeObjectURL(url);
      resolver(lienzo.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rechazar(new Error('No se pudo leer esa imagen.'));
    };
    img.src = url;
  });

const MiDanonino: React.FC = () => {
  const [perfil, setPerfil] = useState<PerfilDanonino | null>(null);
  const [apodo, setApodo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [pedido, setPedido] = useState('');
  const [trabajando, setTrabajando] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  const aplicar = (p: PerfilDanonino) => {
    setPerfil(p);
    setApodo(p.apodo);
    setDescripcion(p.descripcion);
    guardarAvatarLocal(p);
  };

  useEffect(() => {
    api.getMiDanonino().then((r) => aplicar(r.perfil)).catch((e) => setAviso(e.message));
  }, []);

  const hacer = async (nombre: string, accion: () => Promise<{ perfil: PerfilDanonino }>, listo: string) => {
    setTrabajando(nombre);
    setAviso(null);
    try {
      aplicar((await accion()).perfil);
      setAviso(listo);
    } catch (e: any) {
      setAviso(e.message);
    } finally {
      setTrabajando('');
    }
  };

  if (!perfil) return <div className={tarjeta}><p className="text-xs text-danonino-muted">{aviso || 'Cargando tu Danonino...'}</p></div>;

  return (
    <section className={tarjeta}>
      <h2 className="text-xs uppercase font-mono tracking-wider text-danonino-muted">Tu Danonino</h2>
      <div className="flex items-center gap-3">
        <AvatarAgente userId={perfil.userId} tieneAvatar={perfil.tieneAvatar} version={perfil.avatarVersion} tam="w-20 h-20" />
        <div className="flex-1 space-y-2">
          <button
            type="button"
            disabled={Boolean(trabajando)}
            onClick={() => entrada.current?.click()}
            className="text-xs text-danonino-cyan flex items-center gap-1.5 disabled:opacity-50"
          >
            {trabajando === 'foto' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            Subir una foto
          </button>
          <input
            ref={entrada}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0];
              e.target.value = '';
              if (archivo) hacer('foto', async () => api.subirAvatar(await reducirImagen(archivo)), 'Foto guardada. Ya la reconoce como su aspecto.');
            }}
          />
          {perfil.aspecto && <p className="text-[11px] text-danonino-muted">Se ve como: {perfil.aspecto}</p>}
        </div>
      </div>

      <div className="flex gap-2">
        <input className={campo} value={pedido} maxLength={200} onChange={(e) => setPedido(e.target.value)} placeholder="O descríbelo y lo dibuja: un flan con gafas" />
        <button
          type="button"
          disabled={Boolean(trabajando) || pedido.trim().length < 3}
          onClick={() => hacer('dibujo', () => api.generarAvatar(pedido.trim()), 'Listo: ese es su nuevo aspecto.')}
          className={botonPrincipal}
        >
          {trabajando === 'dibujo' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Dibujar
        </button>
      </div>

      <div>
        <label className="text-xs text-danonino-muted mb-1 block">Apodo</label>
        <input className={campo} value={apodo} maxLength={30} onChange={(e) => setApodo(e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-danonino-muted mb-1 block">Cómo es (opcional)</label>
        <input className={campo} value={descripcion} maxLength={240} onChange={(e) => setDescripcion(e.target.value)} placeholder="Es dramático y le encantan las papas" />
      </div>
      <button
        type="button"
        disabled={Boolean(trabajando) || apodo.trim().length < 2}
        onClick={() => hacer('perfil', () => api.guardarMiDanonino({ apodo: apodo.trim(), descripcion: descripcion.trim() }), 'Guardado. Ya responde a ese nombre.')}
        className={`${botonPrincipal} w-full`}
      >
        Guardar
      </button>
      {aviso && <p className="text-[11px] text-danonino-lavender">{aviso}</p>}
    </section>
  );
};

const ChatGrupo: React.FC<{ grupoId: string; onVolver: () => void }> = ({ grupoId, onVolver }) => {
  const [grupo, setGrupo] = useState<GrupoDetalle | null>(null);
  const [mensajes, setMensajes] = useState<GrupoMensaje[]>([]);
  const [texto, setTexto] = useState('');
  const [invitar, setInvitar] = useState('');
  const [verMiembros, setVerMiembros] = useState(false);
  const [escribiendo, setEscribiendo] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const fin = useRef<HTMLDivElement>(null);
  const yo = getCurrentUser()?.id;

  const cargar = useCallback(async () => {
    try {
      const [g, m] = await Promise.all([api.getGrupo(grupoId), api.getMensajesGrupo(grupoId)]);
      setGrupo(g.grupo);
      setMensajes(m.mensajes);
    } catch (e: any) {
      setAviso(e.message);
    }
  }, [grupoId]);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 8000);
    const salir = api.subscribeEvents((ev) => {
      const datos = ev.payload as any;
      if (ev.type === 'grupo_mensaje' && datos?.grupoId === grupoId) {
        setEscribiendo(null);
        setMensajes((prev) => (prev.some((m) => m.id === datos.id) ? prev : [...prev, datos]));
      } else if (ev.type === 'grupo_escribiendo' && datos?.grupoId === grupoId) {
        setEscribiendo(datos.nombre);
      }
    });
    return () => {
      clearInterval(intervalo);
      salir();
    };
  }, [grupoId, cargar]);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes.length, escribiendo]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio) return;
    setTexto('');
    try {
      const { mensaje } = await api.publicarEnGrupo(grupoId, limpio);
      setMensajes((prev) => (prev.some((m) => m.id === mensaje.id) ? prev : [...prev, mensaje]));
    } catch (err: any) {
      setTexto(limpio);
      setAviso(err.message);
    }
  };

  const miembro = (userId: string) => grupo?.miembros.find((m) => m.userId === userId);
  const yoMiembro = yo ? miembro(yo) : undefined;

  return (
    <div className="flex flex-col h-full">
      <header style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }} className="flex items-center gap-2 p-3 border-b border-danonino-border bg-danonino-card/40">
        <button type="button" onClick={onVolver} aria-label="Volver" className="text-danonino-muted"><ArrowLeft className="w-5 h-5" /></button>
        <button type="button" onClick={() => setVerMiembros(!verMiembros)} className="flex-1 text-left min-w-0">
          <p className="text-sm font-bold text-white truncate">{grupo?.nombre || 'Grupo'}</p>
          <p className="text-[11px] text-danonino-muted truncate">
            {grupo?.miembros.filter((m) => m.estado === 'activo').map((m) => `${m.nombre} y ${m.apodo}`).join(' · ')}
          </p>
        </button>
      </header>

      {verMiembros && grupo && (
        <div className="p-3 border-b border-danonino-border space-y-2 text-xs">
          {grupo.miembros.map((m) => (
            <div key={m.userId} className="flex items-center gap-2">
              <AvatarAgente userId={m.userId} tieneAvatar={m.tieneAvatar} version={m.avatarVersion} tam="w-7 h-7" />
              <span className="flex-1 text-white">
                {m.apodo} <span className="text-danonino-muted">de {m.nombre}{m.estado === 'invitado' ? ' (invitado)' : !m.agenteActivo ? ' (en pausa)' : ''}</span>
              </span>
            </div>
          ))}
          {yoMiembro && (
            <label className="flex items-center gap-2 text-danonino-muted">
              <input
                type="checkbox"
                checked={yoMiembro.agenteActivo}
                onChange={async (e) => setGrupo((await api.cambiarMiAgente(grupoId, e.target.checked)).grupo)}
              />
              Mi Danonino participa
            </label>
          )}
          <div className="flex gap-2">
            <input className={campo} value={invitar} onChange={(e) => setInvitar(e.target.value)} placeholder="Usuario a invitar" autoCapitalize="none" />
            <button
              type="button"
              disabled={!invitar.trim()}
              className={botonPrincipal}
              onClick={async () => {
                try {
                  const r = await api.invitarAGrupo(grupoId, invitar.trim());
                  setAviso(r.ok ? 'Invitación enviada. Entrará cuando la acepte.' : r.error || 'No se pudo invitar.');
                  setInvitar('');
                  cargar();
                } catch (err: any) {
                  setAviso(err.message);
                }
              }}
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            type="button"
            className="text-rose-400"
            onClick={async () => {
              if (window.confirm('¿Salir del grupo? Tu Danonino saldrá contigo.')) {
                await api.salirDeGrupo(grupoId);
                onVolver();
              }
            }}
          >
            Salir del grupo
          </button>
        </div>
      )}

      {aviso && <p className="px-3 py-1.5 text-[11px] text-danonino-lavender">{aviso}</p>}

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {mensajes.length === 0 && (
          <p className="text-center text-xs text-danonino-muted p-6">
            Di algo. Para que conteste un Danonino concreto, escribe su apodo.
          </p>
        )}
        {mensajes.map((m) => {
          if (m.tipo === 'sistema') return <p key={m.id} className="text-center text-[11px] text-danonino-muted">{m.texto}</p>;
          const mio = m.tipo === 'persona' && m.userId === yo;
          const datos = miembro(m.userId);
          return (
            <div key={m.id} className={`flex gap-2 ${mio ? 'justify-end' : ''}`}>
              {m.tipo === 'agente' && <AvatarAgente userId={m.userId} tieneAvatar={Boolean(datos?.tieneAvatar)} version={datos?.avatarVersion || 0} />}
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${mio ? 'bg-danonino-violet/40 text-white' : m.tipo === 'agente' ? 'bg-danonino-cyan/10 border border-danonino-cyan/30 text-white' : 'bg-danonino-card border border-danonino-border text-white'}`}>
                {!mio && (
                  <p className={`text-[11px] font-semibold mb-0.5 ${m.tipo === 'agente' ? 'text-danonino-cyan' : 'text-danonino-lavender'}`}>
                    {m.nombre}{m.tipo === 'agente' && datos ? ` · Danonino de ${datos.nombre}` : ''}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words">{m.texto}</p>
              </div>
            </div>
          );
        })}
        {escribiendo && <p className="text-[11px] text-danonino-muted italic">{escribiendo} está escribiendo...</p>}
        <div ref={fin} />
      </div>

      <form onSubmit={enviar} style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }} className="flex gap-2 p-3 border-t border-danonino-border">
        <input className={campo} value={texto} maxLength={1500} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe al grupo..." />
        <button type="submit" disabled={!texto.trim()} aria-label="Enviar" className={botonPrincipal}><Send className="w-4 h-4" /></button>
      </form>
    </div>
  );
};

export const GroupsView: React.FC = () => {
  const [grupos, setGrupos] = useState<GrupoDanonino[]>([]);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [invitados, setInvitados] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);

  const cargar = useCallback(() => {
    api.getGrupos().then((r) => setGrupos(r.grupos)).catch((e) => setAviso(e.message));
  }, []);

  useEffect(() => {
    cargar();
    return api.subscribeEvents((ev) => {
      if (ev.type === 'grupo_invitacion') cargar();
    });
  }, [cargar]);

  if (abierto) {
    return (
      // A pantalla completa, por encima de la cabecera y de la barra: como un chat de WhatsApp
      <div className="fixed inset-0 z-[60] bg-danonino-bg">
        <div className="h-full max-w-md mx-auto">
          <ChatGrupo grupoId={abierto} onVolver={() => { setAbierto(null); cargar(); }} />
        </div>
      </div>
    );
  }

  const crear = async () => {
    try {
      const lista = invitados.split(/[\s,]+/).map((u) => u.trim()).filter(Boolean);
      const r = await api.crearGrupo(nombre.trim(), lista);
      const fallidos = r.invitados.filter((i) => !i.ok);
      setAviso(fallidos.length ? `No se pudo invitar a: ${fallidos.map((f) => `${f.username} (${f.error})`).join(', ')}` : null);
      setNombre('');
      setInvitados('');
      setCreando(false);
      cargar();
    } catch (e: any) {
      setAviso(e.message);
    }
  };

  const invitaciones = grupos.filter((g) => g.estado === 'invitado');
  const activos = grupos.filter((g) => g.estado === 'activo');

  return (
    <main className="max-w-md mx-auto p-4 pb-24 space-y-3">
      <MiDanonino />

      {invitaciones.map((g) => (
        <section key={g.id} className={tarjeta}>
          <p className="text-xs text-white">Te invitaron a <b>{g.nombre}</b>. Si aceptas, tu Danonino entra contigo; no comparte tus recuerdos privados.</p>
          <div className="flex gap-2">
            <button type="button" className={`${botonPrincipal} flex-1`} onClick={() => api.responderInvitacion(g.id, true).then(cargar)}><Check className="w-3.5 h-3.5" /> Aceptar</button>
            <button type="button" className="flex-1 py-2 rounded-xl border border-danonino-border text-xs text-danonino-muted flex items-center justify-center gap-1.5" onClick={() => api.responderInvitacion(g.id, false).then(cargar)}><X className="w-3.5 h-3.5" /> Rechazar</button>
          </div>
        </section>
      ))}

      <section className={tarjeta}>
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase font-mono tracking-wider text-danonino-muted">Grupos</h2>
          <button type="button" onClick={() => setCreando(!creando)} className="text-xs text-danonino-cyan flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Crear</button>
        </div>
        {creando && (
          <div className="space-y-2">
            <input className={campo} value={nombre} maxLength={50} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del grupo" />
            <input className={campo} value={invitados} autoCapitalize="none" onChange={(e) => setInvitados(e.target.value)} placeholder="Usuarios a invitar: yeye, dania" />
            <button type="button" disabled={nombre.trim().length < 2} onClick={crear} className={`${botonPrincipal} w-full`}>Crear grupo</button>
          </div>
        )}
        {aviso && <p className="text-[11px] text-danonino-lavender">{aviso}</p>}
        {activos.length === 0 && !creando && (
          <p className="text-xs text-danonino-muted">Crea un grupo e invita a tus amigos: cada uno entra con su Danonino, y todos pueden responderse.</p>
        )}
        {activos.map((g) => (
          <button key={g.id} type="button" onClick={() => setAbierto(g.id)} className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-black/30">
            <div className="w-9 h-9 rounded-full bg-danonino-violet/30 flex items-center justify-center flex-shrink-0"><Users className="w-4 h-4 text-danonino-lavender" /></div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{g.nombre}</p>
              <p className="text-[11px] text-danonino-muted truncate">{g.ultimo || `${g.personas} ${g.personas === 1 ? 'persona' : 'personas'}`}</p>
            </div>
          </button>
        ))}
      </section>
    </main>
  );
};
