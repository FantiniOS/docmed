import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ExameForm } from "@/components/exames/exame-form";

export default async function EditarExamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Buscar o exame, além das listas de pacientes e médicos para os selects
  const [exameRes, pacientesRes, medicosRes] = await Promise.all([
    supabase.from("exames").select("*").eq("id", id).single(),
    supabase.from("familiares").select("*").order("nome", { ascending: true }),
    supabase.from("medicos").select("*").order("nome", { ascending: true }),
  ]);

  if (exameRes.error || !exameRes.data) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <ExameForm
        pacientes={pacientesRes.data || []}
        medicos={medicosRes.data || []}
        initialData={exameRes.data}
      />
    </div>
  );
}
