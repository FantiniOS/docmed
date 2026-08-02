import { ExameForm } from "@/components/exames/exame-form";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function NovoExamePage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: dataParam } = await searchParams;

  const [familiaresRes, medicosRes] = await Promise.all([
    supabase.from("familiares").select("*").order("nome", { ascending: true }),
    supabase.from("medicos").select("*").order("nome", { ascending: true }),
  ]);

  const familiares = familiaresRes.data || [];
  const medicos = medicosRes.data || [];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <ExameForm
        familiares={familiares}
        medicos={medicos}
        defaultDate={dataParam}
      />
    </div>
  );
}
