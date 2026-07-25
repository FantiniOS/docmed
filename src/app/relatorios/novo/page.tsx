import { createServerSupabaseClient } from "@/lib/supabase-server";
import { RelatorioForm } from "@/components/relatorios/relatorio-form";
import type { Familiar, Medico } from "@/types/database";

export default async function NovoRelatorioPage({
  searchParams,
}: {
  searchParams: Promise<{ familiarId?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { familiarId } = await searchParams;

  const [familiaresRes, medicosRes] = await Promise.all([
    supabase.from("familiares").select("*").order("nome"),
    supabase.from("medicos").select("*").order("nome"),
  ]);

  const familiares = (familiaresRes.data as Familiar[]) || [];
  const medicos = (medicosRes.data as Medico[]) || [];

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <RelatorioForm 
        familiares={familiares} 
        medicos={medicos} 
        initialData={familiarId ? {
          familiar_id: familiarId,
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
