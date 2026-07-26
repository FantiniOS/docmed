import Link from "next/link";
import { User, Droplets, AlertTriangle, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Familiar } from "@/types/database";

interface QuickAccessProps {
  familiares: Familiar[];
}

/**
 * Formata a data de nascimento para exibir a idade.
 */
function calcularIdade(dataNascimento: string): number {
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mesAtual = hoje.getMonth();
  const mesNascimento = nascimento.getMonth();
  if (
    mesAtual < mesNascimento ||
    (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())
  ) {
    idade--;
  }
  return idade;
}

/**
 * Retorna as iniciais do nome (máximo 2 letras).
 */
function getIniciais(nome: string): string {
  return nome
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Cores de avatar por índice para variar visualmente.
 */
const avatarColors = [
  "from-emerald-500 to-teal-600",
  "from-blue-500 to-indigo-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
  "from-cyan-500 to-sky-600",
];

export function QuickAccess({ familiares }: QuickAccessProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-500" />
          Acesso Rápido — Familiares
        </CardTitle>
        <CardAction>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <Link href="/familiares/novo">Adicionar</Link>
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent>
        {familiares.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Nenhum familiar cadastrado
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Comece adicionando os membros da sua família.
              </p>
            </div>
            <Button size="sm" className="mt-2 gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <Link href="/familiares/novo">Cadastrar Familiar</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-2">
            {familiares.map((familiar, index) => (
              <Link
                key={familiar.id}
                href={`/familiares/${familiar.id}`}
                className="group flex items-center gap-2.5 p-2 rounded-lg transition-all duration-200 hover:bg-accent/50"
              >
                {/* Avatar com iniciais */}
                <Avatar className={`w-8 h-8 shadow-sm shrink-0 bg-gradient-to-br ${avatarColors[index % avatarColors.length]}`}>
                  <AvatarImage src={familiar.foto_url || undefined} alt={familiar.nome} className="object-cover" />
                  <AvatarFallback className="bg-transparent text-white text-sm font-semibold">
                    {getIniciais(familiar.nome)}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">
                      {familiar.nome}
                    </span>
                    {familiar.tipo_sanguineo && (
                      <Badge variant="outline" className="shrink-0 gap-1 h-5 text-[10px]">
                        <Droplets className="w-2.5 h-2.5 text-red-400" />
                        {familiar.tipo_sanguineo}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {calcularIdade(familiar.data_nascimento)} anos
                    </span>
                    {familiar.alergias && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-500">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Alergias
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
