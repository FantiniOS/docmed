import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

// Configura o tempo máximo de execução na Vercel para 60 segundos
// necessário porque o Gemini pode demorar ao ler múltiplos PDFs
export const maxDuration = 60;

import { VALID_BODY_PARTS } from '@/components/paciente/body-map';

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
    console.log("PAYLOAD RECEBIDO DO FRONTEND:", body);
    
    // Validate payload
    if (!body || (!body.paciente && !body.familiar && !body.exames && !body.evolucao)) {
      return NextResponse.json({ error: 'Dados insuficientes fornecidos para resumo.' }, { status: 400 });
    }

    const { exames, evolucao } = body;
    const paciente = body.paciente || body.familiar;

    if (!paciente) {
      return NextResponse.json({ error: 'Dados do paciente/familiar ausentes.' }, { status: 400 });
    }

    // =============================================
    // LIMPEZA DE DADOS — Enviar apenas campos relevantes para a IA
    // =============================================

    let idadeCalculada = 'Desconhecida';
    if (paciente.data_nascimento) {
      const nascC = new Date(paciente.data_nascimento);
      const hoje = new Date();
      let idade = hoje.getFullYear() - nascC.getFullYear();
      const m = hoje.getMonth() - nascC.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nascC.getDate())) {
        idade--;
      }
      idadeCalculada = `${idade} anos`;
    }

    const pacienteLimpo = {
      nome: paciente.nome,
      data_nascimento: paciente.data_nascimento,
      idade_calculada: idadeCalculada,
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

=== REGRAS ABSOLUTAS (INVIOLÁVEIS) ===

A1. Toda afirmação presente no relatório DEVE estar documentada em pelo menos um documento anexado ou em uma observação transcrita fornecida no contexto. Nenhuma afirmação pode existir sem fonte documental.
A2. É PROIBIDO utilizar conhecimento médico externo para completar, inferir ou deduzir informações ausentes nos documentos.
A3. É PROIBIDO inferir diagnósticos, prognósticos, causas, gravidade, resposta terapêutica ou motivos para troca de medicamentos.
A4. Quando uma conclusão puder ser interpretada de mais de uma forma, escolha SEMPRE a interpretação mais conservadora.
A5. Caso não exista evidência documental suficiente para uma afirmação, escreva exatamente: "Não informado".
A6. NUNCA utilize as seguintes expressões, A MENOS QUE elas estejam LITERALMENTE presentes em algum documento enviado:
    - "provavelmente"
    - "possivelmente"
    - "sugere"
    - "compatível com"
    - "falha terapêutica"
    - "respondeu ao tratamento"
    - "altamente ativo"
    - "progressão"
    - "melhora clínica"
    Se alguma dessas expressões constar textualmente em um laudo, você pode reproduzi-la entre aspas citando a fonte.

=== REGRAS OPERACIONAIS ===

1. Leia ATENTAMENTE os documentos e imagens anexados a esta requisição. Eles contêm os laudos completos dos exames e relatórios médicos.
2. NUNCA INVENTE ou FABRIQUE achados. Extraia os dados REAIS dos documentos anexados (arquivos PDF, imagens).
3. Se um exame não possuir arquivo anexado e também não possuir observações transcritas, escreva: "Laudo não disponível para análise".
4. Identifique valores alterados nos laudos e destaque-os. NÃO interprete a causa da alteração — apenas reporte o achado tal como documentado.
5. NÃO correlacione achados entre exames diferentes para sugerir diagnósticos ou riscos. Apenas reporte cada achado individualmente conforme documentado.
6. Use linguagem técnica mas acessível.
7. Estruture o relatório com seções tituladas usando ## e emojis.
8. Destaque valores laboratoriais alterados com negrito (**valor**).
9. Sempre que possível, inclua valores de referência ao lado dos resultados (somente se estiverem presentes no laudo).
10. Mapeie as regiões anatômicas afetadas baseando-se SOMENTE em achados concretos e explícitos dos laudos. NÃO deduza regiões a partir do nome do exame.
11. NUNCA calcule a idade do paciente. Utilize EXATAMENTE a idade fornecida no campo "idade_calculada" do contexto.
12. Se houver alterações clínicas, retorne um array 'partes_afetadas'. VOCÊ DEVE OBRIGATORIAMENTE escolher os valores apenas desta lista exata: [${VALID_BODY_PARTS.join(', ')}]. Para exames ginecológicos ou do trato reprodutor, utilize 'pelvis' (ou o ID correspondente).`;


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
        const contentType = response.headers.get('content-type') || 'application/pdf';
        const isImage = contentType.startsWith('image/');
        
        contentParts.push({ type: 'text', text: prefixText });
        
        if (isImage) {
          contentParts.push({ 
            type: 'image', 
            image: arrayBuffer 
          });
        } else {
          contentParts.push({ 
            type: 'file', 
            data: arrayBuffer, 
            mediaType: contentType 
          });
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
      temperature: 0.1,
      schema: z.object({
        summary: z.string().describe('Relatório clínico baseado EXCLUSIVAMENTE em documentos anexados, estruturado com títulos em markdown (##). Seções obrigatórias: "## ⚠️ Alertas Críticos" (SOMENTE valores explicitamente fora da faixa de referência conforme documentado nos laudos — omitir seção inteira se nenhum valor alterado estiver documentado), "## 📋 Perfil do Paciente" (transcrever idade_calculada, sexo, condições e medicamentos EXATAMENTE como fornecidos no contexto), "## 🔬 Análise dos Exames" (para cada exame: nome, data, médico, e transcrição fiel dos achados do laudo anexado — se não houver laudo anexado nem observações, escrever "Laudo não disponível para análise"), "## 📈 Evolução Clínica" (transcrever cronologicamente os relatórios/observações fornecidos, SEM interpretar tendências ou inferir melhoras/pioras), "## 🗺️ Mapeamento Topográfico" (listar APENAS regiões com achados explícitos nos laudos, SEM deduzir regiões a partir do nome do exame), "## 📝 Observações Finais" (resumo factual do que foi documentado, SEM pareceres, SEM diagnósticos inferidos, SEM recomendações de acompanhamento que não estejam em algum documento). Use listas com marcadores (- ) para organizar os itens.'),
        regioes_afetadas: z.array(z.enum(VALID_BODY_PARTS as [string, ...string[]])).describe('Lista de regiões do corpo onde achados clínicos foram EXPLICITAMENTE documentados nos laudos. NÃO deduza regiões a partir do nome do exame. NÃO inclua regiões por inferência. Inclua SOMENTE se o laudo descrever um achado concreto naquela região. Retorne array vazio se nenhum achado regional estiver documentado.')
      }),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: contentParts
        }
      ]
    });

    return NextResponse.json(object);
  } catch (error: any) {
    console.error("ERRO COMPLETO NA API DE IA:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
