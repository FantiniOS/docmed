import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extrai a data local ignorando offsets (corrige fuso horário do BD e bugs de browser).
 * Transforma uma string YYYY-MM-DD(THH:mm) num objeto Date local exato,
 * sem que o navegador aplique -3h (ou outro fuso) mudando o dia.
 */
export function parseLocal(dataString: string): Date {
  if (!dataString) return new Date();
  
  // Extrai componentes ignorando qualquer fuso horário anexado (Z, +00:00)
  const match = dataString.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s)?(\d{2})?:?(\d{2})?/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const hour = match[4] ? parseInt(match[4], 10) : 12; // 12h se não tiver hora (evita virada de dia)
    const minute = match[5] ? parseInt(match[5], 10) : 0;
    
    return new Date(year, month, day, hour, minute);
  }
  return new Date(dataString);
}
