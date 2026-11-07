import React, { useState, useEffect } from 'react';
import { miAvatarLocal } from '../services/api';

export type AvatarState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'curious'
  | 'sleeping'
  | 'drowsy'
  | 'lucid_dreaming'
  | 'waking'
  | 'error';

interface DanoninoAvatarProps {
  mode?: AvatarState | string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  audioLevel?: number; // 0.0 a 1.0 (amplitud real de micrófono o TTS)
  showStatusBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

const AvatarAnimado: React.FC<DanoninoAvatarProps> = ({
  mode = 'idle',
  size = 'md',
  audioLevel = 0,
  showStatusBadge = false,
  className = '',
  onClick
}) => {
  // Normalizar el estado hacia uno de los estados oficiales
  const normalizedState: AvatarState = (() => {
    switch (String(mode || '').toLowerCase()) {
      case 'listening':
        return 'listening';
      case 'thinking':
        return 'thinking';
      case 'speaking':
      case 'chatting':
        return 'speaking';
      case 'curious':
        return 'curious';
      case 'drowsy':
      case 'somnoliento':
        return 'drowsy';
      case 'sleeping':
      case 'dreaming':
      case 'descanso':
        return 'sleeping';
      case 'lucid_dreaming':
      case 'lucid':
      case 'lucido':
        return 'lucid_dreaming';
      case 'waking':
      case 'despertando':
        return 'waking';
      case 'error':
        return 'error';
      default:
        return 'idle';
    }
  })();

  // 1. Estado de parpadeo natural aleatorio
  const [isBlinking, setIsBlinking] = useState(false);
  // 2. Micro-sacadas oculares sutiles
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (normalizedState === 'sleeping' || normalizedState === 'drowsy') {
      setIsBlinking(false);
      return;
    }

    let blinkTimeout: NodeJS.Timeout;
    const scheduleNextBlink = () => {
      const delay = 3500 + Math.random() * 3000;
      blinkTimeout = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleNextBlink();
        }, 160);
      }, delay);
    };

    scheduleNextBlink();
    return () => clearTimeout(blinkTimeout);
  }, [normalizedState]);

  // Micro-movimientos oculares aleatorios
  useEffect(() => {
    if (normalizedState !== 'idle' && normalizedState !== 'curious' && normalizedState !== 'lucid_dreaming') {
      if (normalizedState === 'thinking') {
        setEyeOffset({ x: 1, y: -2 });
      } else {
        setEyeOffset({ x: 0, y: 0 });
      }
      return;
    }

    const saccadeInterval = setInterval(() => {
      const targets = [
        { x: 0, y: 0 },
        { x: -2, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: -1 },
        { x: 1, y: 1 }
      ];
      const next = targets[Math.floor(Math.random() * targets.length)];
      setEyeOffset(next);
    }, 4000);

    return () => clearInterval(saccadeInterval);
  }, [normalizedState]);

  // Dimensiones del avatar
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-44 h-44',
    hero: 'w-56 h-56'
  };

  const clampedLevel = Math.max(0, Math.min(1, audioLevel));
  const audioPulseScale = 1 + clampedLevel * 0.18;
  const audioRingOpacity = 0.2 + clampedLevel * 0.6;

  // Clases y colores según la máquina de estados
  const haloStyles = (() => {
    switch (normalizedState) {
      case 'listening':
        return {
          bg: 'bg-danonino-cyan',
          blur: 'blur-2xl',
          opacity: clampedLevel > 0.1 ? audioRingOpacity : 0.45,
          scale: clampedLevel > 0.1 ? audioPulseScale : 1.05
        };
      case 'speaking':
        return {
          bg: 'bg-danonino-cyan/70',
          blur: 'blur-2xl',
          opacity: 0.35 + clampedLevel * 0.5,
          scale: 1 + clampedLevel * 0.22
        };
      case 'thinking':
        return {
          bg: 'bg-danonino-violet',
          blur: 'blur-xl',
          opacity: 0.5,
          scale: 1.08
        };
      case 'curious':
        return {
          bg: 'bg-danonino-lavender/60',
          blur: 'blur-xl',
          opacity: 0.4,
          scale: 1.04
        };
      case 'drowsy':
        return {
          bg: 'bg-danonino-violet/30',
          blur: 'blur-lg',
          opacity: 0.25,
          scale: 0.99
        };
      case 'sleeping':
        return {
          bg: 'bg-danonino-violet/15',
          blur: 'blur-md',
          opacity: 0.18,
          scale: 0.97
        };
      case 'lucid_dreaming':
        return {
          bg: 'bg-gradient-to-tr from-danonino-cyan via-danonino-violet to-fuchsia-500',
          blur: 'blur-2xl',
          opacity: 0.65,
          scale: 1.12
        };
      case 'waking':
        return {
          bg: 'bg-danonino-cyan/50',
          blur: 'blur-xl',
          opacity: 0.4,
          scale: 1.02
        };
      case 'error':
        return {
          bg: 'bg-amber-500/30',
          blur: 'blur-lg',
          opacity: 0.35,
          scale: 1.0
        };
      case 'idle':
      default:
        return {
          bg: 'bg-danonino-violet/40',
          blur: 'blur-xl',
          opacity: 0.35,
          scale: 1.0
        };
    }
  })();

  const isSleeping = normalizedState === 'sleeping';
  const isDrowsy = normalizedState === 'drowsy';
  const isLucidDreaming = normalizedState === 'lucid_dreaming';
  const isWaking = normalizedState === 'waking';
  const isCurious = normalizedState === 'curious';
  const isThinking = normalizedState === 'thinking';
  const isListening = normalizedState === 'listening';
  const isSpeaking = normalizedState === 'speaking';
  const isError = normalizedState === 'error';

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none transition-transform duration-300 ${
        isCurious ? 'rotate-3' : 'rotate-0'
      } ${sizeClasses[size]} ${className}`}
      style={{
        transform: `scale(${haloStyles.scale}) ${isCurious ? 'rotate(3deg)' : ''}`
      }}
    >
      {/* 1. Halo reactivo bioluminiscente exterior */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-300 pointer-events-none ${haloStyles.bg} ${haloStyles.blur}`}
        style={{ opacity: haloStyles.opacity }}
      />

      {/* 2. Anillo orbital cinético */}
      <div
        className={`absolute inset-[-4px] rounded-full border border-dashed transition-all pointer-events-none ${
          isListening
            ? 'border-danonino-cyan/70 animate-spin'
            : isThinking
            ? 'border-danonino-violet/80 animate-spin'
            : isSpeaking
            ? 'border-danonino-cyan/50 animate-pulse'
            : isLucidDreaming
            ? 'border-danonino-cyan/80 animate-spin shadow-[0_0_10px_#06b6d4]'
            : isSleeping
            ? 'border-danonino-border/20'
            : isDrowsy
            ? 'border-danonino-violet/30'
            : isError
            ? 'border-amber-400/40'
            : 'border-danonino-violet/35'
        }`}
        style={{
          animationDuration: isThinking ? '2.5s' : isListening ? '6s' : isLucidDreaming ? '4s' : '12s'
        }}
      />

      {/* 3. Esfera central bio-digital */}
      <div className={`relative w-full h-full rounded-full overflow-hidden p-[2px] shadow-2xl transition-all duration-300 ${
        isLucidDreaming
          ? 'bg-gradient-to-tr from-cyan-400 via-fuchsia-500 to-indigo-500'
          : isDrowsy || isSleeping
          ? 'bg-gradient-to-tr from-[#1a1c2e] via-[#0f111f] to-[#0a0c16]'
          : 'bg-gradient-to-tr from-danonino-violet via-danonino-blue to-danonino-cyan'
      }`}>
        <div className="w-full h-full rounded-full bg-gradient-to-b from-[#131b2e] via-[#090d18] to-[#04060c] flex items-center justify-center relative overflow-hidden">
          {/* Ondas internas de resonancia */}
          <div
            className={`absolute w-3/4 h-3/4 rounded-full transition-all duration-200 pointer-events-none ${
              isListening
                ? 'bg-danonino-cyan/20 animate-ping'
                : isSpeaking
                ? 'bg-danonino-cyan/25'
                : isLucidDreaming
                ? 'bg-danonino-cyan/20 animate-pulse'
                : isThinking
                ? 'bg-danonino-violet/20 animate-pulse'
                : isSleeping
                ? 'bg-transparent'
                : 'bg-danonino-violet/10'
            }`}
            style={{
              transform: isSpeaking ? `scale(${1 + clampedLevel * 0.4})` : undefined
            }}
          />

          {/* Ojos Luminosos Expresivos con soporte para ciclo de sueño */}
          <div
            className="relative z-10 flex items-center justify-center gap-3.5 transition-transform duration-200"
            style={{
              transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`
            }}
          >
            {/* OJO IZQUIERDO */}
            <div
              className={`rounded-full transition-all duration-200 flex items-center justify-center ${
                isSleeping
                  ? 'w-4 h-0.5 bg-danonino-lavender/40 rounded-full'
                  : isDrowsy
                  ? 'w-3.5 h-1.5 bg-danonino-lavender/60 rounded-full'
                  : isLucidDreaming
                  ? 'w-4 h-4.5 bg-gradient-to-tr from-cyan-300 to-fuchsia-400 shadow-[0_0_12px_#06b6d4] animate-pulse'
                  : isWaking
                  ? 'w-3.5 h-2.5 bg-danonino-cyan/80 shadow-[0_0_8px_#06b6d4]'
                  : isBlinking
                  ? 'w-3.5 h-0.5 bg-danonino-lavender rounded-full'
                  : isListening
                  ? 'w-3.5 h-4.5 bg-danonino-cyan shadow-[0_0_10px_#06b6d4]'
                  : isSpeaking
                  ? 'w-3.5 h-4 bg-danonino-cyan shadow-[0_0_9px_#06b6d4]'
                  : isThinking
                  ? 'w-2.5 h-4 bg-danonino-lavender shadow-[0_0_8px_#c084fc]'
                  : isCurious
                  ? 'w-4 h-4 bg-danonino-lavender shadow-[0_0_10px_#c084fc]'
                  : isError
                  ? 'w-3 h-3 bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                  : 'w-3.5 h-3.5 bg-danonino-lavender shadow-[0_0_8px_#c084fc]'
              }`}
            >
              {!isSleeping && !isDrowsy && !isBlinking && (
                <div className="w-1 h-1 bg-white rounded-full self-start ml-0.5 mt-0.5 opacity-90" />
              )}
            </div>

            {/* OJO DERECHO */}
            <div
              className={`rounded-full transition-all duration-200 flex items-center justify-center ${
                isSleeping
                  ? 'w-4 h-0.5 bg-danonino-lavender/40 rounded-full'
                  : isDrowsy
                  ? 'w-3.5 h-1.5 bg-danonino-lavender/60 rounded-full'
                  : isLucidDreaming
                  ? 'w-4 h-4.5 bg-gradient-to-tr from-cyan-300 to-fuchsia-400 shadow-[0_0_12px_#06b6d4] animate-pulse'
                  : isWaking
                  ? 'w-3.5 h-2.5 bg-danonino-cyan/80 shadow-[0_0_8px_#06b6d4]'
                  : isBlinking
                  ? 'w-3.5 h-0.5 bg-danonino-lavender rounded-full'
                  : isListening
                  ? 'w-3.5 h-4.5 bg-danonino-cyan shadow-[0_0_10px_#06b6d4]'
                  : isSpeaking
                  ? 'w-3.5 h-4 bg-danonino-cyan shadow-[0_0_9px_#06b6d4]'
                  : isThinking
                  ? 'w-2.5 h-4 bg-danonino-lavender shadow-[0_0_8px_#c084fc]'
                  : isCurious
                  ? 'w-4 h-4 bg-danonino-lavender shadow-[0_0_10px_#c084fc]'
                  : isError
                  ? 'w-3 h-3 bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                  : 'w-3.5 h-3.5 bg-danonino-lavender shadow-[0_0_8px_#c084fc]'
              }`}
            >
              {!isSleeping && !isDrowsy && !isBlinking && (
                <div className="w-1 h-1 bg-white rounded-full self-start ml-0.5 mt-0.5 opacity-90" />
              )}
            </div>
          </div>

          {/* Micro-onda de resonancia vocal en speaking */}
          {isSpeaking && (
            <div
              className="absolute bottom-3.5 h-1 bg-danonino-cyan/80 rounded-full transition-all duration-100"
              style={{
                width: `${12 + clampedLevel * 20}px`,
                opacity: 0.6 + clampedLevel * 0.4
              }}
            />
          )}
        </div>
      </div>

      {/* 4. Badge indicador de estado */}
      {showStatusBadge && (
        <span
          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-danonino-bg shadow-sm transition-colors ${
            isListening
              ? 'bg-danonino-cyan animate-pulse'
              : isThinking
              ? 'bg-danonino-violet animate-ping'
              : isSpeaking
              ? 'bg-danonino-cyan'
              : isLucidDreaming
              ? 'bg-fuchsia-400 animate-ping'
              : isDrowsy
              ? 'bg-indigo-400'
              : isSleeping
              ? 'bg-slate-600'
              : isWaking
              ? 'bg-danonino-cyan'
              : isError
              ? 'bg-amber-500'
              : 'bg-danonino-success'
          }`}
        />
      )}
    </div>
  );
};

const TAMANOS_FOTO: Record<string, string> = { sm: 'w-9 h-9', md: 'w-14 h-14', lg: 'w-24 h-24', xl: 'w-36 h-36', hero: 'w-52 h-52' };

/** Si esta cuenta eligió una imagen para su Danonino, esa es su cara en toda la app. */
export const DanoninoAvatar: React.FC<DanoninoAvatarProps> = (props) => {
  const foto = miAvatarLocal();
  const [fallo, setFallo] = useState(false);
  if (!foto || fallo) return <AvatarAnimado {...props} />;
  return (
    <img
      src={foto}
      alt="Tu Danonino"
      onError={() => setFallo(true)}
      onClick={props.onClick}
      className={`${TAMANOS_FOTO[props.size || 'md']} rounded-full object-cover border border-danonino-border ${props.className || ''}`}
    />
  );
};
