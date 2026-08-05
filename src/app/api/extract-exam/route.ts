import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chave de API não configurada', details: 'A variável de ambiente GEMINI_API_KEY não foi encontrada no servidor Vercel.' }, { status: 500 });
    }

    const google = createGoogleGenerativeAI({
      apiKey,
    });

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const isImage = file.type.startsWith('image/');

    const systemPrompt = `Você é um assistente médico especialista. Analise o documento em anexo e extraia as informações clínicas.
REGRAS CRÍTICAS DE SAÍDA:
- Retorne ÚNICA E EXCLUSIVAMENTE um objeto JSON válido, sem nenhum texto antes ou depois.
- As chaves EXATAS do JSON devem ser:
  "familiar_nome" (string ou null, extraia o nome do paciente/familiar do documento),
  "nome_exame" (string, nome principal do exame),
  "tipo_exame" (string ou null, classifique como: Exame de Sangue, Exame de Imagem, Urina / Fezes, Avaliação Cardiológica, Exame Genético ou Outro),
  "data_exame" (string ou null, formato YYYY-MM-DD),
  "observacoes" (string ou null, principais achados e conclusão literal).
- NUNCA use "paciente_id". Se houver nome, use "familiar_nome".`;

    const { text: responseText } = await generateText({
      model: google('gemini-2.5-flash'),
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: 'Extraia as informações do exame anexado. Lembre-se: retorne APENAS um JSON válido seguindo a estrutura solicitada.' 
            },
            isImage ? {
              type: 'image',
              image: buffer,
            } : {
              type: 'file',
              data: buffer,
              mediaType: file.type,
            }
          ]
        }
      ]
    });

    const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    console.log("RESPOSTA CRUA DA IA:", cleanText);

    let parsedData;
    try {
      parsedData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error("Erro ao fazer parse do JSON da IA:", parseError);
      return NextResponse.json({ error: 'A resposta da IA não foi um JSON válido.', details: cleanText }, { status: 500 });
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Erro na extração do exame:', error);
    return NextResponse.json(
      { error: 'Falha ao processar o exame com IA.', details: error.message },
      { status: 500 }
    );
  }
}
