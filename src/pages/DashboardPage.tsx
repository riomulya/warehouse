import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Pin,
  PinOff,
  Star,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { formatNumber, cn } from '../utils';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Skeleton } from '../components/ui/skeleton';
import PageTransition from '../components/motion/PageTransition';
import {
  StaggerContainer,
  StaggerItem,
} from '../components/motion/StaggerContainer';
import AnimatedCard from '../components/motion/AnimatedCard';
import {
  useToastSystem,
  ToastContainer,
  type ToastType,
} from '../components/motion/Toast';

const LOW_STOCK_THRESHOLD = 10;

type AccentColor = 'indigo' | 'emerald' | 'amber' | 'rose';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const products = useAppStore((s) => s.products);
  const productsLoading = useAppStore((s) => s.productsLoading);
  const subscribeProducts = useAppStore((s) => s.subscribeProducts);
  const togglePin = useAppStore((s) => s.togglePin);

  const { toasts, show: showToast, dismiss } = useToastSystem();

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'name' | 'stock'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    subscribeProducts();
  }, [subscribeProducts]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce(
      (sum, p) => sum + (p.current_stock || 0),
      0,
    );
    const lowStockCount = products.filter(
      (p) => p.current_stock > 0 && p.current_stock <= LOW_STOCK_THRESHOLD,
    ).length;
    const outOfStockCount = products.filter((p) => p.current_stock <= 0).length;
    return { totalProducts, totalStock, lowStockCount, outOfStockCount };
  }, [products]);

  const pinnedProducts = useMemo(() => {
    return products.filter((p) => p.pinned);
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      if (!!b.pinned !== !!a.pinned)
        return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      const cmp =
        sortKey === 'name'
          ? a.name.localeCompare(b.name, 'id-ID')
          : a.current_stock - b.current_stock;
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [products, search, sortKey, sortAsc]);

  const handleTogglePin = async (p: {
    id: string;
    name: string;
    pinned?: boolean;
  }) => {
    try {
      await togglePin(p.id);
      const toastType: ToastType = p.pinned ? 'info' : 'success';
      showToast({
        type: toastType,
        message: p.pinned
          ? `Pin dilepas untuk "${p.name}"`
          : `"${p.name}" disematkan di bagian atas Dashboard`,
        duration: 3500,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err?.message || 'Gagal mengubah status pin.',
      });
    }
  };

  const toggleSort = (key: 'name' | 'stock') => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const statConfig = [
    {
      label: 'Total Item',
      value: stats.totalProducts,
      icon: Package2,
      accent: 'indigo' as AccentColor,
      loading: productsLoading,
      suffix: '',
      format: false,
    },
    {
      label: 'Total Stok',
      value: stats.totalStock,
      icon: TrendingUp,
      accent: 'emerald' as AccentColor,
      loading: productsLoading,
      suffix: '',
      format: true,
    },
    {
      label: 'Stok Menipis',
      value: stats.lowStockCount,
      icon: ArrowUpDown,
      accent: 'amber' as AccentColor,
      loading: productsLoading,
      suffix: stats.lowStockCount ? `≤${LOW_STOCK_THRESHOLD}` : '',
      format: false,
    },
    {
      label: 'Stok Habis',
      value: stats.outOfStockCount,
      icon: TrendingDown,
      accent: 'rose' as AccentColor,
      loading: productsLoading,
      suffix: '',
      format: false,
    },
  ];

  const tableRowVariants: any = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: Math.min(i * 0.02, 0.3),
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1] as any,
      },
    }),
  };

  return (
    <PageTransition className='space-y-5 sm:space-y-6 lg:space-y-8 relative'>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className='flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between'
      >
        <div className='min-w-0'>
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
            className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100 text-[11px] font-bold uppercase tracking-[0.14em] mb-2.5'
          >
            <span className='w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse' />
            Overview
          </motion.div>
          <h1 className='text-2xl sm:text-3xl lg:text-[2.15rem] font-extrabold text-slate-900 tracking-tight break-words leading-[1.15]'>
            Dashboard Stok Barang
          </h1>
          <p className='text-sm text-slate-500 mt-2 leading-relaxed'>
            Selamat datang,{' '}
            <span className='font-bold text-slate-700'>
              {user?.name ?? 'User'}
            </span>
            <span className='text-slate-400 mx-1.5'>•</span>
            <span>Kelola inventori gudang dengan mudah dan real-time</span>
          </p>
        </div>
        {user?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <Button
              asChild
              size='lg'
              variant='gradient'
              className='w-full sm:w-auto shadow-[0_14px_30px_-12px_rgba(99,102,241,0.55)] px-6 gap-2.5 text-[14px] font-bold'
            >
              <Link to='/input-transaction' className='gap-2.5'>
                <ArrowLeftRight className='w-[18px] h-[18px]' />
                Input Transaksi Baru
              </Link>
            </Button>
          </motion.div>
        )}
      </motion.header>

      <StaggerContainer
        className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'
        delay={0.05}
      >
        {statConfig.map((stat) => (
          <StaggerItem key={stat.label}>
            <AnimatedCard
              tiltAmount={4}
              glowColor={
                stat.accent === 'indigo'
                  ? '99, 102, 241'
                  : stat.accent === 'emerald'
                    ? '16, 185, 129'
                    : stat.accent === 'amber'
                      ? '245, 158, 11'
                      : '244, 63, 94'
              }
            >
              <StatCard {...stat} />
            </AnimatedCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <AnimatePresence>
        {!productsLoading && pinnedProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ delay: 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className='relative'
          >
            <Card className='overflow-hidden border-amber-200/80 shadow-[0_8px_40px_-16px_rgba(245,158,11,0.25)] bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40'>
              <div
                className='absolute inset-0 pointer-events-none opacity-40'
                aria-hidden
              >
                <div className='absolute top-0 right-0 w-60 h-60 bg-amber-200/50 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4' />
              </div>
              <CardHeader className='p-4 sm:p-5 lg:p-6 relative flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-amber-100/80'>
                <div className='min-w-0 flex-1'>
                  <CardTitle className='text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5 flex-wrap'>
                    <span className='w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 ring-1 ring-amber-500/20'>
                      <Star className='w-[18px] h-[18px] fill-white' />
                    </span>
                    Barang Disematkan (Pinned)
                    <Badge
                      variant='outline'
                      className='ml-1 text-[11px] font-extrabold border-amber-300 bg-white/80 text-amber-700 shadow-sm'
                    >
                      <Sparkles className='w-3 h-3 mr-1 text-amber-500' />
                      {pinnedProducts.length} item
                    </Badge>
                  </CardTitle>
                  <CardDescription className='text-xs sm:text-sm mt-2 text-amber-800/80 leading-relaxed'>
                    Barang penting yang Anda sematkan — ditampilkan di paling
                    atas
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className='p-3 sm:p-4 lg:p-5 relative'>
                <StaggerContainer
                  className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-3.5'
                  delay={0.03}
                >
                  {pinnedProducts.map((p) => {
                    const state =
                      p.current_stock <= 0
                        ? {
                            label: 'Habis',
                            variant: 'rose' as const,
                            cls: 'bg-rose-50 text-rose-700 ring-rose-200',
                            dot: 'bg-rose-500',
                          }
                        : p.current_stock <= LOW_STOCK_THRESHOLD
                          ? {
                              label: 'Menipis',
                              variant: 'amber' as const,
                              cls: 'bg-amber-50 text-amber-700 ring-amber-200',
                              dot: 'bg-amber-500',
                            }
                          : {
                              label: 'Aman',
                              variant: 'emerald' as const,
                              cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                              dot: 'bg-emerald-500',
                            };
                    return (
                      <StaggerItem key={p.id}>
                        <motion.div
                          whileHover={{ y: -2, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          transition={{
                            type: 'spring',
                            stiffness: 350,
                            damping: 25,
                          }}
                          className='group relative p-3.5 sm:p-4 rounded-2xl border border-amber-100/90 bg-white/80 backdrop-blur-sm hover:shadow-[0_10px_30px_-12px_rgba(245,158,11,0.35)] hover:border-amber-200 transition-all duration-300 overflow-hidden'
                        >
                          <div className='absolute top-2.5 right-2.5 flex items-center gap-1'>
                            <motion.button
                              whileHover={{ scale: 1.15, rotate: -8 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleTogglePin(p)}
                              className='p-1.5 rounded-lg bg-amber-50 text-amber-600 ring-1 ring-amber-200 hover:bg-amber-100 transition-colors'
                              title='Lepas pin'
                            >
                              <Pin className='w-3.5 h-3.5 fill-amber-400' />
                            </motion.button>
                          </div>
                          <div className='flex items-start gap-3 pr-8'>
                            <div
                              className={cn(
                                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-inset shadow-sm',
                                p.current_stock <= 0
                                  ? 'bg-rose-50 text-rose-600 ring-rose-200'
                                  : p.current_stock <= LOW_STOCK_THRESHOLD
                                    ? 'bg-amber-50 text-amber-600 ring-amber-200'
                                    : 'bg-emerald-50 text-emerald-600 ring-emerald-200',
                              )}
                            >
                              <Package2 className='w-4.5 h-4.5' />
                            </div>
                            <div className='min-w-0 flex-1'>
                              <p className='text-[13.5px] font-extrabold text-slate-900 leading-snug break-words line-clamp-2'>
                                {p.name}
                              </p>
                              <p className='text-[11px] font-mono text-slate-500 mt-1 bg-slate-100/80 inline-block px-1.5 py-0.5 rounded border border-slate-200'>
                                {p.id}
                              </p>
                            </div>
                          </div>
                          <div className='flex items-end justify-between mt-3.5 pt-3 border-t border-dashed border-amber-100'>
                            <div>
                              <p className='text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1'>
                                Sisa Stok
                              </p>
                              <motion.span
                                key={p.current_stock}
                                initial={{ scale: 0.9, opacity: 0.6 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                  type: 'spring',
                                  stiffness: 300,
                                  damping: 22,
                                }}
                                className={cn(
                                  'inline-flex items-center px-2.5 py-1 rounded-xl text-[14px] font-black ring-1 ring-inset',
                                  state.cls,
                                )}
                              >
                                {formatNumber(p.current_stock)}
                              </motion.span>
                            </div>
                            <Badge
                              variant={state.variant}
                              className='text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5'
                            >
                              <span
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse',
                                  state.dot,
                                )}
                              />
                              {state.label}
                            </Badge>
                          </div>
                        </motion.div>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              </CardContent>
            </Card>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className='overflow-hidden shadow-[0_2px_20px_-6px_rgba(15,23,42,0.08)] border-slate-200/80'>
          <CardHeader className='p-4 sm:p-5 lg:p-6 flex flex-col gap-3.5 sm:gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100/80'>
            <div className='min-w-0 flex-1'>
              <CardTitle className='text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5'>
                <span className='w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center ring-1 ring-indigo-100'>
                  <Package2 className='w-[18px] h-[18px]' />
                </span>
                Daftar Stok Barang
              </CardTitle>
              <CardDescription className='text-xs sm:text-sm mt-2 text-slate-500 leading-relaxed'>
                Diperbarui secara real-time • klik ikon pin untuk sematkan
                barang di atas
              </CardDescription>
            </div>
            <div className='relative w-full sm:w-80 flex-shrink-0 group'>
              <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors duration-300' />
              <Input
                type='search'
                placeholder='Cari nama / SKU...'
                inputMode='search'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='h-11 pl-10 pr-10 text-[14px] rounded-xl bg-slate-50/80 hover:bg-white focus:bg-white border-slate-200 hover:border-indigo-200 transition-all duration-200'
              />
              {search && (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSearch('')}
                  className='absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors'
                  aria-label='Bersihkan pencarian'
                >
                  <RefreshCw className='w-3.5 h-3.5' />
                </motion.button>
              )}
            </div>
          </CardHeader>

          <div className='overflow-x-auto'>
            <Table className='min-w-[700px]'>
              <TableHeader className='sticky top-0 bg-white/90 backdrop-blur-md'>
                <TableRow className='hover:bg-transparent border-b border-slate-100'>
                  <TableHead className='w-[56px] px-3 sm:px-5 py-3.5 text-center'>
                    <span
                      className='inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-600'
                      title='Sematkan barang'
                    >
                      <Pin className='w-3.5 h-3.5' />
                    </span>
                  </TableHead>
                  <TableHead className='text-left px-3 sm:px-5 py-3.5 w-[18%]'>
                    <button
                      onClick={() => toggleSort('name')}
                      className='flex items-center gap-1.5 hover:text-slate-900 transition-colors duration-200 group'
                    >
                      SKU
                      <SortIndicator
                        active={sortKey === 'name'}
                        asc={sortAsc}
                      />
                    </button>
                  </TableHead>
                  <TableHead className='text-left px-3 sm:px-5 py-3.5'>
                    <button
                      onClick={() => toggleSort('name')}
                      className='flex items-center gap-1.5 hover:text-slate-900 transition-colors duration-200 whitespace-nowrap group'
                    >
                      Nama Barang
                      <SortIndicator
                        active={sortKey === 'name'}
                        asc={sortAsc}
                      />
                    </button>
                  </TableHead>
                  <TableHead className='text-right px-3 sm:px-5 py-3.5 pr-4 sm:pr-6 w-[20%]'>
                    <button
                      onClick={() => toggleSort('stock')}
                      className='inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors duration-200 whitespace-nowrap group ml-auto'
                    >
                      Sisa Stok
                      <SortIndicator
                        active={sortKey === 'stock'}
                        asc={sortAsc}
                      />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow
                      key={i}
                      aria-hidden
                      className='hover:bg-transparent'
                    >
                      <TableCell className='px-3 sm:px-5 py-4 text-center'>
                        <Skeleton className='h-8 w-8 mx-auto rounded-lg' />
                      </TableCell>
                      <TableCell className='px-3 sm:px-5 py-4'>
                        <Skeleton className='h-4 w-20 sm:w-24' />
                      </TableCell>
                      <TableCell className='px-3 sm:px-5 py-4'>
                        <Skeleton className='h-4 w-40 sm:w-56' />
                      </TableCell>
                      <TableCell className='px-3 sm:px-5 py-4 text-right'>
                        <Skeleton className='h-7 w-14 sm:w-16 rounded-lg ml-auto' />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <TableRow className='hover:bg-transparent'>
                    <TableCell
                      colSpan={4}
                      className='px-4 sm:px-6 py-14 sm:py-18'
                    >
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
                          <Package2 className='w-8 h-8 opacity-50 text-slate-400' />
                        </motion.div>
                        <p className='text-sm font-bold text-slate-600 mb-1.5'>
                          {search
                            ? 'Barang tidak ditemukan'
                            : 'Belum ada data barang'}
                        </p>
                        {search ? (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => setSearch('')}
                            className='text-xs text-indigo-600 font-bold hover:text-indigo-700 hover:bg-indigo-50 mt-1 h-auto py-1.5'
                          >
                            Bersihkan pencarian
                          </Button>
                        ) : (
                          <p className='text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed'>
                            Tambahkan barang melalui Input Transaksi atau import
                            ke Realtime Database
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((p, i) => {
                    const state =
                      p.current_stock <= 0
                        ? {
                            label: 'Habis',
                            variant: 'rose' as const,
                            cls: 'bg-rose-50 text-rose-700 ring-rose-200',
                          }
                        : p.current_stock <= LOW_STOCK_THRESHOLD
                          ? {
                              label: 'Menipis',
                              variant: 'amber' as const,
                              cls: 'bg-amber-50 text-amber-700 ring-amber-200',
                            }
                          : {
                              label: 'Aman',
                              variant: 'emerald' as const,
                              cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                            };
                    return (
                      <motion.tr
                        key={p.id}
                        custom={i}
                        variants={tableRowVariants}
                        initial='hidden'
                        animate='visible'
                        whileHover={{
                          backgroundColor: p.pinned
                            ? 'rgba(99, 102, 241, 0.04)'
                            : 'rgba(248, 250, 252, 0.9)',
                        }}
                        className={cn(
                          'group border-b border-slate-100 transition-colors',
                          p.pinned &&
                            'bg-gradient-to-r from-amber-50/50 via-transparent to-transparent',
                        )}
                      >
                        <TableCell className='px-3 sm:px-5 py-3.5 sm:py-4 text-center whitespace-nowrap'>
                          <motion.button
                            whileHover={{
                              scale: 1.2,
                              rotate: p.pinned ? 8 : -8,
                            }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleTogglePin(p)}
                            className={cn(
                              'p-2 rounded-lg transition-all duration-200',
                              p.pinned
                                ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200 hover:bg-amber-100 shadow-sm shadow-amber-500/10'
                                : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50/80',
                            )}
                            title={p.pinned ? 'Lepas pin' : 'Sematkan barang'}
                          >
                            {p.pinned ? (
                              <Pin className='w-4 h-4 fill-amber-400' />
                            ) : (
                              <PinOff className='w-4 h-4' />
                            )}
                          </motion.button>
                        </TableCell>
                        <TableCell className='px-3 sm:px-5 py-3.5 sm:py-4 whitespace-nowrap'>
                          <motion.code
                            whileHover={{ scale: 1.03 }}
                            className='text-[11px] sm:text-xs font-mono text-slate-600 bg-slate-100/80 group-hover:bg-slate-100 px-2.5 py-1.5 rounded-lg ring-1 ring-slate-200/70 inline-block transition-colors duration-200'
                          >
                            {p.id}
                          </motion.code>
                        </TableCell>
                        <TableCell className='px-3 sm:px-5 py-3.5 sm:py-4'>
                          <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3.5'>
                            <motion.span
                              whileHover={{ x: 2 }}
                              className='font-bold text-slate-900 leading-snug break-words text-[14.5px]'
                            >
                              {p.name}
                            </motion.span>
                            <div className='flex items-center gap-2 flex-wrap'>
                              {p.pinned && (
                                <Badge
                                  variant='outline'
                                  className='text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 border-amber-200 bg-amber-50 text-amber-700 shadow-sm'
                                >
                                  <Pin className='w-3 h-3 mr-1 fill-amber-400' />
                                  Pinned
                                </Badge>
                              )}
                              <Badge
                                variant={state.variant}
                                className='text-[10px] font-extrabold uppercase tracking-[0.1em] px-2.5 py-1 w-fit'
                              >
                                {state.label}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='px-3 sm:px-5 py-3.5 sm:py-4 text-right whitespace-nowrap pr-4 sm:pr-6'>
                          <motion.span
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: Math.min(i * 0.015, 0.2),
                              type: 'spring',
                              stiffness: 300,
                              damping: 24,
                            }}
                            className={cn(
                              'inline-flex items-center px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-sm sm:text-[15px] font-extrabold ring-1 ring-inset',
                              state.cls,
                            )}
                          >
                            {formatNumber(p.current_stock)}
                          </motion.span>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {!productsLoading && filteredProducts.length > 0 && (
            <div className='px-4 sm:px-6 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] sm:text-xs text-slate-500 bg-slate-50/70'>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className='font-medium'
              >
                Menampilkan{' '}
                <strong className='text-slate-700 text-[12.5px]'>
                  {filteredProducts.length}
                </strong>{' '}
                dari{' '}
                <strong className='text-slate-700 text-[12.5px]'>
                  {products.length}
                </strong>{' '}
                item barang
              </motion.span>
              <span>
                {search && (
                  <span className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 text-[11px] font-bold'>
                    · Hasil terfilter
                  </span>
                )}
              </span>
            </div>
          )}
        </Card>
      </motion.section>
    </PageTransition>
  );
}

function SortIndicator({ active, asc }: { active: boolean; asc: boolean }) {
  if (!active) {
    return (
      <RefreshCw className='w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity' />
    );
  }
  return asc ? (
    <ArrowDownAZ className='w-3.5 h-3.5 text-indigo-500' strokeWidth={2.5} />
  ) : (
    <ArrowUpAZ className='w-3.5 h-3.5 text-indigo-500' strokeWidth={2.5} />
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  accent: AccentColor;
  loading?: boolean;
  format?: boolean;
  suffix?: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  loading,
  format: fmt,
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
  const glowColors = {
    indigo: 'bg-indigo-300',
    emerald: 'bg-emerald-300',
    amber: 'bg-amber-300',
    rose: 'bg-rose-300',
  } as const;

  return (
    <Card className='relative overflow-hidden border-slate-200/80 shadow-[0_2px_14px_-6px_rgba(15,23,42,0.07)] hover:shadow-[0_10px_40px_-14px_rgba(15,23,42,0.15)] transition-shadow duration-500'>
      <div
        className={cn(
          'absolute -top-10 -right-10 w-28 h-28 rounded-full opacity-40 blur-[30px]',
          glowColors[accent],
        )}
        aria-hidden
      />
      <CardContent className='p-4 sm:p-5 lg:p-5.5'>
        <div className='relative flex items-start justify-between gap-2.5'>
          <div className='min-w-0 flex-1'>
            <p className='text-[11px] sm:text-xs font-bold text-slate-500 truncate uppercase tracking-[0.04em]'>
              {label}
            </p>
            {loading ? (
              <Skeleton className='mt-2.5 h-8 sm:h-9 w-16 sm:w-20 rounded-xl' />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className='mt-2 flex items-baseline gap-1.5 min-w-0'
              >
                <motion.span
                  key={value}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                  className={cn(
                    'text-xl sm:text-2xl lg:text-3xl font-black tracking-tight truncate',
                    textColors[accent],
                  )}
                >
                  {fmt ? formatNumber(value) : value}
                </motion.span>
                {suffix && (
                  <span className='text-[10px] sm:text-xs text-slate-400 font-semibold flex-shrink-0'>
                    {suffix}
                  </span>
                )}
              </motion.div>
            )}
          </div>
          <motion.div
            whileHover={{ scale: 1.1, rotate: -6 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={cn(
              'p-2.5 sm:p-3 rounded-xl ring-1 ring-inset flex-shrink-0 shadow-sm',
              accents[accent],
            )}
          >
            <Icon
              className='w-[19px] h-[19px] sm:w-5 sm:h-5'
              strokeWidth={2.2}
            />
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
