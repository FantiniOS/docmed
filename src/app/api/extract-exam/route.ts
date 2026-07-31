import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
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

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        nome_exame: z.string().describe("Nome principal do exame, ex: Hemograma Completo, Ultrassom Abdominal"),
        tipo_exame: z.enum([
          "Exame de Sangue",
          "Exame de Imagem (Raio-X, Tomografia, etc)",
          "Urina / Fezes",
          "Avaliação Cardiológica",
          "Exame Genético",
          "Outro"
        ]).nullable().describe("Classifique o exame em um dos tipos disponíveis"),
        data_exame: z.string().nullable().describe("Data da realização do exame no formato YYYY-MM-DD. Caso não seja encontrada, retorne null."),
        observacoes: z.string().nullable().describe("Extraia os ACHADOS PRINCIPAIS e copie a CONCLUSÃO (ou impressão diagnóstica) do exame de forma literal. Destaque e liste os valores que estão fora da referência (anormais). Use um texto claro, objetivo e em português. Se tudo estiver normal, informe que não há alterações significativas, mas sempre inclua a conclusão final do médico radiologista/patologista se estiver presente no documento.")
      }),
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: 'Você é um assistente médico especialista. Analise o documento em anexo (resultado de exame laboratorial ou de laudo de imagem) e extraia as informações solicitadas no schema. O campo "observacoes" é de extrema importância: transcreva a conclusão médica/impressão diagnóstica e liste os principais achados. Não invente dados que não estão na imagem/documento.' 
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

    return NextResponse.json(result.object);
  } catch (error: any) {
    console.error('Erro na extração do exame:', error);
    return NextResponse.json(
      { error: 'Falha ao processar o exame com IA.', details: error.message },
      { status: 500 }
    );
  }
}
