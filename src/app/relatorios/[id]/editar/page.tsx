import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { RelatorioForm } from "@/components/relatorios/relatorio-form";
import type { Paciente, Medico, Relatorio } from "@/types/database";

export default async function EditarRelatorioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const [pacientesRes, medicosRes, relatorioRes] = await Promise.all([
    supabase.from("pacientes").select("*").order("nome"),
    supabase.from("medicos").select("*").order("nome"),
    supabase.from("relatorios").select("*").eq("id", id).single(),
  ]);

  const pacientes = (pacientesRes.data as Paciente[]) || [];
  const medicos = (medicosRes.data as Medico[]) || [];
  const relatorio = relatorioRes.data as Relatorio | null;

  if (!relatorio) {
    notFound();
  }

  // Prepara os dados para o formulário
  const initialData = {
    id: relatorio.id,
    paciente_id: relatorio.paciente_id,
    medico_id: relatorio.medico_id,
    titulo: relatorio.titulo,
    data_relatorio: relatorio.data_relatorio,
    arquivo_url: relatorio.arquivo_url,
    observacoes: relatorio.observacoes,
    local_atendimento: relatorio.local_atendimento,
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <RelatorioForm
        pacientes={pacientes}
        medicos={medicos}
        initialData={initialData}
      />
    </div>
  );
}
