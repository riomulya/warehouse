import { useEffect, useMemo, useState } from 'react';
import {
  ScrollText,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  Filter,
  Eye,
  Download,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import type { Transaction, TransactionType } from '../types';
import { classNames, formatDate, formatNumber } from '../utils';

type TypeFilter = 'ALL' | TransactionType;

export default function TransactionLogsPage() {
  const user = useAuthStore((s) => s.user);
  const transactions = useAppStore((s) => s.transactions);
  const transactionsLoading = useAppStore((s) => s.transactionsLoading);
  const subscribeTransactions = useAppStore((s) => s.subscribeTransactions);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState<Transaction | null>(null);

  useEffect(() => {
    subscribeTransactions(200);
  }, [subscribeTransactions]);

  const stats = useMemo(() => {
    const total = transactions.length;
    const totalIn = transactions.filter((t) => t.type === 'IN').length;
    const totalOut = transactions.filter((t) => t.type === 'OUT').length;
    const qtyIn = transactions
      .filter((t) => t.type === 'IN')
      .reduce((sum, t) => sum + t.qty, 0);
    const qtyOut = transactions
      .filter((t) => t.type === 'OUT')
      .reduce((sum, t) => sum + t.qty, 0);
    return { total, totalIn, totalOut, qtyIn, qtyOut };
  }, [transactions]);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (typeFilter !== 'ALL') {
      list = list.filter((t) => t.type === typeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.product_name.toLowerCase().includes(q) ||
          t.product_id.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.created_by_name && t.created_by_name.toLowerCase().includes(q))
      );
    }
    if (startDate) {
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      list = list.filter((t) => t.created_at >= start);
    }
    if (endDate) {
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      list = list.filter((t) => t.created_at <= end);
    }
    return list;
  }, [transactions, typeFilter, search, startDate, endDate]);

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const exportCSV = () => {
    const headers = [
      'Waktu',
      'Nama Barang',
      'SKU',
      'Jenis',
      'Qty',
      'Admin',
      'Keterangan',
    ];
    const rows = filtered.map((t) => [
      formatDate(t.created_at),
      t.product_name,
      t.product_id,
      t.type === 'IN' ? 'Masuk' : 'Keluar',
      t.qty,
      t.created_by_name || t.created_by,
      t.notes || '',
    ]);
    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    a.download = `log-transaksi-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 md:space-y-8 relative">
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Detail Transaksi</h3>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <DetailRow
                label="Jenis"
                value={
                  <span
                    className={classNames(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ring-1 ring-inset',
                      selected.type === 'IN'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        : 'bg-rose-50 text-rose-700 ring-rose-200'
                    )}
                  >
                    {selected.type === 'IN' ? (
                      <>
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        Barang Masuk
                      </>
                    ) : (
                      <>
                        <ArrowUpFromLine className="w-3.5 h-3.5" />
                        Barang Keluar
                      </>
                    )}
                  </span>
                }
              />
              <DetailRow label="Waktu Transaksi" value={formatDate(selected.created_at)} />
              <DetailRow label="Nama Barang" value={selected.product_name} />
              <DetailRow
                label="SKU / ID Barang"
                value={
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono">
                    {selected.product_id}
                  </code>
                }
              />
              <DetailRow
                label="Kuantitas"
                value={
                  <span className="text-lg font-bold text-slate-900">
                    {formatNumber(selected.qty)}
                  </span>
                }
              />
              <DetailRow label="Dibuat Oleh (Admin)" value={selected.created_by_name || selected.created_by} />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  Keterangan
                </p>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700 min-h-[60px]">
                  {selected.notes || <span className="text-slate-400 italic">Tidak ada keterangan</span>}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                  ID Transaksi
                </p>
                <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono break-all">
                  {selected.id}
                </code>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <ScrollText className="w-5 h-5" />
            </span>
            Log Pergerakan Barang
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Riwayat seluruh aktivitas transaksi barang di gudang (view-only)
          </p>
        </div>
        {filtered.length > 0 && (
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition self-start md:self-auto"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </header>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <MiniStat label="Total Transaksi" value={stats.total} accent="indigo" loading={transactionsLoading} />
        <MiniStat label="Barang Masuk" value={stats.totalIn} sub={`${formatNumber(stats.qtyIn)} unit`} accent="emerald" loading={transactionsLoading} />
        <MiniStat label="Barang Keluar" value={stats.totalOut} sub={`${formatNumber(stats.qtyOut)} unit`} accent="rose" loading={transactionsLoading} />
        <MiniStat
          label="Net Stok"
          value={stats.qtyIn - stats.qtyOut}
          formatNum
          sub="Masuk - Keluar"
          accent="purple"
          loading={transactionsLoading}
        />
        <MiniStat
          label="Difilter"
          value={filtered.length}
          sub={`dari ${stats.total} data`}
          accent="amber"
          loading={transactionsLoading}
        />
      </div>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Filter Data</h2>
            </div>
            <button
              onClick={resetFilters}
              className="text-xs font-medium text-slate-500 hover:text-indigo-600 self-end md:self-auto transition"
            >
              Reset semua filter
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative sm:col-span-2 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama barang, SKU, admin, keterangan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                <option value="ALL">Semua Jenis</option>
                <option value="IN">Barang Masuk</option>
                <option value="OUT">Barang Keluar</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                title="Tanggal mulai"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-2 text-sm rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
              <input
                type="date"
                title="Tanggal akhir"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-2 text-sm rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="text-left px-4 md:px-6 py-3 font-semibold uppercase text-xs tracking-wide">
                  Waktu / Tanggal
                </th>
                <th className="text-left px-4 md:px-6 py-3 font-semibold uppercase text-xs tracking-wide">
                  Nama Barang
                </th>
                <th className="text-left px-4 md:px-6 py-3 font-semibold uppercase text-xs tracking-wide">
                  Jenis
                </th>
                <th className="text-right px-4 md:px-6 py-3 font-semibold uppercase text-xs tracking-wide">
                  Qty
                </th>
                <th className="text-left px-4 md:px-6 py-3 font-semibold uppercase text-xs tracking-wide hidden md:table-cell">
                  Admin
                </th>
                <th className="text-left px-4 md:px-6 py-3 font-semibold uppercase text-xs tracking-wide hidden lg:table-cell">
                  Keterangan
                </th>
                <th className="text-center px-4 md:px-6 py-3 font-semibold uppercase text-xs tracking-wide">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactionsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 md:px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded w-32 animate-pulse" />
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded w-40 animate-pulse" />
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="h-6 w-20 bg-slate-100 rounded animate-pulse" />
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <div className="h-4 w-12 ml-auto bg-slate-100 rounded animate-pulse" />
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden md:table-cell">
                      <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
                    </td>
                    <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
                      <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
                    </td>
                    <td />
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 md:px-6 py-16 text-center text-slate-400">
                    <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium text-slate-500">
                      {transactions.length === 0
                        ? 'Belum ada data transaksi'
                        : 'Tidak ada transaksi yang sesuai filter'}
                    </p>
                    {transactions.length > 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        Coba atur ulang filter atau kata kunci pencarian
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 md:px-6 py-3.5 whitespace-nowrap">
                      <p className="text-sm text-slate-900 font-medium">
                        {formatDate(t.created_at).split(',')[0]}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(t.created_at).split(',')[1]?.trim() || ''}
                      </p>
                    </td>
                    <td className="px-4 md:px-6 py-3.5">
                      <p className="font-medium text-slate-900">{t.product_name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                          {t.product_id}
                        </code>
                      </p>
                    </td>
                    <td className="px-4 md:px-6 py-3.5">
                      {t.type === 'IN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 text-xs font-semibold">
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                          Masuk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 text-xs font-semibold">
                          <ArrowUpFromLine className="w-3.5 h-3.5" />
                          Keluar
                        </span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-3.5 text-right">
                      <span
                        className={classNames(
                          'font-bold text-base',
                          t.type === 'IN' ? 'text-emerald-700' : 'text-rose-700'
                        )}
                      >
                        {t.type === 'IN' ? '+' : '-'}
                        {formatNumber(t.qty)}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3.5 hidden md:table-cell">
                      <p className="text-sm text-slate-700">{t.created_by_name || '-'}</p>
                      {t.created_by_name && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[120px]">
                          {t.created_by}
                        </p>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-3.5 hidden lg:table-cell">
                      <p className="text-sm text-slate-600 max-w-xs truncate">
                        {t.notes || <span className="text-slate-400 italic">-</span>}
                      </p>
                    </td>
                    <td className="px-4 md:px-6 py-3.5 text-center">
                      <button
                        onClick={() => setSelected(t)}
                        title="Lihat detail"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Detail</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!transactionsLoading && filtered.length > 0 && (
          <div className="px-4 md:px-6 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500 bg-slate-50/50">
            <span>
              Menampilkan {filtered.length} data
              {(search || typeFilter !== 'ALL' || startDate || endDate) && ' (terfilter)'}
            </span>
            <span className="text-slate-400">
              Diakses oleh: <strong className="text-slate-600">{user?.name}</strong> ({user?.role})
            </span>
          </div>
        )}
      </section>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <div className="text-sm text-slate-900">{value}</div>
    </div>
  );
}

interface MiniStatProps {
  label: string;
  value: number;
  sub?: string;
  accent: 'indigo' | 'emerald' | 'rose' | 'purple' | 'amber';
  loading?: boolean;
  formatNum?: boolean;
}

function MiniStat({ label, value, sub, accent, loading, formatNum }: MiniStatProps) {
  const textColors = {
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
    purple: 'text-purple-600',
    amber: 'text-amber-600',
  } as const;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 md:p-4">
      <p className="text-[11px] md:text-xs font-medium text-slate-500 truncate">{label}</p>
      {loading ? (
        <div className="mt-1.5 h-6 w-14 bg-slate-100 rounded animate-pulse" />
      ) : (
        <>
          <p className={`text-xl md:text-2xl font-bold text-slate-900 mt-1 ${textColors[accent]}`}>
            {formatNum ? formatNumber(value) : value}
          </p>
          {sub && <p className="text-[11px] md:text-xs text-slate-400 mt-0.5">{sub}</p>}
        </>
      )}
    </div>
  );
}
