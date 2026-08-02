import Link from "next/link";
import { Users, Plus, Search, ChevronRight, Droplets, AlertTriangle } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Familiar } from "@/types/database";

/**
 * Cores de avatar por índice para variar visualmente.
 */
const avatarColors = [
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-indigo-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-sky-600",
];

function getIniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function calcularIdade(dataNascimento: string): number {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mesAtual = hoje.getMonth();
  const mesNascimento = nascimento.getMonth();
  if (
    mesAtual < mesNascimento ||
    (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())
  ) {
    idade--;
  }
  return idade;
}

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { q } = await searchParams;

  // REVERT (Temporário): Consulta na tabela antiga até que o banco de dados seja atualizado
  let query = supabase.from("familiares").select("*").order("nome", { ascending: true });

  if (q) {
    query = query.ilike("nome", `%${q}%`);
  }

  const { data: rawData, error } = await query;
  
  if (error) {
    console.error("Supabase Error on /pacientes:", error);
  }

  const familiares = (rawData || []) as Familiar[];

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            Pacientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os membros da sua família cadastrados.
          </p>
        </div>
        <Link
          href="/pacientes/novo"
          className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Adicionar Paciente
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <form>
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome..."
            className="pl-9 h-9"
          />
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          Erro ao buscar dados: {error.message}
        </div>
      )}

      {familiares.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Nenhum paciente encontrado
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {q ? "Não foram encontrados resultados para a sua busca." : "Comece adicionando os membros da sua família para acompanhamento médico."}
              </p>
            </div>
            {!q && (
              <Link
                href="/pacientes/novo"
                className="mt-2 inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Cadastrar
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {familiares.map((familiar, index) => {
              const bgClass = avatarColors[index % avatarColors.length];
              const idade = calcularIdade(familiar.data_nascimento);

              return (
                <Link key={familiar.id} href={`/pacientes/${familiar.id}`}>
                  <Card className="hover:border-emerald-500/30 transition-all cursor-pointer group shadow-sm hover:shadow-md h-full bg-gradient-to-br from-card to-card/50">
                    <CardContent className="p-5 flex flex-col items-center text-center gap-4">
                      <Avatar className={`w-20 h-20 shadow-md bg-gradient-to-br ${bgClass}`}>
                        <AvatarImage src={familiar.foto_url || undefined} alt={familiar.nome} className="object-cover" />
                        <AvatarFallback className="bg-transparent text-white text-2xl font-bold">
                          {getIniciais(familiar.nome)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1 w-full">
                        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-emerald-600 transition-colors" title={familiar.nome}>
                          {familiar.nome}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
                          {idade} anos
                          {familiar.tipo_sanguineo && (
                            <>
                              <span className="opacity-50">•</span>
                              <span className="flex items-center text-red-500 font-medium text-xs">
                                <Droplets className="w-3 h-3 mr-0.5" />
                                {familiar.tipo_sanguineo}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      {familiar.alergias && (
                        <div className="w-full pt-3 mt-auto border-t">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-amber-600 bg-amber-50/50 py-1.5 rounded-md border border-amber-100">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[120px]">Possui Alergias</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
        </div>
      )}
    </div>
  );
}
