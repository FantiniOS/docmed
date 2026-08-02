import { ConsultaForm } from "@/components/consultas/consulta-form";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function NovaConsultaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: dataParam } = await searchParams;

  const [pacientesRes, medicosRes] = await Promise.all([
    supabase.from("pacientes").select("*").order("nome", { ascending: true }),
    supabase.from("medicos").select("*").order("nome", { ascending: true }),
  ]);

  const pacientes = pacientesRes.data || [];
  const medicos = medicosRes.data || [];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <ConsultaForm
        pacientes={pacientes}
        medicos={medicos}
        defaultDate={dataParam}
      />
    </div>
  );
}
