import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { FamiliarForm } from "@/components/familiares/familiar-form";

export default async function EditarFamiliarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: familiar, error } = await supabase
    .from("familiares")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !familiar) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <FamiliarForm initialData={familiar} />
    </div>
  );
}
