import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  User,
  Droplets,
  AlertTriangle,
  Heart,
  Pill,
  Calendar,
  FileText,
  Stethoscope,
  Clock,
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResumoClinicoBotao } from "@/components/familiares/resumo-clinico-botao";
import { FamiliarTabs } from "@/components/familiares/familiar-tabs";
import type { Familiar, ConsultaComRelacionamentos, ExameComRelacionamentos, RelatorioComRelacionamentos } from "@/types/database";

interface FamiliarPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Calcula a idade a partir da data de nascimento.
 */
function calcularIdade(dataNascimento: string): number {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

/**
 * Formata data ISO para exibição.
 */
function formatarData(dataString: string): string {
  return new Date(dataString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Busca os dados do familiar e seus exames.
 */
async function getFamiliarData(id: string) {
  const supabase = await createServerSupabaseClient();

  const [familiarResult, consultasResult, examesResult, relatoriosResult] = await Promise.all([
    supabase.from("familiares").select("*").eq("id", id).single(),
    supabase
      .from("consultas")
      .select("*, medicos(*)")
      .eq("familiar_id", id)
      .order("data_consulta", { ascending: false })
      .limit(10),
    supabase
      .from("exames")
      .select("*, medicos(*)")
      .eq("familiar_id", id)
      .order("data_exame", { ascending: false })
      .limit(10),
    supabase
      .from("relatorios")
      .select("*, medicos(*)")
      .eq("familiar_id", id)
      .order("data_relatorio", { ascending: false })
      .limit(10),
  ]);

  return {
    familiar: familiarResult.data as Familiar | null,
    consultas: (consultasResult.data as ConsultaComRelacionamentos[]) ?? [],
    exames: (examesResult.data as ExameComRelacionamentos[]) ?? [],
    relatorios: (relatoriosResult.data as RelatorioComRelacionamentos[]) ?? [],
  };
}

export default async function FamiliarPerfilPage({ params }: FamiliarPageProps) {
  const { id } = await params;

  let data;
  try {
    data = await getFamiliarData(id);
  } catch {
    notFound();
  }

  if (!data.familiar) {
    notFound();
  }

  const { familiar, consultas, exames, relatorios } = data;
  const idade = calcularIdade(familiar.data_nascimento);
  const splitTags = (str: string | null | undefined) =>
    str
      ?.split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const alergias = splitTags(familiar.alergias);
  const doencas = splitTags(familiar.doencas_cronicas);
  const medicamentos = splitTags(familiar.medicamentos_uso_continuo);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      {/* Back link and Edit link */}
      <div className="flex items-center justify-between">
        <Link
          href="/familiares"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Familiares
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/familiares/${familiar.id}/editar`}
            className="inline-flex items-center justify-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 transition-colors bg-blue-500/10 px-3 h-9 rounded-md font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar Perfil
          </Link>
        </div>
      </div>

      {/* Cabeçalho do Perfil */}
      <div className="flex items-start gap-4">
        <Avatar className="w-16 h-16 rounded-2xl shadow-lg shadow-emerald-500/20 shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600">
          <AvatarImage src={familiar.foto_url || undefined} alt={familiar.nome} className="object-cover" />
          <AvatarFallback className="bg-transparent text-white text-xl font-bold rounded-2xl">
            {familiar.nome
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">
            {familiar.nome}
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-sm text-muted-foreground" suppressHydrationWarning>
              {idade} anos • {formatarData(familiar.data_nascimento)}
            </span>
            {familiar.tipo_sanguineo && (
              <Badge variant="outline" className="gap-1">
                <Droplets className="w-3 h-3 text-red-400" />
                {familiar.tipo_sanguineo}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Informações Médicas Críticas */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* Alergias — destaque visual para emergências */}
        <Card
          className={
            alergias && alergias.length > 0
              ? "ring-amber-500/30 bg-amber-500/5"
              : ""
          }
        >
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle
                className={`w-4 h-4 ${
                  alergias && alergias.length > 0
                    ? "text-amber-500"
                    : "text-muted-foreground"
                }`}
              />
              Alergias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alergias && alergias.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {alergias.map((alergia) => (
                  <Badge
                    key={alergia}
                    variant="outline"
                    className="text-amber-500 border-amber-500/30 bg-amber-500/10"
                  >
                    {alergia}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nenhuma alergia registrada
              </p>
            )}
          </CardContent>
        </Card>

        {/* Doenças Crônicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              Doenças Crônicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {doencas && doencas.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {doencas.map((doenca) => (
                  <Badge
                    key={doenca}
                    variant="outline"
                    className="text-rose-400 border-rose-500/30 bg-rose-500/10"
                  >
                    {doenca}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nenhuma doença crônica registrada
              </p>
            )}
          </CardContent>
        </Card>

        {/* Medicamentos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Pill className="w-4 h-4 text-blue-500" />
              Medicamentos Contínuos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medicamentos && medicamentos.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {medicamentos.map((med) => (
                  <Badge
                    key={med}
                    variant="outline"
                    className="text-blue-400 border-blue-500/30 bg-blue-500/10"
                  >
                    {med}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Nenhum medicamento registrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />
      
      {/* Triagem IA e Mapeamento Corporal */}
      <ResumoClinicoBotao paciente={familiar} exames={exames} evolucao={relatorios} />

      {/* Navegação por Abas e Conteúdo Dinâmico */}
      <FamiliarTabs consultas={consultas} exames={exames} relatorios={relatorios} />
    </div>
  );
}
