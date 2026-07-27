import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const maxDuration = 60; // Allow more time for processing

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave de API não configurada', details: 'A variável de ambiente GEMINI_API_KEY não foi encontrada no servidor Vercel.' }, { status: 500 });
    }

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

    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      system: 'Você é um médico triador experiente. Leia os dados do paciente e crie um resumo executivo claro, técnico, mas objetivo. Destaque alertas graves no topo. Agrupe as tendências de saúde com base na evolução clínica. Limite a resposta a 3 parágrafos.',
      prompt: promptContext,
    });

    return NextResponse.json({ summary: text });
  } catch (error: any) {
    console.error('Erro ao gerar resumo:', error);
    return NextResponse.json(
      { error: 'Falha ao gerar resumo com IA.', details: error.message },
      { status: 500 }
    );
  }
}
