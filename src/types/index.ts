export type UserRole = 'admin' | 'management';

export interface UserData {
  email: string;
  name: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  current_stock: number;
  updated_at: number;
  pinned?: boolean;
}

export type TransactionType = 'IN' | 'OUT';

export interface Transaction {
  id: string;
  product_id: string;
  product_name: string;
  type: TransactionType;
  qty: number;
  created_at: number;
  created_by: string;
  created_by_name?: string;
  notes?: string;
}
