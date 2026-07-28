import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  return NextResponse.json({ ok: true, key_exists: !!apiKey });
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave de API não configurada', details: 'A variável de ambiente GEMINI_API_KEY não foi encontrada no servidor Vercel.' }, { status: 500 });
    }

    const google = createGoogleGenerativeAI({
      apiKey,
    });

    const body = await req.json();
    
    // Validate payload
    if (!body || (!body.paciente && !body.exames && !body.evolucao)) {
      return NextResponse.json({ error: 'Dados insuficientes fornecidos para resumo.' }, { status: 400 });
    }

    const { paciente, exames, evolucao } = body;

    const promptContext = `
Dados do Paciente:
${JSON.stringify(paciente, null, 2)}

Últimos Exames:
${JSON.stringify(exames, null, 2)}

Evolução Clínica / Consultas:
${JSON.stringify(evolucao, null, 2)}
`;

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        summary: z.string().describe('Resumo executivo claro, técnico, mas objetivo. Destaque alertas graves no topo. Agrupe as tendências de saúde com base na evolução clínica. Limite a resposta a 3 parágrafos. Use formatação markdown para destacar alertas e seções.'),
        regioes_afetadas: z.array(z.enum([
          'cranio', 'cervical', 'coluna_toracica', 'coluna_lombar', 
          'ombro_esquerdo', 'ombro_direito', 'braco_esquerdo', 'braco_direito', 
          'mao_esquerda', 'mao_direita', 'torax', 'abdomen', 'quadril', 
          'joelho_esquerdo', 'joelho_direito', 'tornozelo_esquerdo', 'tornozelo_direito', 
          'pe_esquerdo', 'pe_direito'
        ])).describe('Lista de regiões do corpo afetadas com base nas queixas ou problemas de saúde descritos na evolução clínica ou exames. Seja extremamente granular e preciso (ex: se o laudo fala de cervical, retorne "cervical" e não o tronco). Mapeie problemas respiratórios/cardíacos para "torax", gastrointestinais para "abdomen", neurológicos/cefaleia para "cranio". Retorne vazio se nenhum problema físico evidente.')
      }),
      system: 'Você é um médico triador experiente. Leia os dados do paciente, crie um resumo executivo e mapeie as regiões do corpo afetadas pelas doenças/queixas atuais.',
      prompt: promptContext,
    });

    return NextResponse.json(object);
  } catch (error: any) {
    console.error('Erro ao gerar resumo:', error);
    return NextResponse.json(
      { error: 'Falha ao gerar resumo com IA.', details: error.message },
      { status: 500 }
    );
  }
}
