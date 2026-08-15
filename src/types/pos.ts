export interface StoreConfig {
  nome: string;
  tag: string;
  endereco: string;
  doc: string;
  msg: string;
  nMesas: number;
  chavePix?: string;
  telefoneWhatsapp?: string;
}

export interface Product {
  cod: string;
  nome: string;
  cat: string;
  preco: number;
  custo: number;
  estoque: number;
  min: number;
  emoji: string;
}

export interface CartItem {
  cod: string;
  qtd: number;
}

export type PaymentMethodType = 'DINHEIRO' | 'DÉBITO' | 'CRÉDITO' | 'PIX' | 'OUTRO';

export interface PaymentRecord {
  metodo: PaymentMethodType;
  valor: number;
}

export interface SaleItem {
  cod: string;
  nome: string;
  preco: number;
  custo?: number;
  qtd: number;
}

export interface Sale {
  id: number;
  data: string; // 'DD/MM/YYYY'
  hora: string; // 'HH:MM'
  operador: string;
  caixaId?: number;
  itens: SaleItem[];
  subtotal: number;
  desconto: number;
  total: number;
  pagamentos: PaymentRecord[];
  troco: number;
  obs?: string;
  mesa?: number;
}

export interface CashMovement {
  id?: number;
  tipo: 'ABERTURA' | 'SUPRIMENTO' | 'SANGRIA';
  valor: number;
  motivo: string;
  data: string;
  hora: string;
  operador: string;
}

export interface CashRegisterState {
  aberto: boolean;
  operador?: string;
  abertura?: number;
  inicio?: number;
}

export interface CashClosing {
  id?: number;
  data: string;
  hora: string;
  operador: string;
  fundo: number;
  sup: number;
  san: number;
  porMet: Record<string, number>;
  faturamento: number;
  esperado: number;
  contado: number;
  dif: number;
  vendas: number;
}

export interface TableItem {
  cod: string;
  qtd: number;
}

export interface TableOrder {
  num: number;
  status: 'LIVRE' | 'OCUPADA';
  comanda: {
    itens: TableItem[];
    obs?: string;
    abertura: number;
    cliente?: string;
  } | null;
}

export interface CloudConfig {
  codigo: string;
  cfg: {
    apiKey?: string;
    authDomain?: string;
    databaseURL?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
}

export interface Operator {
  id: string;
  nome: string;
  senha: string;
  perfil: 'caixa' | 'gerente';
  criadoEm?: string;
}

export type AuthUser = {
  tipo: 'admin' | 'caixa';
  nome: string;
} | null;

export type ActiveScreen = 'login' | 'pdv' | 'mesas' | 'dash' | 'rel' | 'prod' | 'config';
