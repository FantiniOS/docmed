"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Stethoscope,
  Save,
  Loader2,
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
import {
  medicoSchema,
  type MedicoSchemaType,
  especialidades,
} from "@/lib/validations/medico";

export function MedicoForm({ initialData }: { initialData?: MedicoSchemaType & { id?: string } }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MedicoSchemaType>({
    resolver: zodResolver(medicoSchema),
    defaultValues: initialData || {
      nome: "",
      especialidade: "",
      telefone: null,
      email: null,
      endereco: null,
    },
  });

  async function onSubmit(data: MedicoSchemaType) {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (initialData?.id) {
        const { error } = await supabase.from("medicos").update(data).eq("id", initialData.id);
        if (error) throw error;
        toast.create({ title: "Sucesso!", description: "Médico atualizado.", type: "success" });
      } else {
        const { error } = await supabase.from("medicos").insert([data]);
        if (error) throw error;
        toast.create({ title: "Sucesso!", description: "Médico cadastrado.", type: "success" });
      }

      router.push("/medicos");
      router.refresh();
    } catch (err: any) {
      setSubmitError(err.message || "Erro inesperado ao salvar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Link
        href="/medicos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Médicos
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Stethoscope className="w-6 h-6 text-blue-500" />
          {initialData ? "Editar Médico" : "Cadastrar Médico"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha os dados do profissional de saúde.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            Dados Básicos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome do Médico <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                placeholder="Ex: Carlos Silva"
                aria-invalid={!!errors.nome}
                {...register("nome")}
              />
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Especialidade <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="especialidade"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-invalid={!!errors.especialidade}
                    >
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {especialidades.map((esp) => (
                        <SelectItem key={esp} value={esp}>
                          {esp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.especialidade && (
                <p className="text-xs text-destructive">
                  {errors.especialidade.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-500" />
            Informações de Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone" className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Telefone
              </Label>
              <Input
                id="telefone"
                placeholder="Ex: (11) 99999-9999"
                aria-invalid={!!errors.telefone}
                {...register("telefone")}
              />
              {errors.telefone && (
                <p className="text-xs text-destructive">
                  {errors.telefone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Ex: medico@clinica.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco" className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Endereço do Consultório
            </Label>
            <Input
              id="endereco"
              placeholder="Ex: Av. Paulista, 1000 - Sala 42"
              aria-invalid={!!errors.endereco}
              {...register("endereco")}
            />
            {errors.endereco && (
              <p className="text-xs text-destructive">
                {errors.endereco.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {submitError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{submitError}</p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Link
          href="/medicos"
          className="inline-flex items-center justify-center h-9 px-4 rounded-lg border border-input bg-transparent text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={isSubmitting} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSubmitting ? "Salvando..." : "Salvar Médico"}
        </Button>
      </div>
    </form>
  );
}
