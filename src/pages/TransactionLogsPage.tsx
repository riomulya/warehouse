import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ScrollText,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  Filter,
  Eye,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import type { Transaction, TransactionType } from '../types';
import { cn, formatDate, formatNumber } from '../utils';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import { Separator } from '../components/ui/separator';
import PageTransition from '../components/motion/PageTransition';
import {
  StaggerContainer,
  StaggerItem,
} from '../components/motion/StaggerContainer';
import AnimatedCard from '../components/motion/AnimatedCard';

type TypeFilter = 'ALL' | TransactionType;

type MiniAccent = 'indigo' | 'emerald' | 'rose' | 'purple' | 'amber';

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
          (t.created_by_name && t.created_by_name.toLowerCase().includes(q)),
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
      ...rows.map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    a.download = `log-transaksi-${d.getFullYear()}${pad(
      d.getMonth() + 1,
    )}${pad(d.getDate())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const miniStats = [
    {
      label: 'Total Transaksi',
      value: stats.total,
      sub: '',
      accent: 'indigo' as MiniAccent,
      loading: transactionsLoading,
      formatNum: false,
    },
    {
      label: 'Barang Masuk',
      value: stats.totalIn,
      sub: `${formatNumber(stats.qtyIn)} unit`,
      accent: 'emerald' as MiniAccent,
      loading: transactionsLoading,
      formatNum: false,
    },
    {
      label: 'Barang Keluar',
      value: stats.totalOut,
      sub: `${formatNumber(stats.qtyOut)} unit`,
      accent: 'rose' as MiniAccent,
      loading: transactionsLoading,
      formatNum: false,
    },
    {
      label: 'Net Stok',
      value: stats.qtyIn - stats.qtyOut,
      sub: 'Masuk - Keluar',
      accent: 'purple' as MiniAccent,
      loading: transactionsLoading,
      formatNum: true,
    },
    {
      label: 'Difilter',
      value: filtered.length,
      sub: `dari ${stats.total} data`,
      accent: 'amber' as MiniAccent,
      loading: transactionsLoading,
      formatNum: false,
    },
  ];

  const tableRowVariants: any = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: Math.min(i * 0.015, 0.25),
        duration: 0.32,
        ease: [0.16, 1, 0.3, 1] as any,
      },
    }),
  };

  return (
    <PageTransition className='space-y-6 md:space-y-8 relative'>
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent open={!!selected} className='sm:max-w-xl'>
          <DialogHeader>
            <DialogTitle className='text-lg font-extrabold flex items-center gap-2.5'>
              <span className='w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center ring-1 ring-purple-100'>
                <ScrollText className='w-4 h-4' />
              </span>
              Detail Transaksi
            </DialogTitle>
            <DialogDescription className='text-[13px] mt-1.5'>
              Informasi lengkap mengenai transaksi yang dipilih
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className='space-y-5 py-2'>
              <DetailRow
                label='Jenis Transaksi'
                value={
                  <span>
                    {selected.type === 'IN' ? (
                      <Badge
                        variant='emerald'
                        className='text-[11px] font-extrabold uppercase tracking-wider px-3 py-1.5 gap-1.5'
                      >
                        <ArrowDownToLine className='w-3.5 h-3.5' />
                        Barang Masuk
                      </Badge>
                    ) : (
                      <Badge
                        variant='rose'
                        className='text-[11px] font-extrabold uppercase tracking-wider px-3 py-1.5 gap-1.5'
                      >
                        <ArrowUpFromLine className='w-3.5 h-3.5' />
                        Barang Keluar
                      </Badge>
                    )}
                  </span>
                }
              />
              <DetailRow
                label='Waktu Transaksi'
                value={
                  <span className='font-bold text-slate-800 text-[14px]'>
                    {formatDate(selected.created_at)}
                  </span>
                }
              />
              <DetailRow
                label='Nama Barang'
                value={
                  <span className='font-bold text-slate-800 text-[14.5px]'>
                    {selected.product_name}
                  </span>
                }
              />
              <DetailRow
                label='SKU / ID Barang'
                value={
                  <code className='text-xs font-mono text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-lg ring-1 ring-slate-200'>
                    {selected.product_id}
                  </code>
                }
              />
              <DetailRow
                label='Kuantitas'
                value={
                  <motion.span
                    key={selected.qty}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={cn(
                      'inline-flex items-center px-4 py-2 rounded-xl text-lg font-black ring-1 ring-inset',
                      selected.type === 'IN'
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        : 'bg-rose-50 text-rose-700 ring-rose-200',
                    )}
                  >
                    {selected.type === 'IN' ? '+' : '-'}
                    {formatNumber(selected.qty)}
                  </motion.span>
                }
              />
              <DetailRow
                label='Dibuat Oleh (Admin)'
                value={
                  <div className='text-right'>
                    <p className='text-sm font-bold text-slate-800'>
                      {selected.created_by_name || '-'}
                    </p>
                    {selected.created_by_name && (
                      <p className='text-xs text-slate-400 mt-0.5 truncate'>
                        UID: {selected.created_by}
                      </p>
                    )}
                  </div>
                }
              />
              <Separator className='opacity-60' />
              <div>
                <p className='text-xs font-extrabold text-slate-500 uppercase tracking-[0.14em] mb-2 pl-0.5'>
                  Keterangan Tambahan
                </p>
                <div className='rounded-xl bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 border border-slate-200 p-4 text-sm text-slate-700 min-h-[70px] leading-relaxed'>
                  {selected.notes || (
                    <span className='text-slate-400 italic'>
                      Tidak ada keterangan untuk transaksi ini
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className='text-xs font-extrabold text-slate-500 uppercase tracking-[0.14em] mb-2 pl-0.5'>
                  ID Transaksi
                </p>
                <code className='text-xs bg-slate-100 px-3 py-2 rounded-lg text-slate-600 font-mono break-all ring-1 ring-slate-200 block'>
                  {selected.id}
                </code>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => setSelected(null)}
              variant='default'
              size='lg'
              className='w-full sm:w-auto font-bold text-[14px]'
            >
              Tutup Detail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className='flex flex-col md:flex-row md:items-center md:justify-between gap-3.5'
      >
        <div className='min-w-0'>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
            className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-100 text-[11px] font-bold uppercase tracking-[0.14em] mb-2.5'
          >
            <span className='w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse' />
            Log Aktivitas
          </motion.div>
          <h1 className='text-2xl sm:text-3xl lg:text-[2.15rem] font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5 leading-[1.15]'>
            <motion.span
              whileHover={{ scale: 1.06, rotate: -3 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className='w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-purple-100 via-indigo-100 to-purple-100 text-purple-600 flex items-center justify-center ring-1 ring-purple-200 shadow-md shadow-purple-100/80'
            >
              <ScrollText
                className='w-5 h-5 sm:w-[22px] sm:h-[22px]'
                strokeWidth={2.2}
              />
            </motion.span>
            Log Pergerakan Barang
          </h1>
          <p className='text-sm text-slate-500 mt-2 leading-relaxed'>
            Riwayat seluruh aktivitas transaksi barang di gudang (view-only
            untuk Management)
          </p>
        </div>
        {filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <Button
              onClick={exportCSV}
              variant='outline'
              size='lg'
              className='inline-flex items-center gap-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm self-start md:self-auto text-[14px] font-bold'
            >
              <Download className='w-[17px] h-[17px]' />
              Export CSV
            </Button>
          </motion.div>
        )}
      </motion.header>

      <StaggerContainer
        className='grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4'
        delay={0.04}
      >
        {miniStats.map((stat) => (
          <StaggerItem key={stat.label}>
            <AnimatedCard
              tiltAmount={3}
              glowColor={
                stat.accent === 'indigo'
                  ? '99, 102, 241'
                  : stat.accent === 'emerald'
                    ? '16, 185, 129'
                    : stat.accent === 'rose'
                      ? '244, 63, 94'
                      : stat.accent === 'purple'
                        ? '168, 85, 247'
                        : '245, 158, 11'
              }
            >
              <MiniStat {...stat} />
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className='overflow-hidden shadow-[0_2px_24px_-10px_rgba(15,23,42,0.1)] border-slate-200/80'>
          <CardHeader className='p-4 md:p-5 border-b border-slate-100/80 space-y-4'>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
              <div className='flex items-center gap-2.5'>
                <span className='w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center ring-1 ring-indigo-100'>
                  <Filter className='w-4 h-4' />
                </span>
                <div>
                  <CardTitle className='text-base font-extrabold text-slate-900'>
                    Filter Data Transaksi
                  </CardTitle>
                  <CardDescription className='text-xs sm:text-sm mt-0.5'>
                    Saring data berdasarkan pencarian, jenis, dan tanggal
                  </CardDescription>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetFilters}
                className='text-xs font-bold text-slate-500 hover:text-indigo-600 self-end md:self-auto transition-colors inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-100'
              >
                <RefreshCw className='w-3.5 h-3.5' />
                Reset semua filter
              </motion.button>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5'>
              <div className='relative sm:col-span-2 lg:col-span-2 group'>
                <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300' />
                <Input
                  type='text'
                  placeholder='Cari nama barang, SKU, admin, keterangan...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='h-11 pl-10 pr-4 text-[14px] rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border-slate-200 hover:border-indigo-200 transition-all duration-200'
                />
              </div>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className='h-11 text-[14px] rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border-slate-200 hover:border-indigo-200 transition-all duration-200'
              >
                <option value='ALL'>Semua Jenis</option>
                <option value='IN'>Barang Masuk</option>
                <option value='OUT'>Barang Keluar</option>
              </Select>
              <div className='flex gap-2.5'>
                <Input
                  type='date'
                  title='Tanggal mulai'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className='h-11 flex-1 min-w-0 px-3 text-[14px] rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border-slate-200 hover:border-indigo-200 transition-all duration-200'
                />
                <Input
                  type='date'
                  title='Tanggal akhir'
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className='h-11 flex-1 min-w-0 px-3 text-[14px] rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border-slate-200 hover:border-indigo-200 transition-all duration-200'
                />
              </div>
            </div>
          </CardHeader>

          <div className='overflow-x-auto'>
            <Table>
              <TableHeader className='bg-slate-50/90 backdrop-blur-sm'>
                <TableRow className='hover:bg-transparent border-b border-slate-100'>
                  <TableHead className='text-left px-4 md:px-6 py-3.5 w-[18%]'>
                    Waktu / Tanggal
                  </TableHead>
                  <TableHead className='text-left px-4 md:px-6 py-3.5'>
                    Nama Barang
                  </TableHead>
                  <TableHead className='text-left px-4 md:px-6 py-3.5 w-[14%]'>
                    Jenis
                  </TableHead>
                  <TableHead className='text-right px-4 md:px-6 py-3.5 w-[12%]'>
                    Qty
                  </TableHead>
                  <TableHead className='text-left px-4 md:px-6 py-3.5 hidden md:table-cell w-[16%]'>
                    Admin
                  </TableHead>
                  <TableHead className='text-left px-4 md:px-6 py-3.5 hidden lg:table-cell'>
                    Keterangan
                  </TableHead>
                  <TableHead className='text-center px-4 md:px-6 py-3.5 w-[10%]'>
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow
                      key={i}
                      aria-hidden
                      className='hover:bg-transparent'
                    >
                      <TableCell className='px-4 md:px-6 py-4'>
                        <Skeleton className='h-4 w-32 rounded-lg' />
                      </TableCell>
                      <TableCell className='px-4 md:px-6 py-4'>
                        <Skeleton className='h-4 w-44 rounded-lg' />
                      </TableCell>
                      <TableCell className='px-4 md:px-6 py-4'>
                        <Skeleton className='h-7 w-20 rounded-lg' />
                      </TableCell>
                      <TableCell className='px-4 md:px-6 py-4 text-right'>
                        <Skeleton className='h-4 w-12 ml-auto rounded-lg' />
                      </TableCell>
                      <TableCell className='px-4 md:px-6 py-4 hidden md:table-cell'>
                        <Skeleton className='h-4 w-24 rounded-lg' />
                      </TableCell>
                      <TableCell className='px-4 md:px-6 py-4 hidden lg:table-cell'>
                        <Skeleton className='h-4 w-48 rounded-lg' />
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow className='hover:bg-transparent'>
                    <TableCell colSpan={7} className='px-4 md:px-6 py-16'>
                      <div className='text-center'>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 200,
                            damping: 20,
                          }}
                          className='w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-50 flex items-center justify-center ring-1 ring-slate-100'
                        >
                          <ScrollText className='w-8 h-8 opacity-50 text-slate-400' />
                        </motion.div>
                        <p className='font-bold text-slate-600 mb-1.5'>
                          {transactions.length === 0
                            ? 'Belum ada data transaksi'
                            : 'Tidak ada transaksi yang sesuai filter'}
                        </p>
                        {transactions.length > 0 && (
                          <p className='text-xs text-slate-400 mt-1.5'>
                            Coba atur ulang filter atau kata kunci pencarian
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t, i) => (
                    <motion.tr
                      key={t.id}
                      custom={i}
                      variants={tableRowVariants}
                      initial='hidden'
                      animate='visible'
                      whileHover={{
                        backgroundColor: 'rgba(248, 250, 252, 0.9)',
                      }}
                      className='group border-b border-slate-100'
                    >
                      <TableCell className='px-4 md:px-6 py-3.5 whitespace-nowrap'>
                        <div>
                          <p className='text-[13.5px] font-bold text-slate-800 leading-tight'>
                            {formatDate(t.created_at).split(',')[0]}
                          </p>
                          <p className='text-xs text-slate-500 mt-1 font-medium'>
                            {formatDate(t.created_at).split(',')[1]?.trim() ||
                              ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className='px-4 md:px-6 py-3.5'>
                        <div className='min-w-0'>
                          <motion.p
                            whileHover={{ x: 2 }}
                            className='font-bold text-slate-800 text-[14px] truncate max-w-[260px]'
                          >
                            {t.product_name}
                          </motion.p>
                          <p className='text-xs text-slate-400 mt-1'>
                            <code className='font-mono bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-500'>
                              {t.product_id}
                            </code>
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className='px-4 md:px-6 py-3.5'>
                        {t.type === 'IN' ? (
                          <Badge
                            variant='emerald'
                            className='text-[11px] font-extrabold gap-1.5 w-fit'
                          >
                            <ArrowDownToLine className='w-3.5 h-3.5' />
                            Masuk
                          </Badge>
                        ) : (
                          <Badge
                            variant='rose'
                            className='text-[11px] font-extrabold gap-1.5 w-fit'
                          >
                            <ArrowUpFromLine className='w-3.5 h-3.5' />
                            Keluar
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className='px-4 md:px-6 py-3.5 text-right whitespace-nowrap'>
                        <motion.span
                          key={`${t.id}-${t.qty}`}
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: Math.min(i * 0.01, 0.15),
                            type: 'spring',
                            stiffness: 300,
                            damping: 24,
                          }}
                          className={cn(
                            'font-black text-[15px] sm:text-base',
                            t.type === 'IN'
                              ? 'text-emerald-700'
                              : 'text-rose-700',
                          )}
                        >
                          {t.type === 'IN' ? '+' : '-'}
                          {formatNumber(t.qty)}
                        </motion.span>
                      </TableCell>
                      <TableCell className='px-4 md:px-6 py-3.5 hidden md:table-cell'>
                        <div className='min-w-0'>
                          <p className='text-[13.5px] font-semibold text-slate-700 truncate max-w-[140px]'>
                            {t.created_by_name || '-'}
                          </p>
                          {t.created_by_name && (
                            <p className='text-xs text-slate-400 mt-0.5 truncate max-w-[140px]'>
                              {t.created_by}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='px-4 md:px-6 py-3.5 hidden lg:table-cell'>
                        <p className='text-[13px] text-slate-600 max-w-xs truncate'>
                          {t.notes || (
                            <span className='text-slate-400 italic'>-</span>
                          )}
                        </p>
                      </TableCell>
                      <TableCell className='px-4 md:px-6 py-3.5 text-center'>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelected(t)}
                          title='Lihat detail'
                          className='inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold text-indigo-600 hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-100 transition-all duration-200 group-hover:bg-indigo-50'
                        >
                          <Eye className='w-4 h-4' />
                          <span className='hidden sm:inline'>Detail</span>
                        </motion.button>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!transactionsLoading && filtered.length > 0 && (
            <div className='px-4 md:px-6 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11.5px] sm:text-xs text-slate-500 bg-slate-50/70'>
              <span className='font-semibold'>
                Menampilkan{' '}
                <strong className='text-slate-700 text-[13px]'>
                  {filtered.length}
                </strong>{' '}
                data
                {(search || typeFilter !== 'ALL' || startDate || endDate) &&
                  ' (terfilter)'}
              </span>
              <span className='text-slate-400 font-medium'>
                Diakses oleh:{' '}
                <strong className='text-slate-600 text-[13px]'>
                  {user?.name}
                </strong>{' '}
                ({user?.role})
              </span>
            </div>
          )}
        </Card>
      </motion.section>
    </PageTransition>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className='flex items-center justify-between gap-4 pl-0.5'>
      <p className='text-xs font-extrabold text-slate-500 uppercase tracking-[0.14em] shrink-0'>
        {label}
      </p>
      <div className='text-sm text-slate-900 text-right'>{value}</div>
    </div>
  );
}

interface MiniStatProps {
  label: string;
  value: number;
  sub?: string;
  accent: MiniAccent;
  loading?: boolean;
  formatNum?: boolean;
}

function MiniStat({
  label,
  value,
  sub,
  accent,
  loading,
  formatNum,
}: MiniStatProps) {
  const textColors = {
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
    purple: 'text-purple-600',
    amber: 'text-amber-600',
  } as const;
  const glowColors = {
    indigo: 'bg-indigo-300',
    emerald: 'bg-emerald-300',
    rose: 'bg-rose-300',
    purple: 'bg-purple-300',
    amber: 'bg-amber-300',
  } as const;
  return (
    <Card className='relative overflow-hidden border-slate-200/80 shadow-[0_2px_14px_-6px_rgba(15,23,42,0.07)] hover:shadow-[0_10px_40px_-14px_rgba(15,23,42,0.15)] transition-shadow duration-500'>
      <div
        className={cn(
          'absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-35 blur-[28px]',
          glowColors[accent],
        )}
        aria-hidden
      />
      <CardContent className='p-3.5 md:p-4.5 relative'>
        <p className='text-[11px] md:text-xs font-bold text-slate-500 truncate uppercase tracking-[0.04em]'>
          {label}
        </p>
        {loading ? (
          <Skeleton className='mt-2 h-6 sm:h-7 w-16 rounded-xl' />
        ) : (
          <>
            <motion.p
              key={value}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className={`text-xl md:text-2xl font-black mt-2 ${textColors[accent]} tracking-tight`}
            >
              {formatNum ? formatNumber(value) : value}
            </motion.p>
            {sub && (
              <p className='text-[11px] md:text-xs text-slate-400 mt-1 font-semibold'>
                {sub}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
