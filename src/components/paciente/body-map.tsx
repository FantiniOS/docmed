"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface BodyMapProps {
  regioesAfetadas: string[];
  className?: string;
}

const REGION_COORDINATES: Record<string, { cx: number; cy: number; label: string }> = {
  'cranio': { cx: 100, cy: 35, label: 'Crânio' },
  'cervical': { cx: 100, cy: 68, label: 'Cervical' },
  'ombro_direito': { cx: 60, cy: 80, label: 'Ombro Direito' },
  'ombro_esquerdo': { cx: 140, cy: 80, label: 'Ombro Esquerdo' },
  'braco_direito': { cx: 32, cy: 140, label: 'Braço Direito' },
  'braco_esquerdo': { cx: 168, cy: 140, label: 'Braço Esquerdo' },
  'mao_direita': { cx: 33, cy: 185, label: 'Mão Direita' },
  'mao_esquerda': { cx: 167, cy: 185, label: 'Mão Esquerda' },
  'torax': { cx: 100, cy: 105, label: 'Tórax' },
  'coluna_toracica': { cx: 100, cy: 115, label: 'Coluna Torácica' },
  'abdomen': { cx: 100, cy: 160, label: 'Abdômen' },
  'coluna_lombar': { cx: 100, cy: 180, label: 'Coluna Lombar' },
  'quadril': { cx: 100, cy: 205, label: 'Quadril' },
  'joelho_direito': { cx: 77, cy: 318, label: 'Joelho Direito' },
  'joelho_esquerdo': { cx: 123, cy: 318, label: 'Joelho Esquerdo' },
  'tornozelo_direito': { cx: 72, cy: 415, label: 'Tornozelo Direito' },
  'tornozelo_esquerdo': { cx: 128, cy: 415, label: 'Tornozelo Esquerdo' },
  'pe_direito': { cx: 78, cy: 430, label: 'Pé Direito' },
  'pe_esquerdo': { cx: 122, cy: 430, label: 'Pé Esquerdo' },
};

export function BodyMap({ regioesAfetadas = [], className }: BodyMapProps) {
  // Cores neutras fixas para o SVG base
  const baseClass = "fill-slate-200 stroke-slate-300 dark:fill-slate-800 dark:stroke-slate-700 transition-colors duration-500";

  return (
    <div className={cn("relative flex flex-col items-center justify-center w-full p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border-slate-200 dark:border-slate-700", className)}>
      <svg 
        viewBox="0 0 200 450" 
        className="w-full max-w-[220px] h-auto drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Camada Base do Corpo Humano */}
        <g strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Cabeça */}
          <circle cx="100" cy="40" r="26" className={baseClass} />
          
          {/* Peito (Upper Torso) */}
          <path d="M 68 75 Q 100 68 132 75 L 126 130 Q 100 136 74 130 Z" className={baseClass} />
          
          {/* Abdômen (Lower Torso) */}
          <path d="M 74 133 Q 100 139 126 133 L 120 190 Q 100 205 80 190 Z" className={baseClass} />
          
          {/* Braço Esquerdo (paciente direita da imagem) */}
          <path d="M 64 80 Q 30 85 24 140 Q 20 175 28 195 Q 38 195 38 140 Q 42 100 58 90 Z" className={baseClass} />
          
          {/* Braço Direito (paciente esquerda da imagem) */}
          <path d="M 136 80 Q 170 85 176 140 Q 180 175 172 195 Q 162 195 162 140 Q 158 100 142 90 Z" className={baseClass} />
          
          {/* Perna Esquerda (paciente direita da imagem) */}
          <path d="M 80 195 L 75 295 Q 73 315 80 325 L 70 425 Q 70 435 85 435 L 90 325 Q 96 305 96 200 Z" className={baseClass} />
          
          {/* Perna Direita (paciente esquerda da imagem) */}
          <path d="M 120 195 L 125 295 Q 127 315 120 325 L 130 425 Q 130 435 115 435 L 110 325 Q 104 305 104 200 Z" className={baseClass} />
        </g>

        {/* Camada de Pinos de Alerta (Granular) */}
        {regioesAfetadas.map((region) => {
          const coord = REGION_COORDINATES[region];
          if (!coord) return null; // Ignora se a região não existir no mapa
          
          return (
            <g key={region} transform={`translate(${coord.cx}, ${coord.cy})`}>
              {/* Anel Pulsante Externo */}
              <circle 
                r="6" 
                className="fill-rose-500 animate-ping opacity-75 origin-center" 
              />
              {/* Ponto Sólido Interno */}
              <circle 
                r="4" 
                className="fill-rose-600 stroke-white dark:stroke-zinc-900 stroke-[1.5px]" 
              />
            </g>
          );
        })}
      </svg>
      
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
