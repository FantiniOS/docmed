import { z } from "zod";

/**
 * Schema de validação para o formulário de cadastro de familiar.
 * Usado com react-hook-form via @hookform/resolvers/zod.
 */
export const familiarSchema = z.object({
  nome: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  data_nascimento: z
    .string()
    .min(1, "Data de nascimento é obrigatória")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Data de nascimento inválida",
    }),
  tipo_sanguineo: z
    .string()
    .nullable()
    .transform((val) => val || null),
  alergias: z
    .string()
    .nullable()
    .transform((val) => val || null),
  doencas_cronicas: z
    .string()
    .nullable()
    .transform((val) => val || null),
  medicamentos_uso_continuo: z
    .string()
    .nullable()
    .transform((val) => val || null),
});

export type FamiliarSchemaType = z.infer<typeof familiarSchema>;

/**
 * Opções de tipo sanguíneo para o select.
 */
export const tiposSanguineos = [
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
] as const;
