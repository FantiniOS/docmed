import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { ConsultaForm } from "@/components/consultas/consulta-form";

export default async function EditarConsultaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Converter formato da data retornado pelo PostgreSQL para o formato esperado pelo input type="datetime-local" (YYYY-MM-DDThh:mm)
  const formatDateTimeForInput = (isoDate: string) => {
    return new Date(isoDate).toISOString().slice(0, 16);
  };

  const [consultaRes, familiaresRes, medicosRes] = await Promise.all([
    supabase.from("consultas").select("*").eq("id", id).single(),
    supabase.from("familiares").select("*").order("nome", { ascending: true }),
    supabase.from("medicos").select("*").order("nome", { ascending: true }),
  ]);

  if (consultaRes.error || !consultaRes.data) {
    notFound();
  }

  const initialData = {
    ...consultaRes.data,
    data_consulta: formatDateTimeForInput(consultaRes.data.data_consulta),
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <ConsultaForm
        familiares={familiaresRes.data || []}
        medicos={medicosRes.data || []}
        initialData={initialData}
      />
    </div>
  );
}
