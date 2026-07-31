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

    // =============================================
    // LIMPEZA DE DADOS — Enviar apenas campos relevantes para a IA
    // =============================================

    const pacienteLimpo = {
      nome: paciente.nome,
      data_nascimento: paciente.data_nascimento,
      sexo: paciente.sexo,
      tipo_sanguineo: paciente.tipo_sanguineo,
      alergias: paciente.alergias || 'Não reportadas',
      doencas_cronicas: paciente.doencas_cronicas || 'Nenhuma registrada',
      medicamentos_uso_continuo: paciente.medicamentos_uso_continuo || 'Nenhum registrado',
    };

    const examesLimpos = (exames || []).map((e: any) => ({
      nome_exame: e.nome_exame,
      tipo_exame: e.tipo_exame,
      data_exame: e.data_exame,
      medico_solicitante: e.medicos?.nome || 'Não informado',
      especialidade_medico: e.medicos?.especialidade || null,
      observacoes_do_laudo: e.observacoes || null,
      // Se não há observações, o laudo não foi transcrito
      laudo_disponivel: !!e.observacoes,
    }));

    const evolucaoLimpa = (evolucao || []).map((r: any) => ({
      titulo: r.titulo,
      data_relatorio: r.data_relatorio,
      medico: r.medicos?.nome || 'Não informado',
      especialidade_medico: r.medicos?.especialidade || null,
      observacoes: r.observacoes || null,
    }));

    const promptContext = `
DADOS DO PACIENTE:
${JSON.stringify(pacienteLimpo, null, 2)}

EXAMES REGISTRADOS (${examesLimpos.length} exames):
${JSON.stringify(examesLimpos, null, 2)}

EVOLUÇÃO CLÍNICA / RELATÓRIOS (${evolucaoLimpa.length} registros):
${JSON.stringify(evolucaoLimpa, null, 2)}
`;

    const systemPrompt = `Você é um médico triador sênior com mais de 20 anos de experiência em clínica geral e medicina interna.

REGRAS CRÍTICAS:
1. Leia ATENTAMENTE os documentos e imagens anexados a esta requisição. Eles contêm os laudos completos dos exames e relatórios médicos.
2. NUNCA INVENTE ou FABRIQUE achados. Extraia os dados REAIS dos documentos anexados (arquivos PDF, imagens).
3. Se um exame não possuir arquivo anexado e também não possuir observações transcritas, informe que os achados não estão disponíveis.
4. Analise profundamente os laudos: identifique valores alterados, correlacione com o quadro clínico e destaque alertas.
5. Correlacione achados entre diferentes exames quando possível (ex: alteração renal + hipertensão = risco cardiovascular elevado).
6. Use linguagem técnica mas acessível.
7. Estruture o relatório com seções tituladas usando ## e emojis.
8. Destaque valores laboratoriais alterados com negrito (**valor**).
9. Sempre que possível, inclua valores de referência ao lado dos resultados.
10. Mapeie com precisão cirúrgica as regiões anatômicas afetadas baseando-se SOMENTE em dados concretos dos laudos.`;

    // Preparar conteúdo para a IA (Textos + Arquivos Anexos)
    const contentParts: any[] = [
      { type: 'text', text: promptContext },
      { type: 'text', text: 'Abaixo estão os documentos originais dos exames e relatórios. Analise o conteúdo deles rigorosamente para compor o seu relatório clínico:' }
    ];

    // Função auxiliar para buscar e anexar arquivos
    const fetchAndAttachFile = async (url: string, prefixText: string) => {
      try {
        const response = await fetch(url);
        if (!response.ok) return;
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get('content-type') || 'application/pdf';
        const isImage = contentType.startsWith('image/');
        
        contentParts.push({ type: 'text', text: prefixText });
        
        if (isImage) {
          contentParts.push({ type: 'image', image: arrayBuffer });
        } else {
          contentParts.push({ type: 'file', data: arrayBuffer, mediaType: contentType });
        }
      } catch (e) {
        console.error('Erro ao baixar arquivo para IA:', url, e);
      }
    };

    // Processar arquivos de exames
    const fetchPromises: Promise<void>[] = [];
    
    if (exames && Array.isArray(exames)) {
      for (const ex of exames) {
        if (ex.arquivo_url) {
          const prefix = `\n--- LAUDO ORIGINAL DO EXAME: ${ex.nome_exame} (${ex.data_exame}) ---`;
          fetchPromises.push(fetchAndAttachFile(ex.arquivo_url, prefix));
        }
      }
    }

    // Processar arquivos de evolução/relatórios
    if (evolucao && Array.isArray(evolucao)) {
      for (const rel of evolucao) {
        if (rel.arquivo_url) {
          const prefix = `\n--- DOCUMENTO ORIGINAL: ${rel.titulo} (${rel.data_relatorio}) ---`;
          fetchPromises.push(fetchAndAttachFile(rel.arquivo_url, prefix));
        }
      }
    }

    // Aguardar o download de todos os arquivos
    await Promise.all(fetchPromises);

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: z.object({
        summary: z.string().describe('Relatório clínico completo e detalhado, estruturado com títulos em markdown (##). Deve conter obrigatoriamente as seguintes seções: "## ⚠️ Alertas Críticos" (listar alertas graves, valores fora da faixa, situações que requerem atenção imediata — omitir seção se não houver), "## 📋 Perfil do Paciente" (idade, sexo, condições pré-existentes, medicamentos em uso se disponíveis), "## 🔬 Análise dos Exames" (para cada exame: nome, data, médico, e os ACHADOS REAIS extraídos dos laudos anexados — NUNCA inventar achados, LEIA os arquivos anexos), "## 📈 Evolução Clínica" (linha do tempo dos relatórios/consultas, tendências observadas), "## 🗺️ Mapeamento Topográfico" (descrever as regiões do corpo afetadas baseando-se APENAS em dados concretos), "## 💡 Impressão Clínica e Recomendações" (parecer geral do quadro, sugestões de acompanhamento). Use listas com marcadores (- ) para organizar os itens dentro de cada seção.'),
        regioes_afetadas: z.array(z.enum([
          'cranio', 'cervical', 'coluna_toracica', 'coluna_lombar', 
          'ombro_esquerdo', 'ombro_direito', 'braco_esquerdo', 'braco_direito', 
          'mao_esquerda', 'mao_direita', 'torax', 'abdomen', 'quadril', 
          'joelho_esquerdo', 'joelho_direito', 'tornozelo_esquerdo', 'tornozelo_direito', 
          'pe_esquerdo', 'pe_direito'
        ])).describe('Lista de regiões do corpo afetadas com base SOMENTE em achados concretos nas observações dos exames ou evolução clínica. Seja extremamente granular e preciso. NÃO inclua regiões baseado apenas no nome do exame — só inclua se houver achados reais. Retorne vazio se nenhum problema físico confirmado.')
      }),
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: contentParts
        }
      ]
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
