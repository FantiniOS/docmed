import { Users, CalendarCheck, FileText, Stethoscope } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { MetricCard } from "@/components/dashboard/metric-card";
import { QuickAccess } from "@/components/dashboard/quick-access";
import { UpcomingConsultations } from "@/components/dashboard/upcoming-consultations";
import { RecentExams } from "@/components/dashboard/recent-exams";
import type {
  Familiar,
  ConsultaComRelacionamentos,
  ExameComRelacionamentos,
} from "@/types/database";

/**
 * Busca todas as métricas e dados necessários para o Dashboard.
 * Executado no servidor (Server Component).
 */
async function getDashboardData() {
  const supabase = await createServerSupabaseClient();

  // Buscar contagens e dados em paralelo
  const [
    familiaresResult,
    consultasCountResult,
    examesCountResult,
    medicosCountResult,
    proximasConsultasResult,
    ultimosExamesResult,
  ] = await Promise.all([
    // Todos os familiares (para contagem + acesso rápido)
    supabase
      .from("familiares")
      .select("*")
      .order("nome", { ascending: true }),

    // Total de consultas
    supabase
      .from("consultas")
      .select("*", { count: "exact", head: true }),

    // Total de exames
    supabase
      .from("exames")
      .select("*", { count: "exact", head: true }),

    // Total de médicos
    supabase
      .from("medicos")
      .select("*", { count: "exact", head: true }),

    // Próximas consultas (futuras, limit 5)
    supabase
      .from("consultas")
      .select("*, familiares(*), medicos(*)")
      .gte("data_consulta", new Date().toISOString())
      .order("data_consulta", { ascending: true })
      .limit(5),

    // Últimos exames adicionados (limit 5)
    supabase
      .from("exames")
      .select("*, familiares(*), medicos(*)")
      .order("data_exame", { ascending: false })
      .limit(5),
  ]);

  return {
    familiares: (familiaresResult.data as Familiar[]) ?? [],
    totalConsultas: consultasCountResult.count ?? 0,
    totalExames: examesCountResult.count ?? 0,
    totalMedicos: medicosCountResult.count ?? 0,
    proximasConsultas:
      (proximasConsultasResult.data as ConsultaComRelacionamentos[]) ?? [],
    ultimosExames:
      (ultimosExamesResult.data as ExameComRelacionamentos[]) ?? [],
  };
}

export default async function DashboardPage() {
  let data;

  try {
    data = await getDashboardData();
  } catch {
    // Se o Supabase não estiver configurado, renderizar com dados vazios
    data = {
      familiares: [],
      totalConsultas: 0,
      totalExames: 0,
      totalMedicos: 0,
      proximasConsultas: [],
      ultimosExames: [],
    };
  }

  return (
    <div className="space-y-4 animate-fade-in-up min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visão geral do prontuário médico familiar
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <MetricCard
          title="Familiares"
          value={data.familiares.length}
          description="cadastrados"
          icon={Users}
          accentColor="emerald"
        />
        <MetricCard
          title="Médicos"
          value={data.totalMedicos}
          description="registrados"
          icon={Stethoscope}
          accentColor="blue"
        />
        <MetricCard
          title="Consultas"
          value={data.totalConsultas}
          description="registradas"
          icon={CalendarCheck}
          accentColor="amber"
        />
        <MetricCard
          title="Exames"
          value={data.totalExames}
          description="registrados"
          icon={FileText}
          accentColor="rose"
        />
      </div>

      {/* Content Grid — 2 colunas no desktop */}
      <div className="grid lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Acesso Rápido — ocupa 2 colunas */}
        <div className="lg:col-span-2">
          <QuickAccess familiares={data.familiares} />
        </div>

        {/* Próximas Consultas + Últimos Exames — ocupa 3 colunas */}
        <div className="lg:col-span-3 space-y-3 sm:space-y-4">
          <UpcomingConsultations consultas={data.proximasConsultas} />
          <RecentExams exames={data.ultimosExames} />
        </div>
      </div>
    </div>
  );
}
