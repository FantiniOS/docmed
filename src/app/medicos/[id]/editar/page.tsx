import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { MedicoForm } from "@/components/medicos/medico-form";

export default async function EditarMedicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: medico, error } = await supabase
    .from("medicos")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !medico) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <MedicoForm initialData={medico} />
    </div>
  );
}
