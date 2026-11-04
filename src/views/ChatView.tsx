import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, Mic, Sparkles, RefreshCw, AlertCircle, Volume2, VolumeX, PhoneCall } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ChatMessage, AgentStatus } from '../types';
import { DanoninoAvatar } from '../components/DanoninoAvatar';
import { SpeechSynthesisTTS } from '../services/liveAudio';

interface ChatViewProps {
  status: AgentStatus | null;
}

export const ChatView: React.FC<ChatViewProps> = ({ status }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ttsRef = useRef<SpeechSynthesisTTS | null>(null);

  useEffect(() => {
    ttsRef.current = new SpeechSynthesisTTS();
    return () => {
      ttsRef.current?.cancel();
    };
  }, []);

  const toggleSpeak = (id: string, text: string) => {
    if (!ttsRef.current) return;
    if (speakingMsgId === id) {
      ttsRef.current.cancel();
      setSpeakingMsgId(null);
    } else {
      ttsRef.current.cancel();
      setSpeakingMsgId(id);
      ttsRef.current.speak(
        text,
        () => setSpeakingMsgId(id),
        () => setSpeakingMsgId(null),
        () => setSpeakingMsgId(null)
      );
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHistory = async () => {
    try {
      setErrorMsg(null);
      const res = await api.getChatHistory('app_user', 40);
      if (res.ok && res.messages) {
        setMessages(res.messages);
      }
    } catch (err: any) {
      console.error('Error cargando historial:', err.message);
      // Si el historial remoto falla, cargar los mensajes almacenados localmente
      const local = localStorage.getItem('danonino_local_chat');
      if (local) {
        try {
          setMessages(JSON.parse(local));
        } catch (_) {}
      }
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const texto = inputText.trim();
    if (!texto || isSending) return;

    setInputText('');
    const userMsg: ChatMessage = {
      id: 'local_' + Date.now(),
      sender: 'Dan',
      text: texto,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fromMe: true
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsSending(true);
    setErrorMsg(null);

    try {
      const res = await api.sendChatMessage(texto, 'Dan', 'app_user');
      if (res.ok && res.reply) {
        const botMsg: ChatMessage = {
          id: 'bot_' + Date.now(),
          sender: 'Danonino',
          text: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fromMe: false
        };
        const updated = [...newMessages, botMsg];
        setMessages(updated);
        localStorage.setItem('danonino_local_chat', JSON.stringify(updated.slice(-50)));
      }
    } catch (err: any) {
      setErrorMsg('No se pudo conectar con Danonino Core. Verifica que el backend esté activo en Termux.');
      const errReply: ChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'Danonino',
        text: 'Hubo un retraso o interrupción de conexión con el motor local en Termux. Reintentando...',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fromMe: false
      };
      setMessages((prev) => [...prev, errReply]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] pb-16 max-w-md mx-auto">
      {/* Barra de Contexto Temporal Superior */}
      <div className="px-4 py-2 bg-danonino-card/60 border-b border-danonino-border/60 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-danonino-cyan" />
          <span>America/Lima: {status?.tiempo.horaOficial || '00:00'} ({status?.tiempo.momentoDia || 'noche'})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/live')}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-danonino-cyan/10 border border-danonino-cyan/30 text-danonino-cyan hover:bg-danonino-cyan/20 transition-all font-mono text-[10px]"
            title="Llamada Danonino Live"
          >
            <PhoneCall className="w-3 h-3" />
            <span>Live</span>
          </button>
          <button
            onClick={loadHistory}
            className="p-1 hover:text-danonino-cyan transition-colors"
            title="Recargar historial"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Lista de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <DanoninoAvatar size="lg" mode="idle" />
            <h3 className="text-sm font-semibold text-slate-200 mt-3">Comienza a conversar</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Danonino recuerda conversaciones previas y mantiene conciencia temporal activa.
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
                    className={`text-[9px] mt-1.5 font-mono flex items-center justify-between ${
                      isMe ? 'text-blue-200' : 'text-slate-500'
                    }`}
                  >
                    {!isMe && (
                      <button
                        onClick={() => toggleSpeak(String(msg.id), msg.text)}
                        className={`flex items-center gap-1 hover:text-danonino-cyan transition-colors ${
                          speakingMsgId === String(msg.id) ? 'text-danonino-cyan font-bold animate-pulse' : ''
                        }`}
                        title="Escuchar respuesta"
                      >
                        {speakingMsgId === String(msg.id) ? (
                          <>
                            <VolumeX className="w-3 h-3" />
                            <span>Detener</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>Escuchar</span>
                          </>
                        )}
                      </button>
                    )}
                    <span className="ml-auto">{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isSending && (
          <div className="flex items-center gap-2.5 text-xs text-slate-400">
            <DanoninoAvatar size="sm" mode="thinking" showStatusBadge={false} />
            <div className="bg-danonino-card/80 border border-danonino-border px-3 py-2 rounded-2xl rounded-tl-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-danonino-cyan animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-danonino-cyan animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-danonino-cyan animate-bounce [animation-delay:300ms]" />
              <span className="text-[11px] text-danonino-cyan font-mono ml-1">Razonando con Qwen...</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-2.5 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center gap-2 text-[11px] text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensajes */}
      <div className="p-3 bg-danonino-surface/90 border-t border-danonino-border/80 glass-panel">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Escribe a Danonino..."
            className="flex-1 bg-danonino-card text-xs text-slate-100 placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-danonino-border focus:outline-none focus:border-danonino-cyan transition-colors"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 bg-danonino-cyan text-danonino-bg font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
