export type CartStatus = 'DISPONIVEL' | 'EM_USO' | 'MANUTENCAO' | 'AGENDADO';

export interface Funcionario {
  id: string;
  nif: string;
  nome: string;
  unidade: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Carrinho {
  id: string;
  nome: string;
  identificador_fisico: string;
  ip_esp32: string | null;
  localizacao: string;
  status: CartStatus;
  created_at: string;
  updated_at: string;
}

export interface UsoCarrinho {
  id: string;
  carrinho_id: string;
  funcionario_id: string;
  data_hora_inicio: string;
  data_hora_fim: string | null;
  status: string;
  created_at: string;
  carrinho?: Carrinho;
  funcionario?: Funcionario;
}

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  nome: string | null;
  funcionario_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
}