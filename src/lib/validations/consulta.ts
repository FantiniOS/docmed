import { z } from "zod";

export const consultaSchema = z.object({
  paciente_id: z.string().min(1, "Selecione o paciente"),
  medico_id: z.string().nullable().transform((val) => val === "none" ? null : val || null),
  data_consulta: z
    .string()
    .min(1, "A data e hora são obrigatórias")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Data inválida",
    }),
  motivo: z.string().nullable().transform((val) => val || null),
  diagnostico: z.string().nullable().transform((val) => val || null),
  prescricao: z.string().nullable().transform((val) => val || null),
  local_atendimento: z.string().nullable().transform((val) => val || null),
  especialidade: z.string().nullable().transform((val) => val || null),
  tipo_consulta: z.string().nullable().transform((val) => val || null),
});

export type ConsultaSchemaType = z.infer<typeof consultaSchema>;

export const tiposConsulta = [
  "Primeira Consulta",
  "Retorno",
  "Check-up de Rotina",
  "Emergência / Pronto-Socorro",
  "Outro",
] as const;
