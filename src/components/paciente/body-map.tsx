"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface BodyMapProps {
  regioesAfetadas: string[];
  className?: string;
}

import { REGION_COORDINATES, VALID_BODY_PARTS } from '@/lib/constants/body-map';

export function BodyMap({ regioesAfetadas = [], className }: BodyMapProps) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center w-full p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border-slate-200 dark:border-slate-700", className)}>
      
      {/* Container com aspect ratio exato para suportar posicionamento absoluto (%) */}
      <div className="relative w-full max-w-[220px] aspect-[200/450] drop-shadow-sm pointer-events-none">
        
        {/* Camada Base do Corpo Humano (Estática, imune ao reset do html-to-image) */}
        {/* Next/Image garante otimização e o componente permanece intacto no snapshot */}
        <Image 
          src="/mapa-corpo-base.svg" 
          alt="Mapa Corporal" 
          fill
          priority
          className="object-contain"
        />

        {/* Camada de Pinos de Alerta (Granular via DIVs Absolutas) */}
        {(regioesAfetadas || []).map((region) => {
          const coord = REGION_COORDINATES[region];
          if (!coord) return null; // Ignora se a região não existir no mapa
          
          return (
            <div 
              key={region} 
              className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white dark:border-zinc-900 shadow-sm z-10"
              style={{
                top: coord.top,
                left: coord.left,
                backgroundColor: '#e11d48', // Cor HEX explícita (rose-600)
              }}
            >
              {/* Anel Pulsante (Opcional, apenas visual, some no PDF ou fica congelado dependendo do render) */}
              <div 
                className="absolute inset-0 rounded-full animate-ping z-0"
                style={{
                  backgroundColor: '#f43f5e', // Cor HEX explícita (rose-500)
                  opacity: 0.75
                }}
              />
            </div>
          );
        })}
      </div>
      
      {/* Badge Flutuante Informativo */}
      {regioesAfetadas.length > 0 && (
        <div className="absolute top-4 right-4 flex justify-center">
          <div className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-500 flex items-center gap-2 shadow-sm">
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
          <div className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2 shadow-sm">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            Sem alertas
          </div>
        </div>
      )}
    </div>
  );
}
