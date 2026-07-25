import * as z from "zod";

export const relatorioSchema = z.object({
  familiar_id: z.string().min(1, "Selecione o familiar"),
  medico_id: z.string().nullable().transform((val) => val === "none" ? null : val || null),
  titulo: z
    .string()
    .min(3, "O título deve ter pelo menos 3 caracteres")
    .max(100, "O título deve ter no máximo 100 caracteres"),
  data_relatorio: z.string().min(1, "A data do relatório é obrigatória"),
  arquivo_url: z.string().nullable().transform((val) => val || null),
  observacoes: z.string().nullable().transform((val) => val || null),
  local_atendimento: z.string().max(255).nullable().transform((val) => val || null),
});

export type RelatorioSchemaType = z.infer<typeof relatorioSchema>;
