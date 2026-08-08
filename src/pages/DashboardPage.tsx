import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package2,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Search,
  RefreshCw,
  ArrowLeftRight,
  ArrowDownAZ,
  ArrowUpAZ,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { formatNumber, classNames } from '../utils';

const LOW_STOCK_THRESHOLD = 10;

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const products = useAppStore((s) => s.products);
  const productsLoading = useAppStore((s) => s.productsLoading);
  const subscribeProducts = useAppStore((s) => s.subscribeProducts);

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'stock'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    subscribeProducts();
  }, [subscribeProducts]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.current_stock || 0), 0);
    const lowStockCount = products.filter(
      (p) => p.current_stock > 0 && p.current_stock <= LOW_STOCK_THRESHOLD
    ).length;
    const outOfStockCount = products.filter((p) => p.current_stock <= 0).length;
    return { totalProducts, totalStock, lowStockCount, outOfStockCount };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const cmp =
        sortKey === 'name'
          ? a.name.localeCompare(b.name, 'id-ID')
          : a.current_stock - b.current_stock;
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [products, search, sortKey, sortAsc]);

  const toggleSort = (key: 'name' | 'stock') => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-8">
      <header className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100 text-[11px] font-semibold uppercase tracking-wider mb-2">
            Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight break-words">
            Dashboard Stok Barang
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Selamat datang,{' '}
            <span className="font-semibold text-slate-700">{user?.name ?? 'User'}</span>
          </p>
        </div>
        {user?.role === 'admin' && (
          <Link
            to="/input-transaction"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 active:scale-[0.99] transition-all w-full sm:w-auto self-start sm:self-auto"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Input Transaksi Baru
          </Link>
        )}
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <StatCard
          label="Total Item"
          value={stats.totalProducts}
          icon={<Package2 className="w-5 h-5" />}
          accent="indigo"
          loading={productsLoading}
        />
        <StatCard
          label="Total Stok"
          value={stats.totalStock}
          formatNumber
          icon={<TrendingUp className="w-5 h-5" />}
          accent="emerald"
          loading={productsLoading}
        />
        <StatCard
          label="Stok Menipis"
          value={stats.lowStockCount}
          icon={<ArrowUpDown className="w-5 h-5" />}
          accent="amber"
          loading={productsLoading}
          suffix={stats.lowStockCount ? `≤${LOW_STOCK_THRESHOLD}` : ''}
        />
        <StatCard
          label="Stok Habis"
          value={stats.outOfStockCount}
          icon={<TrendingDown className="w-5 h-5" />}
          accent="rose"
          loading={productsLoading}
        />
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Daftar Stok Barang
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Diperbarui secara real-time melalui WebSocket Firebase
            </p>
          </div>
          <div className="relative w-full sm:w-80 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Cari nama / SKU..."
              inputMode="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                aria-label="Bersihkan pencarian"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 sticky top-0 backdrop-blur">
              <tr>
                <th scope="col" className="text-left px-4 sm:px-6 py-3.5 pl-4 sm:pl-6 font-semibold uppercase text-[11px] tracking-wider">
                  <button
                    onClick={() => toggleSort('name')}
                    className="flex items-center gap-1.5 hover:text-slate-900 transition"
                  >
                    SKU
                    <SortIndicator active={sortKey === 'name'} asc={sortAsc} />
                  </button>
                </th>
                <th scope="col" className="text-left px-4 sm:px-6 py-3.5 font-semibold uppercase text-[11px] tracking-wider">
                  <button
                    onClick={() => toggleSort('name')}
                    className="flex items-center gap-1.5 hover:text-slate-900 transition whitespace-nowrap"
                  >
                    Nama Barang
                    <SortIndicator active={sortKey === 'name'} asc={sortAsc} />
                  </button>
                </th>
                <th scope="col" className="text-right px-4 sm:px-6 py-3.5 font-semibold uppercase text-[11px] tracking-wider pr-4 sm:pr-6">
                  <button
                    onClick={() => toggleSort('stock')}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 transition whitespace-nowrap"
                  >
                    Sisa Stok
                    <SortIndicator active={sortKey === 'stock'} asc={sortAsc} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} aria-hidden>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded w-20 sm:w-24 animate-pulse" />
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded w-40 sm:w-56 animate-pulse" />
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <div className="h-6 w-14 sm:w-16 bg-slate-100 rounded-md animate-pulse ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 sm:px-6 py-12 sm:py-16 text-center">
                    <Package2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-600">
                      {search ? 'Barang tidak ditemukan' : 'Belum ada data barang'}
                    </p>
                    {search ? (
                      <button
                        onClick={() => setSearch('')}
                        className="mt-2 text-xs text-indigo-600 font-semibold hover:text-indigo-700 hover:underline"
                      >
                        Bersihkan pencarian
                      </button>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        Tambahkan barang melalui Input Transaksi atau import ke Realtime Database
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const state =
                    p.current_stock <= 0
                      ? { label: 'Habis', cls: 'bg-rose-50 text-rose-700 ring-rose-200' }
                      : p.current_stock <= LOW_STOCK_THRESHOLD
                      ? { label: 'Menipis', cls: 'bg-amber-50 text-amber-700 ring-amber-200' }
                      : { label: 'Aman', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' };
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 sm:px-6 py-3 sm:py-3.5 whitespace-nowrap">
                        <code className="text-[11px] sm:text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md ring-1 ring-slate-200/70">
                          {p.id}
                        </code>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-3.5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                          <span className="font-semibold text-slate-900 leading-snug break-words">
                            {p.name}
                          </span>
                          <span
                            className={classNames(
                              'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset w-fit',
                              state.cls
                            )}
                          >
                            {state.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-3.5 text-right whitespace-nowrap">
                        <span
                          className={classNames(
                            'inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-sm sm:text-base font-bold ring-1 ring-inset',
                            state.cls
                          )}
                        >
                          {formatNumber(p.current_stock)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!productsLoading && filteredProducts.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-[11px] sm:text-xs text-slate-500 bg-slate-50/50">
            <span>
              Menampilkan{' '}
              <strong className="text-slate-700">{filteredProducts.length}</strong> dari{' '}
              <strong className="text-slate-700">{products.length}</strong> item barang
            </span>
            <span>{search && '· Hasil terfilter'}</span>
          </div>
        )}
      </section>
    </div>
  );
}

function SortIndicator({ active, asc }: { active: boolean; asc: boolean }) {
  if (!active) {
    return <RefreshCw className="w-3 h-3 opacity-0 group-hover:opacity-60" />;
  }
  return asc ? (
    <ArrowDownAZ className="w-3 h-3 text-indigo-500" />
  ) : (
    <ArrowUpAZ className="w-3 h-3 text-indigo-500" />
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: 'indigo' | 'emerald' | 'amber' | 'rose';
  loading?: boolean;
  formatNumber?: boolean;
  suffix?: string;
}

function StatCard({
  label,
  value,
  icon,
  accent,
  loading,
  formatNumber: fmt,
  suffix,
}: StatCardProps) {
  const accents = {
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-600 ring-amber-100',
    rose: 'bg-rose-50 text-rose-600 ring-rose-100',
  } as const;
  const textColors = {
    indigo: 'text-indigo-700',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    rose: 'text-rose-700',
  } as const;
  return (
    <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 sm:p-4 lg:p-5 overflow-hidden">
      <div
        className={classNames(
          'absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-40 blur-2xl',
          accent === 'indigo' && 'bg-indigo-300',
          accent === 'emerald' && 'bg-emerald-300',
          accent === 'amber' && 'bg-amber-300',
          accent === 'rose' && 'bg-rose-300'
        )}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-semibold text-slate-500 truncate">
            {label}
          </p>
          {loading ? (
            <div className="mt-2 h-7 sm:h-8 w-14 sm:w-20 bg-slate-100 rounded-lg animate-pulse" />
          ) : (
            <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 min-w-0">
              <span
                className={classNames(
                  'text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight truncate',
                  textColors[accent]
                )}
              >
                {fmt ? formatNumber(value) : value}
              </span>
              {suffix && (
                <span className="text-[10px] sm:text-xs text-slate-400 font-medium flex-shrink-0">
                  {suffix}
                </span>
              )}
            </div>
          )}
        </div>
        <div
          className={classNames(
            'p-2 sm:p-2.5 rounded-xl ring-1 ring-inset flex-shrink-0',
            accents[accent]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
