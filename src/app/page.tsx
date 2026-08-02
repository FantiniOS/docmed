import { createServerSupabaseClient } from "@/lib/supabase-server";
import { SmartAlerts } from "@/components/dashboard/smart-alerts";
import { DashboardCalendar } from "@/components/dashboard/dashboard-calendar";
import { QuickAccess } from "@/components/dashboard/quick-access";
import type {
  Paciente,
  ConsultaComRelacionamentos,
  ExameComRelacionamentos,
} from "@/types/database";

/**
 * Busca os dados necessários para o Dashboard refatorado:
 * - Pacientes (para Acesso Rápido)
 * - Todas as consultas futuras (para calendário + smart cards)
 * - Todos os exames futuros (para calendário + smart cards)
 *
 * Executado no servidor (Server Component).
 */
async function getDashboardData() {
  const supabase = await createServerSupabaseClient();

  const [pacientesResult, consultasResult, examesResult] = await Promise.all([
    // Todos os pacientes (para acesso rápido)
    supabase
      .from("familiares")
      .select("*")
      .order("nome", { ascending: true }),

    // Consultas completas (histórico incluído para o calendário)
    supabase
      .from("consultas")
      .select("*, pacientes(*), medicos(*)")
      .order("data_consulta", { ascending: true }),

    // Exames completos (histórico incluído para o calendário)
    supabase
      .from("exames")
      .select("*, pacientes(*), medicos(*)")
      .order("data_exame", { ascending: true }),
  ]);

  return {
    pacientes: (pacientesResult.data as Paciente[]) ?? [],
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
      pacientes: [],
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
          Sua agenda médica paciente em um só lugar
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
          <QuickAccess pacientes={data.pacientes} />
        </div>
      </div>
    </div>
  );
}
