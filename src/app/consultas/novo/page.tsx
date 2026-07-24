import { ConsultaForm } from "@/components/consultas/consulta-form";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function NovaConsultaPage() {
  const supabase = await createServerSupabaseClient();

  const [familiaresRes, medicosRes] = await Promise.all([
    supabase.from("familiares").select("*").order("nome", { ascending: true }),
    supabase.from("medicos").select("*").order("nome", { ascending: true }),
  ]);

  const familiares = familiaresRes.data || [];
  const medicos = medicosRes.data || [];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <ConsultaForm familiares={familiares} medicos={medicos} />
    </div>
  );
}
