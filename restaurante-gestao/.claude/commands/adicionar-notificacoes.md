Implemente sistema de alertas e notificações automáticas no sistema de restaurante.

## O que criar

### 1. Tipos de alerta (defina em `src/types/index.ts`)
```ts
export type TipoAlerta = "ESTOQUE_BAIXO" | "FERIAS_VENCIDA" | "META_ATRASADA" | "PAGAMENTO_PENDENTE" | "RECEITA_BAIXA";
export interface Alerta { id: string; tipo: TipoAlerta; mensagem: string; urgencia: "baixa" | "media" | "alta"; criadoEm: Date; }
```

### 2. Função `gerarAlertas()` em `src/lib/alertas.ts`
Verifique no banco (ou nos dados mockados) e retorne alertas quando:
- Produto com `estoque < estoqueMin` → ESTOQUE_BAIXO (urgência alta)
- Funcionário com férias vencidas (> 12 meses sem férias) → FERIAS_VENCIDA (urgência média)
- Meta com prazo em < 7 dias e progresso < 80% → META_ATRASADA (urgência média)
- Folha com `pago = false` e dia > 25 do mês → PAGAMENTO_PENDENTE (urgência alta)
- Faturamento do dia < 70% da média dos últimos 7 dias → RECEITA_BAIXA (urgência baixa)

### 3. Componente `src/components/layout/alertas-panel.tsx`
- Ícone de sino no Header com badge vermelho mostrando quantidade
- Dropdown ao clicar com lista de alertas
- Cada alerta com ícone por urgência (vermelho=alta, amarelo=média, azul=baixa)
- Botão "Ver todos" leva para `/relatorios`
- Marcar como lido (estado local com `useState`)

### 4. Integre no Header
Substitua o sino estático atual pelo componente `<AlertasPanel />`.

### 5. Seção de alertas no Dashboard
Atualize o card "Alertas" em `src/app/(dashboard)/dashboard/page.tsx` para usar `gerarAlertas()` em vez de dados fixos.

Após implementar, rode `npm run build` para confirmar.
