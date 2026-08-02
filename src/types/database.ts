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
  foto_url?: string | null;
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
  foto_url?: string | null;
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
  local_atendimento: string | null;
  especialidade: string | null;
  tipo_consulta: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Registro de exame médico.
 */
export interface Exame {
  id: string;
  familiar_id: string;
  medico_id: string | null; // Pode não estar associado a um médico do sistema
  nome_exame: string;
  tipo_exame: string | null;
  data_exame: string; // ISO date string
  arquivo_url: string | null; // PDF ou Imagem
  observacoes: string | null;
  local_atendimento: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Registro de relatório/laudo médico.
 */
export interface Relatorio {
  id: string;
  familiar_id: string;
  medico_id: string | null;
  titulo: string;
  data_relatorio: string; // ISO date string
  arquivo_url: string | null; // PDF ou Imagem
  observacoes: string | null;
  local_atendimento: string | null;
  created_at?: string;
  updated_at?: string;
}

// =============================================================================
// Tipos Combinados (Com joins)
// =============================================================================

/** Consulta com dados expandidos do paciente e do médico */
export interface ConsultaComRelacionamentos extends Consulta {
  familiares?: Familiar;
  medicos?: Medico;
}

/** Exame com dados expandidos do paciente e do médico */
export interface ExameComRelacionamentos extends Exame {
  familiares?: Familiar;
  medicos?: Medico;
}

/** Relatório com dados expandidos do paciente e do médico */
export interface RelatorioComRelacionamentos extends Relatorio {
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
export type RelatorioFormData = Omit<Relatorio, "id" | "created_at" | "updated_at">;

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
