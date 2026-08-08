import { create } from 'zustand';
import type { Product, Transaction } from '../types';
import { db } from '../services/firebase';
import { ref, onValue, limitToLast, query } from 'firebase/database';

interface AppState {
  products: Product[];
  transactions: Transaction[];
  productsLoading: boolean;
  transactionsLoading: boolean;
  productsUnsubscribe: (() => void) | null;
  transactionsUnsubscribe: (() => void) | null;
  subscribeProducts: () => void;
  subscribeTransactions: (limit?: number) => void;
  unsubscribeAll: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  products: [],
  transactions: [],
  productsLoading: true,
  transactionsLoading: true,
  productsUnsubscribe: null,
  transactionsUnsubscribe: null,

  subscribeProducts: () => {
    const existing = get().productsUnsubscribe;
    if (existing) return;
    set({ productsLoading: true });
    const productsRef = ref(db, 'products');
    const unsub = onValue(productsRef, (snapshot) => {
      const products: Product[] = [];
      snapshot.forEach((child) => {
        products.push({
          id: child.key as string,
          ...(child.val() as Omit<Product, 'id'>),
        });
      });
      products.sort((a, b) => a.name.localeCompare(b.name));
      set({ products, productsLoading: false });
    }, () => {
      set({ productsLoading: false });
    });
    set({ productsUnsubscribe: unsub });
  },

  subscribeTransactions: (limit = 100) => {
    const existing = get().transactionsUnsubscribe;
    if (existing) return;
    set({ transactionsLoading: true });
    const txRef = query(ref(db, 'transactions'), limitToLast(limit));
    const unsub = onValue(txRef, (snapshot) => {
      const transactions: Transaction[] = [];
      snapshot.forEach((child) => {
        transactions.push({
          id: child.key as string,
          ...(child.val() as Omit<Transaction, 'id'>),
        });
      });
      transactions.sort((a, b) => b.created_at - a.created_at);
      set({ transactions, transactionsLoading: false });
    }, () => {
      set({ transactionsLoading: false });
    });
    set({ transactionsUnsubscribe: unsub });
  },

  unsubscribeAll: () => {
    const { productsUnsubscribe, transactionsUnsubscribe } = get();
    if (productsUnsubscribe) {
      productsUnsubscribe();
    }
    if (transactionsUnsubscribe) {
      transactionsUnsubscribe();
    }
    set({
      productsUnsubscribe: null,
      transactionsUnsubscribe: null,
      products: [],
      transactions: [],
      productsLoading: true,
      transactionsLoading: true,
    });
  },
}));
