import Link from "next/link";
import { Stethoscope, Plus, Search, Mail, Phone, MapPin } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Medico } from "@/types/database";

export default async function MedicosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { q } = await searchParams;

  let query = supabase.from("medicos").select("*").order("nome", { ascending: true });

  if (q) {
    query = query.ilike("nome", `%${q}%`);
  }

  const { data: medicos, error } = await query;
  const list = medicos as Medico[] || [];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-blue-500" />
            Médicos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lista de profissionais de saúde cadastrados.
          </p>
        </div>
        <Link
          href="/medicos/novo"
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Adicionar Médico
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <form>
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome do médico..."
            className="pl-9 h-11"
          />
        </form>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
              <Stethoscope className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Nenhum médico encontrado
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {q
                  ? "Não foram encontrados resultados para a sua busca."
                  : "Cadastre os médicos para vinculá-los a exames e consultas."}
              </p>
            </div>
            {!q && (
              <Link
                href="/medicos/novo"
                className="mt-2 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Cadastrar
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((medico) => (
            <Card key={medico.id} className="group transition-all duration-200 hover:shadow-md hover:border-blue-500/30">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 shrink-0">
                    <Stethoscope className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate text-foreground group-hover:text-blue-500 transition-colors">
                      Dr(a). {medico.nome}
                    </h3>
                    <p className="text-xs text-blue-500 font-medium mt-0.5">
                      {medico.especialidade}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  {medico.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{medico.telefone}</span>
                    </div>
                  )}
                  {medico.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{medico.email}</span>
                    </div>
                  )}
                  {medico.endereco && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{medico.endereco}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
