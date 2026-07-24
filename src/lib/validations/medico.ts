import { z } from "zod";

export const medicoSchema = z.object({
  nome: z
    .string()
    .min(2, "O nome deve ter pelo menos 2 caracteres")
    .max(100, "Máximo de 100 caracteres"),
  especialidade: z
    .string()
    .min(2, "A especialidade é obrigatória")
    .max(100, "Máximo de 100 caracteres"),
  telefone: z.string().nullable().transform((val) => val || null),
  email: z.string().email("E-mail inválido").nullable().transform((val) => val || null).or(z.literal("").transform(() => null)),
  endereco: z.string().nullable().transform((val) => val || null),
});

export type MedicoSchemaType = z.infer<typeof medicoSchema>;

export const especialidades = [
  "Clínico Geral",
  "Cardiologista",
  "Dermatologista",
  "Endocrinologista",
  "Gastroenterologista",
  "Geriatra",
  "Ginecologista",
  "Neurologista",
  "Oftalmologista",
  "Ortopedista",
  "Otorrinolaringologista",
  "Pediatra",
  "Psiquiatra",
  "Reumatologista",
  "Urologista",
  "Outra",
] as const;
