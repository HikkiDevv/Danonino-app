import React from 'react';
import { AgentMode } from '../types';

interface DanoninoAvatarProps {
  mode?: AgentMode | 'speaking' | 'curious' | 'happy';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatusBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

export const DanoninoAvatar: React.FC<DanoninoAvatarProps> = ({
  mode = 'idle',
  size = 'md',
  showStatusBadge = true,
  className = '',
  onClick
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-20 h-20',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  const isThinking = mode === 'thinking';
  const isDreaming = mode === 'dreaming';
  const isSpeaking = mode === 'speaking' || mode === 'chatting';
  const isCurious = mode === 'curious';

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 ${sizeMap[size]} ${className}`}
    >
      {/* 1. Anillo de brillo ambiental exterior */}
      <div
        className={`absolute inset-0 rounded-full blur-xl transition-all duration-700 ${
          isThinking
            ? 'bg-danonino-cyan/50 animate-pulse'
            : isDreaming
            ? 'bg-danonino-lavender/30 animate-pulse-glow'
            : isSpeaking
            ? 'bg-danonino-blue/60 animate-ping'
            : 'bg-danonino-violet/40 animate-pulse-glow'
        }`}
      />

      {/* 2. Anillo orbital giratorio con partículas */}
      <div
        className={`absolute inset-[-4px] rounded-full border border-dashed transition-all duration-1000 ${
          isThinking
            ? 'border-danonino-cyan animate-spin'
            : isDreaming
            ? 'border-danonino-lavender/30'
            : 'border-danonino-violet/40'
        }`}
        style={{ animationDuration: isThinking ? '3s' : '12s' }}
      />

      {/* 3. Núcleo orgánico bio-digital */}
      <div className="relative w-full h-full rounded-full overflow-hidden p-[2px] bg-gradient-to-tr from-danonino-violet via-danonino-blue to-danonino-cyan shadow-xl">
        <div className="w-full h-full rounded-full bg-gradient-to-b from-[#131b2f] via-[#0b101d] to-[#060810] flex items-center justify-center relative">
          {/* Ondas internas de resonancia */}
          <div
            className={`absolute w-3/4 h-3/4 rounded-full transition-all duration-500 ${
              isThinking
                ? 'bg-danonino-cyan/20 animate-ping'
                : isSpeaking
                ? 'bg-danonino-blue/30 scale-110'
                : 'bg-danonino-violet/15'
            }`}
          />

          {/* Ojos expresivos de Danonino */}
          <div className="relative z-10 flex items-center justify-center gap-3">
            {/* Ojo Izquierdo */}
            <div
              className={`rounded-full transition-all duration-300 ${
                isDreaming
                  ? 'w-3 h-1 bg-danonino-lavender/70 rounded-none transform rotate-3'
                  : isThinking
                  ? 'w-2.5 h-4 bg-danonino-cyan animate-bounce'
                  : isSpeaking
                  ? 'w-3 h-4 bg-danonino-cyan'
                  : 'w-3 h-3 bg-danonino-lavender shadow-[0_0_8px_#c084fc]'
              }`}
            >
              {!isDreaming && (
                <div className="w-1 h-1 bg-white rounded-full ml-1 mt-0.5" />
              )}
            </div>

            {/* Ojo Derecho */}
            <div
              className={`rounded-full transition-all duration-300 ${
                isDreaming
                  ? 'w-3 h-1 bg-danonino-lavender/70 rounded-none transform -rotate-3'
                  : isThinking
                  ? 'w-2.5 h-4 bg-danonino-cyan animate-bounce [animation-delay:150ms]'
                  : isSpeaking
                  ? 'w-3 h-4 bg-danonino-cyan'
                  : 'w-3 h-3 bg-danonino-lavender shadow-[0_0_8px_#c084fc]'
              }`}
            >
              {!isDreaming && (
                <div className="w-1 h-1 bg-white rounded-full ml-1 mt-0.5" />
              )}
            </div>
          </div>

          {/* Destello sutil de expresión bucal o resonancia */}
          {isSpeaking && (
            <div className="absolute bottom-4 w-3 h-1.5 rounded-full bg-danonino-cyan animate-pulse" />
          )}
        </div>
      </div>

      {/* 4. Badge indicador de estado */}
      {showStatusBadge && (
        <span
          className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-danonino-bg shadow-sm ${
            isThinking
              ? 'bg-danonino-cyan animate-ping'
              : isDreaming
              ? 'bg-danonino-lavender'
              : mode === 'offline'
              ? 'bg-slate-500'
              : 'bg-danonino-success'
          }`}
        />
      )}
    </div>
  );
};
