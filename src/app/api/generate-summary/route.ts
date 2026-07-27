import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export const maxDuration = 60; // Allow more time for processing

export async function POST(req: Request) {
  try {
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
