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
        summary: z.string().describe('Relatório clínico completo e detalhado, estruturado com títulos em markdown (##). Deve conter obrigatoriamente as seguintes seções: "## ⚠️ Alertas Críticos" (listar alertas graves, valores fora da faixa, situações que requerem atenção imediata — omitir seção se não houver), "## 📋 Perfil do Paciente" (idade, sexo, condições pré-existentes, medicamentos em uso se disponíveis), "## 🔬 Análise dos Exames" (detalhar cada exame relevante com valores encontrados, valores de referência e interpretação clínica), "## 📈 Evolução Clínica" (linha do tempo das consultas, tendências observadas, progressão ou regressão dos quadros), "## 🗺️ Mapeamento Topográfico" (descrever as regiões do corpo afetadas e correlacionar com os achados clínicos), "## 💡 Impressão Clínica e Recomendações" (parecer geral do quadro, sugestões de acompanhamento, exames complementares recomendados). Use listas com marcadores (- ) para organizar os itens dentro de cada seção. Seja técnico mas compreensível. Não omita dados relevantes dos exames.'),
        regioes_afetadas: z.array(z.enum([
          'cranio', 'cervical', 'coluna_toracica', 'coluna_lombar', 
          'ombro_esquerdo', 'ombro_direito', 'braco_esquerdo', 'braco_direito', 
          'mao_esquerda', 'mao_direita', 'torax', 'abdomen', 'quadril', 
          'joelho_esquerdo', 'joelho_direito', 'tornozelo_esquerdo', 'tornozelo_direito', 
          'pe_esquerdo', 'pe_direito'
        ])).describe('Lista de regiões do corpo afetadas com base nas queixas ou problemas de saúde descritos na evolução clínica ou exames. Seja extremamente granular e preciso (ex: se o laudo fala de cervical, retorne "cervical" e não o tronco). Mapeie problemas respiratórios/cardíacos para "torax", gastrointestinais para "abdomen", neurológicos/cefaleia para "cranio". Retorne vazio se nenhum problema físico evidente.')
      }),
      system: 'Você é um médico triador sênior com mais de 20 anos de experiência em clínica geral e medicina interna. Sua tarefa é analisar profundamente todos os dados clínicos fornecidos (dados pessoais, exames laboratoriais/imagem e evolução clínica) e produzir um DOSSIÊ CLÍNICO COMPLETO E DETALHADO. Não resuma de forma superficial — analise cada exame, cada consulta, cada dado disponível. Correlacione achados entre si (ex: alteração renal + hipertensão = risco cardiovascular elevado). Use linguagem técnica mas acessível. Estruture o relatório com seções tituladas usando ## e emojis. Destaque valores laboratoriais alterados com negrito (**valor**). Sempre que possível, inclua valores de referência ao lado dos resultados. Mapeie com precisão cirúrgica as regiões anatômicas afetadas.',
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
