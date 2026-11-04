import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, RefreshCw, Volume2, VolumeX, PhoneCall, Plus, MessageSquare, ChevronDown, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, getCurrentUser } from '../services/api';
import { ChatMessage, AgentStatus, Conversation } from '../types';
import { DanoninoAvatar } from '../components/DanoninoAvatar';
import { NativeAudioPlayer } from '../services/liveAudio';

interface ChatViewProps {
  status: AgentStatus | null;
}

export const ChatView: React.FC<ChatViewProps> = ({ status }) => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(
    localStorage.getItem('danonino_active_conv') || null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [showConvDropdown, setShowConvDropdown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<NativeAudioPlayer | null>(null);

  useEffect(() => {
    audioPlayerRef.current = new NativeAudioPlayer();
    return () => {
      audioPlayerRef.current?.stop();
    };
  }, []);

  const toggleSpeak = async (id: string, text: string) => {
    if (!audioPlayerRef.current) return;

    if (speakingMsgId === id) {
      audioPlayerRef.current.stop();
      setSpeakingMsgId(null);
      return;
    }

    audioPlayerRef.current.stop();
    setSpeakingMsgId(id);
    setIsLoadingAudio(true);

    try {
      const audioBase64 = await api.getTTSAudio(text);
      if (audioBase64) {
        setIsLoadingAudio(false);
        await audioPlayerRef.current.playBase64(
          audioBase64,
          () => setSpeakingMsgId(id),
          () => setSpeakingMsgId(null),
          () => setSpeakingMsgId(null)
        );
      } else {
        setSpeakingMsgId(null);
        setIsLoadingAudio(false);
      }
    } catch (err) {
      console.error('Error reproduciendo audio:', err);
      setSpeakingMsgId(null);
      setIsLoadingAudio(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationsAndHistory = async () => {
    try {
      setErrorMsg(null);
      const convs = await api.getConversations();
      setConversations(convs);

      let targetConvId = activeConvId;
      if (!targetConvId || !convs.some((c) => c.id === targetConvId)) {
        if (convs.length > 0) {
          targetConvId = convs[0].id;
        } else {
          const newConv = await api.createConversation('Conversación Principal');
          targetConvId = newConv.id;
          setConversations([newConv]);
        }
      }

      setActiveConvId(targetConvId);
      localStorage.setItem('danonino_active_conv', targetConvId);

      // Cargar mensajes de la conversación activa
      const msgs = await api.getConversationMessages(targetConvId, 60);
      setMessages(msgs);
    } catch (err: any) {
      console.error('Error cargando conversaciones:', err.message);
    }
  };

  useEffect(() => {
    loadConversationsAndHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSelectConversation = async (convId: string) => {
    setActiveConvId(convId);
    localStorage.setItem('danonino_active_conv', convId);
    setShowConvDropdown(false);
    try {
      const msgs = await api.getConversationMessages(convId, 60);
      setMessages(msgs);
    } catch (err) {
      console.error('Error cargando mensajes de conversación:', err);
    }
  };

  const handleCreateNewConversation = async () => {
    try {
      const count = conversations.length + 1;
      const newConv = await api.createConversation(`Conversación ${count}`);
      setConversations([newConv, ...conversations]);
      setActiveConvId(newConv.id);
      localStorage.setItem('danonino_active_conv', newConv.id);
      setMessages([]);
      setShowConvDropdown(false);
    } catch (err: any) {
      setErrorMsg('No se pudo crear la conversación');
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (conversations.length <= 1) {
      alert('Debes conservar al menos una conversación activa.');
      return;
    }
    if (!confirm('¿Eliminar esta conversación y su historial?')) return;

    try {
      await api.deleteConversation(convId);
      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);
      if (activeConvId === convId) {
        handleSelectConversation(remaining[0].id);
      }
    } catch (err) {
      console.error('Error eliminando conversación:', err);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const texto = inputText.trim();
    if (!texto || isSending) return;

    setInputText('');
    const userMsg: ChatMessage = {
      id: 'local_' + Date.now(),
      sender: currentUser?.displayName || 'Usuario',
      text: texto,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fromMe: true
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsSending(true);
    setErrorMsg(null);

    try {
      const res = await api.sendChatMessage(texto, activeConvId || undefined);
      if (res.ok && res.reply) {
        const botMsg: ChatMessage = {
          id: res.messageId || 'bot_' + Date.now(),
          sender: 'Danonino',
          text: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fromMe: false
        };
        const updated = [...newMessages, botMsg];
        setMessages(updated);
      }
    } catch (err: any) {
      setErrorMsg('No se pudo conectar con Danonino Core.');
      const errReply: ChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'Danonino',
        text: 'Hubo una interrupción en el procesamiento de tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fromMe: false
      };
      setMessages((prev) => [...prev, errReply]);
    } finally {
      setIsSending(false);
    }
  };

  const currentConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] pb-16 max-w-md mx-auto">
      {/* Barra de Gestión de Conversación */}
      <div className="px-3 py-2 bg-danonino-card/70 border-b border-danonino-border/70 flex items-center justify-between text-xs text-slate-300 relative z-20">
        {/* Selector de Conversación */}
        <div className="relative">
          <button
            onClick={() => setShowConvDropdown(!showConvDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-danonino-bg border border-danonino-border hover:border-danonino-cyan transition-all max-w-[200px]"
          >
            <MessageSquare className="w-3.5 h-3.5 text-danonino-cyan flex-shrink-0" />
            <span className="font-semibold truncate text-[11px]">
              {currentConv ? currentConv.title : 'Conversación'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
          </button>

          {/* Menú Desplegable de Conversaciones */}
          {showConvDropdown && (
            <div className="absolute top-full left-0 mt-1.5 w-60 glass-panel rounded-2xl border border-danonino-border shadow-2xl p-2 space-y-1 animate-fade-in z-30">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Mis Conversaciones</span>
                <button
                  onClick={handleCreateNewConversation}
                  className="flex items-center gap-1 text-danonino-cyan hover:underline text-[10px] font-bold"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nueva</span>
                </button>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1 no-scrollbar">
                {conversations.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectConversation(c.id)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer text-xs transition-colors ${
                      c.id === activeConvId
                        ? 'bg-danonino-cyan/20 text-danonino-cyan font-bold border border-danonino-cyan/40'
                        : 'text-slate-300 hover:bg-danonino-card'
                    }`}
                  >
                    <span className="truncate pr-2">{c.title}</span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(c.id, e)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                      title="Eliminar conversación"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Acciones Rápidas (Live, Recargar) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/live')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-danonino-cyan/10 border border-danonino-cyan/30 text-danonino-cyan hover:bg-danonino-cyan/20 transition-all font-mono text-[10px] font-bold"
            title="Llamada Danonino Live"
          >
            <PhoneCall className="w-3 h-3" />
            <span>Live</span>
          </button>
          <button
            onClick={loadConversationsAndHistory}
            className="p-1 hover:text-danonino-cyan transition-colors"
            title="Recargar conversación"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Lista de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <DanoninoAvatar size="lg" mode="idle" />
            <h3 className="text-sm font-semibold text-slate-200 mt-3">Conversación Privada</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Este espacio es estrictamente tuyo. Los recuerdos y mensajes están aislados por tu cuenta.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.fromMe;
            return (
              <div
                key={msg.id || i}
                className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {!isMe && (
                  <DanoninoAvatar size="sm" mode="idle" showStatusBadge={false} className="mt-1 flex-shrink-0" />
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                    isMe
                      ? 'bg-danonino-blue text-white rounded-tr-xs'
                      : 'bg-danonino-card border border-danonino-border/80 text-slate-100 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`mt-1 flex items-center justify-end gap-2 text-[9px] ${
                      isMe ? 'text-blue-200/70' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {!isMe && (
                      <button
                        onClick={() => toggleSpeak(String(msg.id), msg.text)}
                        className="hover:text-danonino-cyan transition-colors p-0.5 rounded"
                        title="Escuchar respuesta"
                      >
                        {speakingMsgId === String(msg.id) ? (
                          <VolumeX className="w-3 h-3 text-danonino-cyan animate-pulse" />
                        ) : (
                          <Volume2 className="w-3 h-3 text-slate-400 hover:text-danonino-cyan" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex gap-2.5 justify-start animate-fade-in">
            <DanoninoAvatar size="sm" mode="thinking" showStatusBadge={false} className="mt-1 flex-shrink-0" />
            <div className="glass-panel px-4 py-2.5 rounded-2xl rounded-tl-xs text-xs text-danonino-cyan flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-danonino-cyan animate-ping" />
              <span>Danonino está pensando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Caja de Entrada de Texto */}
      <div className="p-3 bg-danonino-bg/95 border-t border-danonino-border/70">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Mensaje privado para Danonino..."
            className="flex-1 bg-danonino-card text-xs text-slate-100 placeholder-slate-500 px-4 py-2.5 rounded-2xl border border-danonino-border focus:outline-none focus:border-danonino-cyan transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 bg-danonino-cyan text-danonino-bg rounded-2xl font-bold hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all flex-shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
