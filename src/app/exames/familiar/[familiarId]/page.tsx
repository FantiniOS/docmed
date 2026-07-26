// Atualizado com a seção de relatórios
import Link from "next/link";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ExamTable } from "@/components/exames/exam-table";
import { RelatorioTable } from "@/components/relatorios/relatorio-table";
import { notFound } from "next/navigation";

interface ExamesFamiliarPageProps {
  params: Promise<{
    familiarId: string;
  }>;
}

export default async function ExamesFamiliarPage({ params }: ExamesFamiliarPageProps) {
  const { familiarId } = await params;
  const supabase = await createServerSupabaseClient();

  // Buscar os detalhes do familiar
  const { data: familiar, error: familiarError } = await supabase
    .from("familiares")
    .select("nome")
    .eq("id", familiarId)
    .single();

  if (familiarError || !familiar) {
    // Se o familiar não existir ou for ID inválido, retorna erro 404
    notFound();
  }

  // Buscar os exames e relatórios do familiar em paralelo
  const [examesResponse, relatoriosResponse] = await Promise.all([
    supabase
      .from("exames")
      .select("*, medicos(nome)")
      .eq("familiar_id", familiarId)
      .order("data_exame", { ascending: false }),
    supabase
      .from("relatorios")
      .select("*, medicos(nome)")
      .eq("familiar_id", familiarId)
      .order("data_relatorio", { ascending: false })
  ]);

  const { data: exames, error: examesError } = examesResponse;
  const { data: relatorios, error: relatoriosError } = relatoriosResponse;

  if (examesError) console.error("Erro ao buscar exames do familiar:", examesError);
  if (relatoriosError) console.error("Erro ao buscar relatórios do familiar:", relatoriosError);

  return (
    <div className="animate-fade-in-up space-y-4">
      <Link
        href="/exames"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para a listagem
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-emerald-500" />
          <h1 className="text-2xl font-bold tracking-tight">Documentos de {familiar.nome}</h1>
        </div>
        <Link
          href={`/exames/novo`} // Idealmente poderia preencher o ID do familiar, mas na rota genérica basta
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Exame
        </Link>
      </div>

      <div className="mt-4 border-b pb-1.5">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Exames e Resultados</h2>
      </div>

      <div className="pt-2">
        <ExamTable exames={exames || []} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-emerald-500 hidden sm:block" />
          <h2 className="text-xl font-bold tracking-tight text-foreground">Relatórios e Laudos</h2>
        </div>
        <Link
          href={`/relatorios/novo?familiarId=${familiarId}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Relatório
        </Link>
      </div>

      <div className="pt-2">
        <RelatorioTable relatorios={relatorios || []} />
      </div>
    </div>
  );
}
