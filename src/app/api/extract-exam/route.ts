import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

export const maxDuration = 60; // Allow more time for processing

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const isImage = file.type.startsWith('image/');

    const result = await generateObject({
      model: google('gemini-1.5-flash'),
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
        observacoes: z.string().nullable().describe("Destaque e liste os valores que estão fora da referência (anormais) e conclusões principais. Use um texto claro, objetivo e em português. Se tudo estiver normal, informe que não há alterações significativas.")
      }),
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: 'Você é um assistente médico especialista. Analise o documento em anexo (resultado de exame laboratorial ou de imagem) e extraia as informações solicitadas no schema. Na seção de observações, destaque os valores que estão anormais/fora do valor de referência.' 
            },
            isImage ? {
              type: 'image',
              image: buffer,
            } : {
              type: 'file',
              data: buffer,
              mimeType: file.type,
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
