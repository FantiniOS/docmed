import { createServerSupabaseClient } from "@/lib/supabase-server";
import { RelatorioForm } from "@/components/relatorios/relatorio-form";
import type { Paciente, Medico } from "@/types/database";

export default async function NovoRelatorioPage({
  searchParams,
}: {
  searchParams: Promise<{ pacienteId?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { pacienteId } = await searchParams;

  const [pacientesRes, medicosRes] = await Promise.all([
    supabase.from("pacientes").select("*").order("nome"),
    supabase.from("medicos").select("*").order("nome"),
  ]);

  const pacientes = (pacientesRes.data as Paciente[]) || [];
  const medicos = (medicosRes.data as Medico[]) || [];

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <RelatorioForm 
        pacientes={pacientes} 
        medicos={medicos} 
        initialData={pacienteId ? {
          paciente_id: pacienteId,
          titulo: "",
          data_relatorio: "",
          medico_id: null,
          arquivo_url: null,
          observacoes: null,
          local_atendimento: null,
        } : undefined}
      />
    </div>
  );
}
