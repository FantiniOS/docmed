import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { PacienteForm } from "@/components/pacientes/paciente-form";

export default async function EditarPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: paciente, error } = await supabase
    .from("familiares")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !paciente) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <PacienteForm initialData={paciente} />
    </div>
  );
}
