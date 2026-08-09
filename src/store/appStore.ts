import { create } from 'zustand';
import type { Product, Transaction } from '../types';
import { db } from '../services/firebase';
import {
  ref,
  onValue,
  limitToLast,
  query,
  set,
  update,
  remove,
  serverTimestamp,
  get,
} from 'firebase/database';

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
  addProduct: (
    id: string,
    name: string,
    initialStock?: number,
  ) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((setState, getState) => ({
  products: [],
  transactions: [],
  productsLoading: true,
  transactionsLoading: true,
  productsUnsubscribe: null,
  transactionsUnsubscribe: null,

  subscribeProducts: () => {
    const existing = getState().productsUnsubscribe;
    if (existing) return;
    setState({ productsLoading: true });
    const productsRef = ref(db, 'products');
    const unsub = onValue(
      productsRef,
      (snapshot) => {
        const products: Product[] = [];
        snapshot.forEach((child) => {
          products.push({
            id: child.key as string,
            ...(child.val() as Omit<Product, 'id'>),
          });
        });
        products.sort((a, b) => a.name.localeCompare(b.name));
        setState({ products, productsLoading: false });
      },
      () => {
        setState({ productsLoading: false });
      },
    );
    setState({ productsUnsubscribe: unsub });
  },

  subscribeTransactions: (limit = 100) => {
    const existing = getState().transactionsUnsubscribe;
    if (existing) return;
    setState({ transactionsLoading: true });
    const txRef = query(ref(db, 'transactions'), limitToLast(limit));
    const unsub = onValue(
      txRef,
      (snapshot) => {
        const transactions: Transaction[] = [];
        snapshot.forEach((child) => {
          transactions.push({
            id: child.key as string,
            ...(child.val() as Omit<Transaction, 'id'>),
          });
        });
        transactions.sort((a, b) => b.created_at - a.created_at);
        setState({ transactions, transactionsLoading: false });
      },
      () => {
        setState({ transactionsLoading: false });
      },
    );
    setState({ transactionsUnsubscribe: unsub });
  },

  unsubscribeAll: () => {
    const { productsUnsubscribe, transactionsUnsubscribe } = getState();
    if (productsUnsubscribe) {
      productsUnsubscribe();
    }
    if (transactionsUnsubscribe) {
      transactionsUnsubscribe();
    }
    setState({
      productsUnsubscribe: null,
      transactionsUnsubscribe: null,
      products: [],
      transactions: [],
      productsLoading: true,
      transactionsLoading: true,
    });
  },

  addProduct: async (id, name, initialStock = 0) => {
    const trimmedId = id.trim();
    const trimmedName = name.trim();
    if (!trimmedId || !trimmedName) {
      throw new Error('SKU dan nama barang tidak boleh kosong.');
    }
    const existingSnap = await get(ref(db, `products/${trimmedId}`));
    if (existingSnap.exists()) {
      throw new Error(`SKU "${trimmedId}" sudah digunakan.`);
    }
    await set(ref(db, `products/${trimmedId}`), {
      name: trimmedName,
      current_stock: initialStock,
      updated_at: serverTimestamp(),
      pinned: false,
    });
  },

  deleteProduct: async (id) => {
    const existingSnap = await get(ref(db, `products/${id}`));
    if (!existingSnap.exists()) {
      throw new Error('Barang tidak ditemukan.');
    }
    await remove(ref(db, `products/${id}`));
  },

  togglePin: async (id) => {
    const product = getState().products.find((p) => p.id === id);
    if (!product) return;
    const nextPin = !product.pinned;
    await update(ref(db, `products/${id}`), {
      pinned: nextPin,
      updated_at: serverTimestamp(),
    });
  },
}));
