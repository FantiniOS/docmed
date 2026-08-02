import { createServerSupabaseClient } from "@/lib/supabase-server";
import { SmartAlerts } from "@/components/dashboard/smart-alerts";
import { DashboardCalendar } from "@/components/dashboard/dashboard-calendar";
import { QuickAccess } from "@/components/dashboard/quick-access";
import type {
  Familiar,
  ConsultaComRelacionamentos,
  ExameComRelacionamentos,
} from "@/types/database";

/**
 * Busca os dados necessários para o Dashboard refatorado:
 * - Familiares (para Acesso Rápido)
 * - Todas as consultas futuras (para calendário + smart cards)
 * - Todos os exames futuros (para calendário + smart cards)
 *
 * Executado no servidor (Server Component).
 */
async function getDashboardData() {
  const supabase = await createServerSupabaseClient();

  // Data de hoje no início do dia para filtrar eventos passados
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Buscar primeiro dia do mês atual (para o calendário exibir o mês inteiro)
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const [familiaresResult, consultasResult, examesResult] = await Promise.all([
    // Todos os familiares (para acesso rápido)
    supabase
      .from("familiares")
      .select("*")
      .order("nome", { ascending: true }),

    // Consultas a partir do início do mês atual (para mostrar no calendário)
    supabase
      .from("consultas")
      .select("*, familiares(*), medicos(*)")
      .gte("data_consulta", primeiroDiaMes.toISOString())
      .order("data_consulta", { ascending: true }),

    // Exames a partir do início do mês atual (para mostrar no calendário)
    supabase
      .from("exames")
      .select("*, familiares(*), medicos(*)")
      .gte("data_exame", primeiroDiaMes.toISOString())
      .order("data_exame", { ascending: true }),
  ]);

  return {
    familiares: (familiaresResult.data as Familiar[]) ?? [],
    consultas:
      (consultasResult.data as ConsultaComRelacionamentos[]) ?? [],
    exames:
      (examesResult.data as ExameComRelacionamentos[]) ?? [],
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
      consultas: [],
      exames: [],
    };
  }

  return (
    <div className="space-y-4 animate-fade-in-up min-w-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Início
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sua agenda médica familiar em um só lugar
        </p>
      </div>

      {/* Smart Alerts — renderiza condicionalmente (retorna null se vazio) */}
      <SmartAlerts consultas={data.consultas} exames={data.exames} />

      {/* Content Grid — Calendário + Acesso Rápido */}
      <div className="grid lg:grid-cols-5 gap-3 sm:gap-4 min-w-0">
        {/* Calendário — ocupa 3 colunas no desktop */}
        <div className="lg:col-span-3 min-w-0">
          <DashboardCalendar
            consultas={data.consultas}
            exames={data.exames}
          />
        </div>

        {/* Acesso Rápido — ocupa 2 colunas no desktop */}
        <div className="lg:col-span-2 min-w-0">
          <QuickAccess familiares={data.familiares} />
        </div>
      </div>
    </div>
  );
}
