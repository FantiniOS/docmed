import Link from "next/link";
import { FileText, Plus, User } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export default async function ExamesPage() {
  const supabase = await createServerSupabaseClient();

  // Buscar todos os pacientes, e contar quantos exames cada um possui
  // Utilizamos exames(id) para que o Supabase retorne um array de ids de exames para cada paciente
  const { data: pacientes, error } = await supabase
    .from("pacientes")
    .select("id, nome, exames(id)")
    .order("nome", { ascending: true });

  if (error) {
    console.error("Erro ao buscar pacientes com exames:", error);
  }

  // Filtramos os pacientes que possuem pelo menos 1 exame
  const pacientesComExames = pacientes?.filter((fam) => fam.exames && fam.exames.length > 0) || [];

  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-emerald-500" />
          <h1 className="text-2xl font-bold tracking-tight">Meus Exames</h1>
        </div>
        <Link
          href="/exames/novo"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Exame
        </Link>
      </div>

      {pacientesComExames.length === 0 ? (
        <div className="rounded-md border bg-card p-8 flex flex-col items-center justify-center text-center gap-2">
          <FileText className="w-10 h-10 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium">
            Nenhum exame cadastrado. Adicione o primeiro exame da sua família.
          </p>
          <Link
            href="/exames/novo"
            className="mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Exame
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {pacientesComExames.map((paciente) => (
            <Link key={paciente.id} href={`/exames/paciente/${paciente.id}`}>
              <div className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                    <User className="w-4.5 h-4.5 text-emerald-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-lg text-foreground truncate" title={paciente.nome}>
                      {paciente.nome}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {paciente.exames.length} {paciente.exames.length === 1 ? 'exame cadastrado' : 'exames cadastrados'}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
