import { z } from "zod";

export const exameSchema = z.object({
  paciente_id: z.string().min(1, "Selecione o paciente"),
  medico_id: z.string().nullable().transform((val) => val === "none" ? null : val || null),
  nome_exame: z
    .string()
    .min(2, "O nome do exame deve ter pelo menos 2 caracteres")
    .max(150, "Máximo de 150 caracteres"),
  tipo_exame: z.string().nullable().transform((val) => val || null),
  data_exame: z
    .string()
    .min(1, "A data do exame é obrigatória")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Data inválida",
    }),
  arquivo_url: z.string().url("A URL do arquivo é inválida").nullable().transform((val) => val || null).or(z.literal("").transform(() => null)),
  observacoes: z.string().nullable().transform((val) => val || null),
  local_atendimento: z.string().nullable().transform((val) => val || null),
});

export type ExameSchemaType = z.infer<typeof exameSchema>;

export const tiposExames = [
  "Exame de Sangue",
  "Exame de Imagem (Raio-X, Tomografia, etc)",
  "Urina / Fezes",
  "Avaliação Cardiológica",
  "Exame Genético",
  "Outro",
] as const;
