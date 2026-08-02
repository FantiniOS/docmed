# Rollback Híbrido: Código como "Familiar", UI como "Paciente"

Temos como objetivo restaurar a estabilidade do sistema revertendo as tipagens, propriedades e variáveis para o domínio original (`Familiar`), enquanto mantemos a nomenclatura `Paciente` estritamente na camada visual (UI e URLs).

## Proposed Changes

### Tipagens e Esquemas de Validação
#### [MODIFY] src/types/database.ts
- Renomear `interface Paciente` para `Familiar`.
- Renomear `PacienteFormData` para `FamiliarFormData`.
- Em `ConsultaComRelacionamentos`, `ExameComRelacionamentos` e `RelatorioComRelacionamentos`, trocar `pacientes?: Paciente;` por `familiares?: Familiar;`.
- Trocar `totalPacientes` para `totalFamiliares`.

#### [MODIFY] src/lib/validations/paciente.ts
- Renomear `pacienteSchema` para `familiarSchema`.
- Renomear `PacienteSchemaType` para `FamiliarSchemaType`.
- Renomear o arquivo para `familiar.ts` (ou manter `paciente.ts` mas mudar o código interno).

#### [MODIFY] src/lib/validations/consulta.ts, exame.ts, relatorio.ts
- Atualizar import e tipos para `Familiar`.

### Componentes de Formulário
#### [MODIFY] src/components/consultas/consulta-form.tsx, exames/exame-form.tsx, relatorios/relatorio-form.tsx
- Props: `pacientes: Paciente[]` -> `familiares: Familiar[]`.
- Maps: `pacientes.map(...)` -> `familiares.map(...)`.
- Select: `pacientes.find(...)` -> `familiares.find(...)`.

#### [MODIFY] src/components/pacientes/paciente-form.tsx
- Props: `initialData?: PacienteSchemaType` -> `FamiliarSchemaType`.
- Zod: `useForm<FamiliarSchemaType>({ resolver: zodResolver(familiarSchema) })`.

### Componentes de UI (Tabelas, Cards, Dashboards)
#### [MODIFY] src/components/exames/exam-table.tsx, paciente-tabs.tsx, resumo-clinico-botao.tsx
- Trocar interfaces e variáveis.
- Dashboard (`quick-access.tsx`, `recent-exams.tsx`, `upcoming-consultations.tsx`): Trocar `pacientes` por `familiares`.

### Rotas e Páginas (Pages)
- Em `src/app/page.tsx`, `src/app/consultas/page.tsx`:
  - Retirar os aliases do Supabase: `.select("*, pacientes:familiares(*), medicos(*)")` volta para `.select("*, familiares(*), medicos(*)")`.
  - Atribuir resultados para `familiares: familiaresResult.data`.
- Em `src/app/pacientes/page.tsx`:
  - Remover o `adapter` que mapeava `familiares` para `pacientes`. Apenas passar os `familiares` diretamente para a tabela.

### Verificação
- Garantir que `npm run build` passe sem erros de tipagem TypeScript.
- Testar inserção local com o mock de sessão (ou conferir payload no form).

