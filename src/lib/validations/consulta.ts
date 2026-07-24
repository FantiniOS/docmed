import { z } from "zod";

export const consultaSchema = z.object({
  familiar_id: z.string().min(1, "Selecione o familiar"),
  medico_id: z.string().min(1, "Selecione o médico"),
  data_consulta: z
    .string()
    .min(1, "A data e hora são obrigatórias")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Data inválida",
    }),
  motivo: z.string().nullable().transform((val) => val || null),
  diagnostico: z.string().nullable().transform((val) => val || null),
  prescricao: z.string().nullable().transform((val) => val || null),
});

export type ConsultaSchemaType = z.infer<typeof consultaSchema>;
