// =============================================================================
// Tipagens do Banco de Dados — Supabase (PostgreSQL)
// =============================================================================

/**
 * Familiar cadastrado no sistema.
 * Representa um membro da família com seus dados médicos essenciais.
 */
export interface Familiar {
  id: string;
  nome: string;
  data_nascimento: string; // ISO date string (YYYY-MM-DD)
  tipo_sanguineo: string | null;
  alergias: string | null;
  doencas_cronicas: string | null;
  medicamentos_uso_continuo: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Médico cadastrado no sistema.
 */
export interface Medico {
  id: string;
  nome: string;
  especialidade: string;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Registro de consulta médica.
 * Relaciona um familiar a um médico em uma data específica.
 */
export interface Consulta {
  id: string;
  familiar_id: string;
  medico_id: string;
  data_consulta: string; // ISO datetime string
  motivo: string | null;
  diagnostico: string | null;
  prescricao: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Registro de exame médico.
 * Pode incluir arquivo anexado via Supabase Storage.
 */
export interface Exame {
  id: string;
  familiar_id: string;
  medico_id: string | null;
  nome_exame: string;
  tipo_exame: string | null;
  data_exame: string; // ISO date string
  arquivo_url: string | null; // URL do Supabase Storage
  observacoes: string | null;
  created_at?: string;
  updated_at?: string;
}

// =============================================================================
// Tipos com relacionamentos (JOINs)
// =============================================================================

/** Consulta com dados expandidos do familiar e do médico */
export interface ConsultaComRelacionamentos extends Consulta {
  familiares?: Familiar;
  medicos?: Medico;
}

/** Exame com dados expandidos do familiar e do médico */
export interface ExameComRelacionamentos extends Exame {
  familiares?: Familiar;
  medicos?: Medico;
}

// =============================================================================
// Tipos para formulários (omitindo campos automáticos)
// =============================================================================

export type FamiliarFormData = Omit<Familiar, "id" | "created_at" | "updated_at">;
export type MedicoFormData = Omit<Medico, "id" | "created_at" | "updated_at">;
export type ConsultaFormData = Omit<Consulta, "id" | "created_at" | "updated_at">;
export type ExameFormData = Omit<Exame, "id" | "created_at" | "updated_at">;

// =============================================================================
// Tipos para métricas do Dashboard
// =============================================================================

export interface DashboardMetrics {
  totalFamiliares: number;
  totalConsultas: number;
  totalExames: number;
  proximasConsultas: ConsultaComRelacionamentos[];
  ultimosExames: ExameComRelacionamentos[];
}
