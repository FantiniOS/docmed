"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface BodyMapProps {
  regioesAfetadas: string[];
  className?: string;
}

export function BodyMap({ regioesAfetadas = [], className }: BodyMapProps) {
  const isAffected = (region: string) => regioesAfetadas.includes(region);

  const getRegionClass = (region: string) => {
    return cn(
      "transition-all duration-500 ease-in-out cursor-default",
      isAffected(region) 
        ? "fill-rose-500 stroke-rose-600 dark:stroke-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]" 
        : "fill-slate-200 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-700"
    );
  };

  return (
    <div className={cn("relative flex flex-col items-center justify-center w-full p-4 bg-muted/30 rounded-2xl border", className)}>
      <svg 
        viewBox="0 0 200 450" 
        className="w-full max-w-[220px] h-auto drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          
          {/* Efeito para as "costas" caso esteja afetado */}
          {isAffected('costas') && (
            <path 
              d="M 60 70 L 140 70 L 135 195 L 65 195 Z" 
              fill="none" 
              className="stroke-rose-500/30 stroke-[16px] animate-pulse" 
            />
          )}

          {/* Cabeça */}
          <circle id="cabeca" cx="100" cy="40" r="26" className={getRegionClass('cabeca')} />
          
          {/* Peito (Upper Torso) */}
          <path id="peito" d="M 68 75 Q 100 68 132 75 L 126 130 Q 100 136 74 130 Z" className={getRegionClass('peito')} />
          
          {/* Abdômen (Lower Torso) */}
          <path id="abdomen" d="M 74 133 Q 100 139 126 133 L 120 190 Q 100 205 80 190 Z" className={getRegionClass('abdomen')} />
          
          {/* Braço Esquerdo */}
          <path id="braco_esquerdo" d="M 64 80 Q 30 85 24 140 Q 20 175 28 195 Q 38 195 38 140 Q 42 100 58 90 Z" className={getRegionClass('braco_esquerdo')} />
          
          {/* Braço Direito */}
          <path id="braco_direito" d="M 136 80 Q 170 85 176 140 Q 180 175 172 195 Q 162 195 162 140 Q 158 100 142 90 Z" className={getRegionClass('braco_direito')} />
          
          {/* Perna Esquerda */}
          <path id="perna_esquerda" d="M 80 195 L 75 295 Q 73 315 80 325 L 70 425 Q 70 435 85 435 L 90 325 Q 96 305 96 200 Z" className={getRegionClass('perna_esquerda')} />
          
          {/* Perna Direita */}
          <path id="perna_direita" d="M 120 195 L 125 295 Q 127 315 120 325 L 130 425 Q 130 435 115 435 L 110 325 Q 104 305 104 200 Z" className={getRegionClass('perna_direita')} />
          
          {/* Joelho Esquerdo - desenhado por cima da perna para destacar se especificado */}
          {isAffected('joelho_esquerdo') && (
            <circle id="joelho_esquerdo" cx="77" cy="318" r="12" className={cn(getRegionClass('joelho_esquerdo'), "stroke-[3px]")} />
          )}
          
          {/* Joelho Direito - desenhado por cima da perna para destacar se especificado */}
          {isAffected('joelho_direito') && (
            <circle id="joelho_direito" cx="123" cy="318" r="12" className={cn(getRegionClass('joelho_direito'), "stroke-[3px]")} />
          )}
        </g>
      </svg>
      
      {regioesAfetadas.length > 0 && (
        <div className="absolute top-4 right-4 flex justify-center">
          <div className="bg-white dark:bg-zinc-900 border px-3 py-1.5 rounded-full text-xs font-semibold text-rose-500 flex items-center gap-2 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            {regioesAfetadas.length} {regioesAfetadas.length === 1 ? 'foco' : 'focos'}
          </div>
        </div>
      )}

      {regioesAfetadas.length === 0 && (
        <div className="absolute top-4 right-4 flex justify-center">
          <div className="bg-white dark:bg-zinc-900 border px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground flex items-center gap-2 shadow-sm">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            Sem alertas
          </div>
        </div>
      )}
    </div>
  );
}
