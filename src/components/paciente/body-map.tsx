"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface BodyMapProps {
  regioesAfetadas: string[];
  className?: string;
}

// Transformados de px para porcentagem (relativos a 200x450 original do SVG)
const REGION_COORDINATES: Record<string, { top: string; left: string; label: string }> = {
  'cranio': { left: '50%', top: '7.78%', label: 'Crânio' },
  'cervical': { left: '50%', top: '15.11%', label: 'Cervical' },
  'ombro_direito': { left: '30%', top: '17.78%', label: 'Ombro Direito' },
  'ombro_esquerdo': { left: '70%', top: '17.78%', label: 'Ombro Esquerdo' },
  'braco_direito': { left: '16%', top: '31.11%', label: 'Braço Direito' },
  'braco_esquerdo': { left: '84%', top: '31.11%', label: 'Braço Esquerdo' },
  'mao_direita': { left: '16.5%', top: '41.11%', label: 'Mão Direita' },
  'mao_esquerda': { left: '83.5%', top: '41.11%', label: 'Mão Esquerda' },
  'torax': { left: '50%', top: '23.33%', label: 'Tórax' },
  'coluna_toracica': { left: '50%', top: '25.56%', label: 'Coluna Torácica' },
  'abdomen': { left: '50%', top: '35.56%', label: 'Abdômen' },
  'coluna_lombar': { left: '50%', top: '40%', label: 'Coluna Lombar' },
  'quadril': { left: '50%', top: '45.56%', label: 'Quadril' },
  'joelho_direito': { left: '38.5%', top: '70.67%', label: 'Joelho Direito' },
  'joelho_esquerdo': { left: '61.5%', top: '70.67%', label: 'Joelho Esquerdo' },
  'tornozelo_direito': { left: '36%', top: '92.22%', label: 'Tornozelo Direito' },
  'tornozelo_esquerdo': { left: '64%', top: '92.22%', label: 'Tornozelo Esquerdo' },
  'pe_direito': { left: '39%', top: '95.56%', label: 'Pé Direito' },
  'pe_esquerdo': { left: '61%', top: '95.56%', label: 'Pé Esquerdo' },
};

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
        {regioesAfetadas.map((region) => {
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
