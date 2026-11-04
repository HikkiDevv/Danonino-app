import React, { useState } from 'react';
import { UserProfile, WhatsAppLinkData } from '../types';
import { api } from '../services/api';
import { X, User, Shield, LogOut, Check, Copy, MessageSquare, RefreshCw, KeyRound } from 'lucide-react';

interface ProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  onUserUpdated: (user: UserProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onLogout,
  onUserUpdated
}) => {
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user.displayName);
  const [savingName, setSavingName] = useState(false);
  const [linkData, setLinkData] = useState<WhatsAppLinkData | null>(null);
  const [loadingLink, setLoadingLink] = useState(false);

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName === user.displayName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const updated = await api.updateProfile(newName.trim());
      onUserUpdated(updated);
      setEditingName(false);
    } catch (err) {
      console.error('Error actualizando nombre:', err);
    } finally {
      setSavingName(false);
    }
  };

  const handleRequestWhatsAppLink = async () => {
    setLoadingLink(true);
    try {
      const data = await api.requestWhatsAppLink();
      setLinkData(data);
    } catch (err) {
      console.error('Error solicitando vinculación:', err);
    } finally {
      setLoadingLink(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    onLogout();
  };

  const isWaLinked = user.whatsappVinculos && user.whatsappVinculos.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-panel p-5 rounded-3xl max-w-sm w-full space-y-4 border border-danonino-border/80 shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-danonino-card border border-danonino-cyan/50 flex items-center justify-center font-bold text-danonino-cyan text-sm">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Perfil de Usuario</h3>
              <p className="text-[10px] text-slate-400">Espacio Privado Aislado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Datos del Usuario */}
        <div className="space-y-3 bg-danonino-card/60 p-3.5 rounded-2xl border border-danonino-border text-xs">
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Nombre en el chat</span>
            {editingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-danonino-bg px-2 py-1 rounded-lg border border-danonino-cyan text-xs text-white flex-1 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={savingName}
                  className="px-2.5 py-1 bg-danonino-cyan text-danonino-bg font-bold rounded-lg text-[10px]"
                >
                  OK
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between mt-0.5">
                <span className="font-semibold text-slate-200">{user.displayName}</span>
                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="text-[10px] text-danonino-cyan hover:underline"
                >
                  Editar
                </button>
              </div>
            )}
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-medium block">Nombre de usuario</span>
            <span className="font-mono text-slate-300">@{user.username}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-medium block">ID Único Inmutable</span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="font-mono text-[11px] text-slate-400 select-all">{user.id}</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1 text-slate-400 hover:text-danonino-cyan transition-colors"
                title="Copiar ID"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Sección de Vinculación con WhatsApp */}
        <div className="p-3.5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Vínculo con WhatsApp</span>
            </div>
            {isWaLinked ? (
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                Vinculado
              </span>
            ) : (
              <span className="text-[9px] bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                No vinculado
              </span>
            )}
          </div>

          {isWaLinked ? (
            <div className="text-[11px] text-slate-300">
              Asociado a: <code className="text-emerald-300">{user.whatsappVinculos?.[0]?.whatsapp_jid}</code>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400">
                Opcional y verificado: comparte tus recuerdos y preferencias de forma privada con el bot en WhatsApp.
              </p>
              {linkData ? (
                <div className="bg-danonino-bg p-2.5 rounded-xl border border-emerald-500/30 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 block">Tu código de verificación:</span>
                  <div className="font-mono text-base font-black text-emerald-400 tracking-wider">
                    {linkData.code}
                  </div>
                  <p className="text-[9px] text-slate-500">
                    Escribe <code className="text-white">!vincular {linkData.code}</code> en WhatsApp para activar.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestWhatsAppLink}
                  disabled={loadingLink}
                  className="w-full py-1.5 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  {loadingLink ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Generar Código de Vinculación</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Botón de Cerrar Sesión */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};
