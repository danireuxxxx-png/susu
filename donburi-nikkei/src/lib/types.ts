export type DishIllustration =
  | "donburi"
  | "nigiri"
  | "temaki"
  | "gyoza"
  | "drink"
  | "dessert"
  | "yakisoba"
  | "sashimi";

export type MenuTag = "vegetariano" | "picante" | "mais-pedido" | "novo";

export interface MenuItem {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoriaId: string;
  illustration: DishIllustration;
  tags?: MenuTag[];
  serve?: string;
}

export interface MenuCategory {
  id: string;
  nome: string;
  descricaoCurta: string;
}

export interface CartLine {
  itemId: string;
  quantidade: number;
  observacao?: string;
}
