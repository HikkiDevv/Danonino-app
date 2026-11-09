import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  RefreshCw,
  Volume2,
  VolumeX,
  PhoneCall,
  Plus,
  MessageSquare,
  ChevronDown,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Square,
  Paperclip,
  Mic,
  Image as ImageIcon,
  Video as VideoIcon,
  X,
  Play,
  Pause
} from 'lucide-react';
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
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [showConvDropdown, setShowConvDropdown] = useState(false);
  const [infoPill, setInfoPill] = useState<string | null>(null);

  // Estados de Multimedia y Notas de Voz
  const [attachedMedia, setAttachedMedia] = useState<{
    base64: string;
    type: 'image' | 'video' | 'audio';
    previewUrl: string;
    name: string;
  } | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<NativeAudioPlayer | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  useEffect(() => {
    audioPlayerRef.current = new NativeAudioPlayer();
    return () => {
      audioPlayerRef.current?.stop();
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Formato estricto a hora local de Perú (HH:mm)
  const formatMessageTime = (ts?: string): string => {
    if (!ts) {
      return new Date().toLocaleTimeString('es-PE', {
        timeZone: 'America/Lima',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    if (/^\d{2}:\d{2}$/.test(ts)) return ts;
    try {
      const d = new Date(ts);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('es-PE', {
          timeZone: 'America/Lima',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
    } catch (_) {}
    return ts.slice(11, 16) || '00:00';
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
  }, [messages, isSending, attachedMedia]);

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

  // Reproducir respuesta por voz con TTS
  const toggleSpeak = async (id: string, text: string) => {
    if (!audioPlayerRef.current) return;

    if (speakingMsgId === id) {
      audioPlayerRef.current.stop();
      setSpeakingMsgId(null);
      return;
    }

    audioPlayerRef.current.stop();
    setSpeakingMsgId(id);

    try {
      const audioBase64 = await api.getTTSAudio(text);
      if (audioBase64) {
        await audioPlayerRef.current.playBase64(
          audioBase64,
          () => setSpeakingMsgId(id),
          () => setSpeakingMsgId(null),
          () => setSpeakingMsgId(null)
        );
      } else {
        setSpeakingMsgId(null);
      }
    } catch (err) {
      console.error('Error reproduciendo audio:', err);
      setSpeakingMsgId(null);
    }
  };

  // Copiar al portapapeles
  const handleCopyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  // Manejo de Archivos Multimedia (Fotos / Videos)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      alert('Selecciona una imagen (JPG, PNG, WebP) o video (MP4, WebM).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setAttachedMedia({
        base64,
        type: isVideo ? 'video' : 'image',
        previewUrl: URL.createObjectURL(file),
        name: file.name
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Grabación de Notas de Voz
  const startRecordingAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setAttachedMedia({
            base64,
            type: 'audio',
            previewUrl: URL.createObjectURL(audioBlob),
            name: 'Nota de voz'
          });
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert('No se pudo acceder al micrófono para grabar nota de voz: ' + err.message);
    }
  };

  const stopRecordingAudio = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecordingAudio = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      audioChunksRef.current = [];
      setAttachedMedia(null);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  // Enviar mensaje con texto y/o multimedia
  const handleSend = async (textToSend?: string) => {
    const texto = (textToSend !== undefined ? textToSend : inputText).trim();
    const mediaToSend = attachedMedia;

    if (!texto && !mediaToSend) return;
    if (isSending) return;

    if (textToSend === undefined) setInputText('');
    setAttachedMedia(null);

    const horaPeru = new Date().toLocaleTimeString('es-PE', {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // Mensaje del usuario: SIEMPRE a la derecha (fromMe: true, role: 'user')
    const userMsg: ChatMessage = {
      id: 'local_' + Date.now(),
      sender: currentUser?.displayName || 'Usuario',
      text: texto || (mediaToSend?.type === 'audio' ? 'Nota de voz' : mediaToSend?.type === 'video' ? 'Video' : 'Foto'),
      timestamp: horaPeru,
      fromMe: true,
      role: 'user',
      mediaUrl: mediaToSend?.base64,
      mediaType: mediaToSend?.type
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsSending(true);
    setErrorMsg(null);

    abortControllerRef.current = new AbortController();

    try {
      const res = await api.sendChatMessage(
        texto,
        activeConvId || undefined,
        mediaToSend?.base64,
        mediaToSend?.type
      );

      if (res.ok && res.reply) {
        // Respuesta de Danonino: SIEMPRE a la izquierda (fromMe: false, role: 'assistant', sender: 'Danonino')
        const botMsg: ChatMessage = {
          id: res.messageId || 'bot_' + Date.now(),
          sender: 'Danonino',
          text: res.reply,
          timestamp: formatMessageTime(res.timestamp),
          fromMe: false,
          role: 'assistant'
        };
        setMessages([...newMessages, botMsg]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const abortedReply: ChatMessage = {
          id: 'abort_' + Date.now(),
          sender: 'Danonino',
          text: 'Generación cancelada.',
          timestamp: horaPeru,
          fromMe: false,
          role: 'assistant'
        };
        setMessages((prev) => [...prev, abortedReply]);
      } else {
        setErrorMsg('Error conectando con Danonino Core.');
        const errReply: ChatMessage = {
          id: 'err_' + Date.now(),
          sender: 'Danonino',
          text: 'Hubo una interrupción en el procesamiento de tu mensaje. Puedes reintentar.',
          timestamp: horaPeru,
          fromMe: false,
          role: 'assistant'
        };
        setMessages((prev) => [...prev, errReply]);
      }
    } finally {
      setIsSending(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setIsSending(false);
  };

  const handleRetryLastMessage = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.fromMe || m.role === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.text);
    }
  };

  const currentConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] pb-16 max-w-md mx-auto relative select-none">
      {/* Input oculto para subir archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Barra de Gestión de Conversación */}
      <div className="px-3 py-2 bg-danonino-card/85 backdrop-blur-md border-b border-danonino-border/70 flex items-center justify-between text-xs text-slate-300 relative z-20">
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
        {/* Separador de Fecha Inicial */}
        <div className="flex justify-center">
          <span className="px-3 py-0.5 rounded-full bg-danonino-card/70 border border-danonino-border/60 text-[10px] text-slate-400 font-mono">
            Hoy
          </span>
        </div>

        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <DanoninoAvatar size="lg" mode="idle" />
            <h3 className="text-sm font-semibold text-slate-200 mt-3">Conversación Privada</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Tus mensajes, recuerdos y archivos adjuntos están encriptados y aislados estrictamente en tu cuenta.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => {
            // Mapeo estricto del rol: Si fromMe=true o role='user', o sender!=Danonino -> USUARIO A LA DERECHA
            const isUser = msg.fromMe === true || msg.role === 'user' || (msg.sender && msg.sender.toLowerCase() !== 'danonino');
            const msgKey = String(msg.id || i);
            const isSpeaking = speakingMsgId === msgKey;
            const isCopied = copiedMsgId === msgKey;
            const formattedTime = formatMessageTime(msg.timestamp);

            return (
              <div
                key={msgKey}
                className={`flex gap-2.5 items-end ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in group`}
              >
                {/* Avatar pequeño de Danonino solo a la izquierda */}
                {!isUser && (
                  <DanoninoAvatar
                    size="sm"
                    mode={isSpeaking ? 'speaking' : isSending && i === messages.length - 1 ? 'thinking' : 'idle'}
                    showStatusBadge={false}
                    className="flex-shrink-0 mb-1"
                  />
                )}

                {/* Burbuja de Mensaje */}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm transition-all ${
                    isUser
                      ? 'bg-danonino-blue text-white rounded-br-xs'
                      : 'bg-danonino-card border border-danonino-border/80 text-slate-100 rounded-bl-xs'
                  }`}
                >
                  {/* Vista Previa de Archivo Adjunto (Foto / Video / Audio) */}
                  {msg.mediaUrl && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-white/10 max-h-52">
                      {msg.mediaType === 'image' || (!msg.mediaType && msg.mediaUrl.startsWith('data:image')) ? (
                        <img
                          src={msg.mediaUrl}
                          alt="Imagen adjunta"
                          className="w-full h-auto object-cover max-h-48 rounded-xl"
                        />
                      ) : msg.mediaType === 'video' || (!msg.mediaType && msg.mediaUrl.startsWith('data:video')) ? (
                        <video
                          src={msg.mediaUrl}
                          controls
                          className="w-full max-h-48 rounded-xl bg-black"
                        />
                      ) : (
                        <audio src={msg.mediaUrl} controls className="w-full mt-1" />
                      )}
                    </div>
                  )}

                  {/* Texto del Mensaje */}
                  {msg.text && (
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  )}

                  {/* Barra de Acciones y Hora de Perú */}
                  <div
                    className={`mt-1 flex items-center justify-between gap-3 text-[9px] pt-1 border-t ${
                      isUser ? 'border-white/15 text-danonino-ciruela/70' : 'border-danonino-border/40 text-slate-400'
                    }`}
                  >
                    {/* Timestamp con Hora de Perú */}
                    <span className="font-mono">{formattedTime}</span>

                    {/* Acciones Rápidas */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyText(msgKey, msg.text)}
                        className="hover:text-danonino-cyan transition-colors p-0.5 rounded"
                        title="Copiar texto"
                      >
                        {isCopied ? (
                          <Check className="w-3 h-3 text-danonino-cyan" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 hover:text-slate-200" />
                        )}
                      </button>

                      {!isUser && (
                        <button
                          onClick={() => toggleSpeak(msgKey, msg.text)}
                          className="hover:text-danonino-cyan transition-colors p-0.5 rounded"
                          title="Escuchar respuesta"
                        >
                          {isSpeaking ? (
                            <VolumeX className="w-3 h-3 text-danonino-cyan animate-pulse" />
                          ) : (
                            <Volume2 className="w-3 h-3 text-slate-400 hover:text-danonino-cyan" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Estado Real: Danonino está pensando / Procesando */}
        {isSending && (
          <div className="flex gap-2.5 justify-start animate-fade-in items-center">
            <DanoninoAvatar size="sm" mode="thinking" showStatusBadge={false} className="flex-shrink-0" />
            <div className="glass-panel px-3.5 py-2 rounded-2xl rounded-tl-xs text-xs text-danonino-cyan flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-danonino-cyan animate-ping" />
              <span>Danonino está pensando...</span>
              <button
                onClick={handleStopGeneration}
                className="ml-2 px-1.5 py-0.5 rounded bg-danonino-bg border border-danonino-border text-slate-400 hover:text-rose-400 flex items-center gap-1 text-[10px]"
                title="Detener respuesta"
              >
                <Square className="w-2.5 h-2.5" />
                <span>Detener</span>
              </button>
            </div>
          </div>
        )}

        {/* Reintentar si hubo error */}
        {errorMsg && (
          <div className="flex justify-center animate-fade-in">
            <button
              onClick={handleRetryLastMessage}
              className="px-3 py-1 rounded-full bg-danonino-card border border-rose-500/40 text-rose-300 hover:bg-danonino-card/80 text-[11px] flex items-center gap-1.5 font-mono"
            >
              <RotateCcw className="w-3 h-3 text-rose-400" />
              <span>Reintentar último mensaje</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Miniatura flotante de archivo antes de enviar */}
      {attachedMedia && (
        <div className="px-3 py-2 bg-danonino-card border-t border-danonino-border flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            {attachedMedia.type === 'image' ? (
              <img src={attachedMedia.previewUrl} alt="preview" className="w-10 h-10 object-cover rounded-lg" />
            ) : attachedMedia.type === 'video' ? (
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                <VideoIcon className="w-5 h-5 text-danonino-cyan" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                <Mic className="w-5 h-5 text-danonino-lavender animate-pulse" />
              </div>
            )}
            <div className="text-xs">
              <span className="font-semibold text-slate-200 block truncate max-w-[200px]">
                {attachedMedia.name}
              </span>
              <span className="text-[10px] text-danonino-cyan capitalize font-mono">
                {attachedMedia.type} listo para enviar
              </span>
            </div>
          </div>
          <button
            onClick={() => setAttachedMedia(null)}
            className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grabadora de Nota de Voz en Vivo */}
      {isRecordingAudio ? (
        <div className="p-3 bg-danonino-bg/95 border-t border-danonino-border/70 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-mono text-rose-400">
              Grabando: {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={cancelRecordingAudio}
              className="px-3 py-1 rounded-xl bg-danonino-card border border-danonino-border text-slate-400 text-xs hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={stopRecordingAudio}
              className="px-3 py-1 rounded-xl bg-danonino-cyan text-danonino-bg font-bold text-xs shadow-md"
            >
              Listo
            </button>
          </div>
        </div>
      ) : (
        /* Caja de Entrada de Texto con Acciones */
        <div className="p-3 bg-danonino-bg/95 border-t border-danonino-border/70">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-1.5">
            {/* Adjuntar Foto / Video */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-danonino-cyan transition-colors rounded-xl"
              title="Adjuntar foto o video"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Input de Texto */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onFocus={() => setTimeout(() => scrollToBottom('smooth'), 250)}
              placeholder="Mensaje para Danonino..."
              className="flex-1 bg-danonino-card text-xs text-slate-100 placeholder-slate-500 px-3.5 py-2.5 rounded-2xl border border-danonino-border focus:outline-none focus:border-danonino-cyan transition-colors"
            />

            {/* Grabar Nota de Voz */}
            <button
              type="button"
              onClick={startRecordingAudio}
              className="p-2 text-slate-400 hover:text-danonino-cyan transition-colors rounded-xl"
              title="Grabar nota de voz"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Botón Enviar */}
            <button
              type="submit"
              disabled={(!inputText.trim() && !attachedMedia) || isSending}
              className="p-2.5 bg-danonino-cyan text-danonino-bg rounded-2xl font-bold hover:opacity-90 active:scale-95 disabled:opacity-40 transition-all flex-shrink-0 shadow-sm"
              title="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
