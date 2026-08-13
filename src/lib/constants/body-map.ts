// Transformados de px para porcentagem (relativos a 200x450 original do SVG)
export const REGION_COORDINATES: Record<string, { top: string; left: string; label: string }> = {
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
  'pelvis': { left: '50%', top: '48.5%', label: 'Pelve / Trato Reprodutor' },
};

export const VALID_BODY_PARTS = Object.keys(REGION_COORDINATES) as readonly string[];
