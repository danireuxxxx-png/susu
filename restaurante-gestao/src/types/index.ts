export type Role = "ADMIN" | "MANAGER" | "STAFF";

export type StatusFuncionario = "ATIVO" | "INATIVO" | "FERIAS" | "AFASTADO";

export type FormaPagamento =
  | "DINHEIRO"
  | "CARTAO_CREDITO"
  | "CARTAO_DEBITO"
  | "PIX"
  | "VALE";

export type TipoMeta =
  | "FATURAMENTO"
  | "ATENDIMENTOS"
  | "SATISFACAO"
  | "REDUCAO_CUSTOS"
  | "OUTRO";

export type StatusMeta =
  | "EM_ANDAMENTO"
  | "CONCLUIDA"
  | "NAO_ATINGIDA"
  | "CANCELADA";

export type CategoriaDespesa =
  | "ALUGUEL"
  | "SALARIOS"
  | "INSUMOS"
  | "ENERGIA"
  | "AGUA"
  | "MANUTENCAO"
  | "MARKETING"
  | "OUTRO";

export interface DashboardStats {
  faturamentoHoje: number;
  faturamentoMes: number;
  totalFuncionarios: number;
  metasAtivas: number;
  despesasMes: number;
  lucroMes: number;
  ticketMedio: number;
  vendasHoje: number;
}

export interface FaturamentoMensal {
  mes: string;
  receitas: number;
  despesas: number;
  lucro: number;
}
