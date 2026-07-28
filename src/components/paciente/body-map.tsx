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
        viewBox="0 0 200 480" 
        className="w-full max-w-[220px] h-auto drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(100, 20)">
          
          {/* Efeito para as "costas" caso esteja afetado */}
          {isAffected('costas') && (
            <path 
              d="M -48,150 C -40,110 -55,90 -18,72 C 0,68 18,72 55,90 C 40,110 48,150 48,150 C 44,180 40,210 35,230 C 15,240 -15,240 -35,230 C -40,210 -44,180 -48,150 Z" 
              fill="none" 
              className="stroke-rose-500/50 stroke-[12px] animate-pulse" 
              style={{ filter: 'blur(8px)' }} 
            />
          )}

          {/* Cabeça e Pescoço */}
          <path 
            id="cabeca" 
            d="M -16,35 C -16,5 -8,-5 0,-5 C 8,-5 16,5 16,35 C 16,50 11,60 18,70 L -18,70 C -11,60 -16,50 -16,35 Z" 
            className={getRegionClass('cabeca')} 
          />
          
          {/* Peito (Upper Torso) */}
          <path 
            id="peito" 
            d="M -18,70 L 18,70 C 35,70 50,76 56,88 C 60,98 54,120 48,150 C 30,152 15,155 0,155 C -15,155 -30,152 -48,150 C -54,120 -60,98 -56,88 C -50,76 -35,70 -18,70 Z" 
            className={getRegionClass('peito')} 
          />
          
          {/* Abdômen (Lower Torso) */}
          <path 
            id="abdomen" 
            d="M -48,150 C -30,152 -15,155 0,155 C 15,155 30,152 48,150 C 45,175 42,205 35,230 C 15,240 5,245 0,245 C -5,245 -15,240 -35,230 C -42,205 -45,175 -48,150 Z" 
            className={getRegionClass('abdomen')} 
          />
          
          {/* Braço Esquerdo */}
          <path 
            id="braco_esquerdo" 
            d="M -56,88 C -72,105 -80,150 -88,210 C -92,235 -78,245 -74,220 C -68,160 -58,125 -48,150 Z" 
            className={getRegionClass('braco_esquerdo')} 
          />
          
          {/* Braço Direito */}
          <path 
            id="braco_direito" 
            d="M 56,88 C 72,105 80,150 88,210 C 92,235 78,245 74,220 C 68,160 58,125 48,150 Z" 
            className={getRegionClass('braco_direito')} 
          />
          
          {/* Perna Esquerda */}
          <path 
            id="perna_esquerda" 
            d="M -35,230 C -20,238 -10,243 -2,245 C -5,280 -12,320 -15,410 C -18,425 -32,430 -30,400 C -25,350 -38,280 -35,230 Z" 
            className={getRegionClass('perna_esquerda')} 
          />
          
          {/* Perna Direita */}
          <path 
            id="perna_direita" 
            d="M 35,230 C 20,238 10,243 2,245 C 5,280 12,320 15,410 C 18,425 32,430 30,400 C 25,350 38,280 35,230 Z" 
            className={getRegionClass('perna_direita')} 
          />
          
          {/* Joelho Esquerdo - destacado na panturrilha/joelho */}
          {isAffected('joelho_esquerdo') && (
            <ellipse id="joelho_esquerdo" cx="-23" cy="320" rx="9" ry="12" className={cn(getRegionClass('joelho_esquerdo'), "stroke-[2.5px] drop-shadow-md")} />
          )}
          
          {/* Joelho Direito - destacado na panturrilha/joelho */}
          {isAffected('joelho_direito') && (
            <ellipse id="joelho_direito" cx="23" cy="320" rx="9" ry="12" className={cn(getRegionClass('joelho_direito'), "stroke-[2.5px] drop-shadow-md")} />
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
