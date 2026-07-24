"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Calendar,
  Droplets,
  AlertTriangle,
  Heart,
  Pill,
  Save,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import {
  familiarSchema,
  type FamiliarSchemaType,
  tiposSanguineos,
} from "@/lib/validations/familiar";

export function FamiliarForm({ initialData }: { initialData?: FamiliarSchemaType & { id?: string } }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FamiliarSchemaType>({
    resolver: zodResolver(familiarSchema),
    defaultValues: initialData || {
      nome: "",
      data_nascimento: "",
      tipo_sanguineo: null,
      alergias: null,
      doencas_cronicas: null,
      medicamentos_uso_continuo: null,
    },
  });

  async function onSubmit(data: FamiliarSchemaType) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (initialData?.id) {
        const { error } = await supabase.from("familiares").update(data).eq("id", initialData.id);
        if (error) throw error;
        toast.create({ title: "Sucesso!", description: "Familiar atualizado.", type: "success" });
      } else {
        const { error } = await supabase.from("familiares").insert([data]);
        if (error) throw error;
        toast.create({ title: "Sucesso!", description: "Familiar cadastrado.", type: "success" });
      }

      router.push("/familiares");
      router.refresh();
    } catch (err: any) {
      setSubmitError(err.message || "Erro inesperado ao salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Back link */}
      <Link
        href="/familiares"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Familiares
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-500" />
          {initialData ? "Editar Familiar" : "Cadastrar Familiar"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha os dados do membro da família.
        </p>
      </div>

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">
              Nome completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nome"
              placeholder="Ex: Maria da Silva"
              aria-invalid={!!errors.nome}
              {...register("nome")}
            />
            {errors.nome && (
              <p className="text-xs text-destructive">{errors.nome.message}</p>
            )}
          </div>

          {/* Data de Nascimento + Tipo Sanguíneo */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_nascimento">
                <Calendar className="w-3.5 h-3.5" />
                Data de Nascimento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="data_nascimento"
                type="date"
                aria-invalid={!!errors.data_nascimento}
                {...register("data_nascimento")}
              />
              {errors.data_nascimento && (
                <p className="text-xs text-destructive">
                  {errors.data_nascimento.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                <Droplets className="w-3.5 h-3.5" />
                Tipo Sanguíneo
              </Label>
              <Controller
                control={control}
                name="tipo_sanguineo"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(val) => field.onChange(val || null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposSanguineos.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações Médicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            Informações Médicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alergias */}
          <div className="space-y-2">
            <Label htmlFor="alergias">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Alergias
            </Label>
            <Textarea
              id="alergias"
              placeholder="Ex: Dipirona, Penicilina, Frutos do mar..."
              className="min-h-20"
              {...register("alergias")}
            />
            <p className="text-[11px] text-muted-foreground">
              Separe múltiplas alergias por vírgula.
            </p>
          </div>

          {/* Doenças Crônicas */}
          <div className="space-y-2">
            <Label htmlFor="doencas_cronicas">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Doenças Crônicas
            </Label>
            <Textarea
              id="doencas_cronicas"
              placeholder="Ex: Diabetes Tipo 2, Hipertensão..."
              className="min-h-20"
              {...register("doencas_cronicas")}
            />
          </div>

          {/* Medicamentos de Uso Contínuo */}
          <div className="space-y-2">
            <Label htmlFor="medicamentos_uso_continuo">
              <Pill className="w-3.5 h-3.5 text-blue-500" />
              Medicamentos de Uso Contínuo
            </Label>
            <Textarea
              id="medicamentos_uso_continuo"
              placeholder="Ex: Metformina 850mg (2x/dia), Losartana 50mg (1x/dia)..."
              className="min-h-20"
              {...register("medicamentos_uso_continuo")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error message */}
      {submitError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Link
          href="/familiares"
          className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-input bg-transparent text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSubmitting ? "Salvando..." : "Salvar Familiar"}
        </Button>
      </div>
    </form>
  );
}
