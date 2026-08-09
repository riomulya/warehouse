import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PackagePlus,
  Search,
  RefreshCw,
  Trash2,
  Pin,
  PinOff,
  Package2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

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
import { Label } from '../components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import PageTransition from '../components/motion/PageTransition';
import {
  useToastSystem,
  ToastContainer,
  type ToastType,
} from '../components/motion/Toast';
import type { Product } from '../types';

const LOW_STOCK_THRESHOLD = 10;

export default function ProductsPage() {
  const navigate = useNavigate();
  const products = useAppStore((s) => s.products);
  const productsLoading = useAppStore((s) => s.productsLoading);
  const subscribeProducts = useAppStore((s) => s.subscribeProducts);
  const addProduct = useAppStore((s) => s.addProduct);
  const deleteProduct = useAppStore((s) => s.deleteProduct);
  const togglePin = useAppStore((s) => s.togglePin);

  const { toasts, show: showToast, dismiss } = useToastSystem();

  const [search, setSearch] = useState('');
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [initialStock, setInitialStock] = useState<string>('');
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [submittingDelete, setSubmittingDelete] = useState(false);

  useEffect(() => {
    subscribeProducts();
  }, [subscribeProducts]);

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
      return a.name.localeCompare(b.name, 'id-ID');
    });
    return list;
  }, [products, search]);

  const initialStockNum = Number(initialStock);
  const initialStockValid =
    initialStock === '' ||
    (Number.isInteger(initialStockNum) && initialStockNum >= 0);

  const isAddDisabled =
    submittingAdd || !sku.trim() || !name.trim() || !initialStockValid;

  const resetAddForm = () => {
    setSku('');
    setName('');
    setInitialStock('');
    setAddError(null);
  };

  const onAddSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddError(null);
    if (isAddDisabled) return;
    setSubmittingAdd(true);
    try {
      const stock = initialStock === '' ? 0 : initialStockNum;
      await addProduct(sku, name, stock);
      showToast({
        type: 'success',
        title: 'Barang Ditambahkan',
        message: `Barang "${name}" (${sku}) berhasil ditambahkan dengan stok awal ${formatNumber(stock)}.`,
        duration: 5000,
      });
      resetAddForm();
    } catch (err: any) {
      const msg = err?.message || 'Gagal menambahkan barang.';
      setAddError(msg);
      showToast({ type: 'error', message: msg });
    } finally {
      setSubmittingAdd(false);
    }
  };

  const openDeleteDialog = (p: Product) => {
    setDeleteTarget(p);
    setDeleteConfirmText('');
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    if (submittingDelete) return;
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
    setDeleteConfirmText('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget || submittingDelete) return;
    const expected = `HAPUS ${deleteTarget.id}`;
    if (deleteConfirmText.trim() !== expected) {
      showToast({
        type: 'error',
        message: `Ketikkan "${expected}" untuk konfirmasi penghapusan.`,
      });
      return;
    }
    setSubmittingDelete(true);
    try {
      await deleteProduct(deleteTarget.id);
      showToast({
        type: 'info',
        title: 'Barang Dihapus',
        message: `Barang "${deleteTarget.name}" (${deleteTarget.id}) telah dihapus.`,
        duration: 5000,
      });
      closeDeleteDialog();
    } catch (err: any) {
      const msg = err?.message || 'Gagal menghapus barang.';
      showToast({ type: 'error', message: msg });
    } finally {
      setSubmittingDelete(false);
    }
  };

  const handleTogglePin = async (p: Product) => {
    try {
      await togglePin(p.id);
      const toastType: ToastType = p.pinned ? 'info' : 'success';
      showToast({
        type: toastType,
        message: p.pinned
          ? `Pin dilepas untuk "${p.name}"`
          : `"${p.name}" disematkan di Dashboard`,
        duration: 3000,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err?.message || 'Gagal mengubah status pin.',
      });
    }
  };

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
    <PageTransition className='space-y-5 sm:space-y-6 lg:space-y-8'>
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
            className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100 text-[11px] font-bold uppercase tracking-[0.14em] mb-2.5'
          >
            <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />
            Master Data
          </motion.div>
          <h1 className='text-2xl sm:text-3xl lg:text-[2.15rem] font-extrabold text-slate-900 tracking-tight break-words leading-[1.15]'>
            Kelola Data Barang
          </h1>
          <p className='text-sm text-slate-500 mt-2 leading-relaxed'>
            Tambahkan barang baru, hapus barang, dan kelola daftar inventori
            gudang
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <Button
            onClick={() => navigate('/')}
            variant='outline'
            size='lg'
            className='w-full sm:w-auto self-start sm:self-auto border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm gap-2 text-[14px] font-bold'
          >
            <ArrowLeft className='w-[17px] h-[17px]' />
            Kembali ke Dashboard
          </Button>
        </motion.div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.45 }}
      >
        <Card className='overflow-hidden shadow-[0_2px_24px_-10px_rgba(16,185,129,0.12)] border-slate-200/80'>
          <CardHeader className='p-5 sm:p-6 lg:p-7 border-b border-slate-100/80 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30'>
            <CardTitle className='text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5'>
              <span className='w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100'>
                <PackagePlus className='w-4.5 h-4.5' />
              </span>
              Tambah Barang Baru
            </CardTitle>
            <CardDescription className='text-xs sm:text-sm mt-2 text-slate-500 leading-relaxed'>
              Isi detail barang di bawah ini untuk menambahkannya ke inventori
            </CardDescription>
          </CardHeader>
          <CardContent className='p-5 sm:p-6 lg:p-7'>
            <form onSubmit={onAddSubmit} className='space-y-4 sm:space-y-5'>
              <div className='grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5'>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.35 }}
                  className='md:col-span-3 space-y-2.5'
                >
                  <Label htmlFor='sku' className='text-[14px]'>
                    SKU / ID Barang <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='sku'
                    type='text'
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    disabled={submittingAdd}
                    placeholder='Contoh: BRG-001'
                    className='h-11 text-[14px] rounded-xl font-mono uppercase tracking-wide'
                    maxLength={40}
                  />
                  <p className='text-[11.5px] text-slate-400 font-medium leading-relaxed'>
                    Kode unik barang (tidak boleh sama)
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.35 }}
                  className='md:col-span-6 space-y-2.5'
                >
                  <Label htmlFor='name' className='text-[14px]'>
                    Nama Barang <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='name'
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submittingAdd}
                    placeholder='Contoh: Kertas A4 80gr'
                    className='h-11 text-[14px] rounded-xl'
                    maxLength={120}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.11, duration: 0.35 }}
                  className='md:col-span-3 space-y-2.5'
                >
                  <Label htmlFor='stock' className='text-[14px]'>
                    Stok Awal{' '}
                    <span className='text-slate-400 font-normal'>
                      (default 0)
                    </span>
                  </Label>
                  <Input
                    id='stock'
                    type='number'
                    min={0}
                    step={1}
                    inputMode='numeric'
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value)}
                    disabled={submittingAdd}
                    placeholder='0'
                    className={cn(
                      'h-11 text-[14px] rounded-xl',
                      initialStock &&
                        !initialStockValid &&
                        'border-rose-400 bg-rose-50/50 focus:border-rose-500',
                    )}
                  />
                  {initialStock && !initialStockValid && (
                    <p className='text-[11.5px] text-rose-600 font-semibold'>
                      Harus angka bulat ≥ 0
                    </p>
                  )}
                </motion.div>
              </div>

              <AnimatePresence>
                {addError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className='flex items-start gap-2.5 p-3.5 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-800 text-sm'
                  >
                    <AlertTriangle className='w-[18px] h-[18px] text-rose-600 flex-shrink-0 mt-0.5' />
                    <div>
                      <p className='font-bold'>Gagal menambahkan barang</p>
                      <p className='text-[13px] mt-0.5 leading-relaxed text-rose-700'>
                        {addError}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-1'>
                <Button
                  type='button'
                  onClick={resetAddForm}
                  disabled={submittingAdd}
                  variant='outline'
                  size='lg'
                  className='border-slate-200 bg-white hover:bg-slate-50 text-[14px] font-bold shadow-sm'
                >
                  Reset
                </Button>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className='w-full sm:w-auto'
                >
                  <Button
                    type='submit'
                    disabled={isAddDisabled}
                    size='lg'
                    variant='success'
                    className='w-full sm:w-auto text-[14px] font-bold gap-2.5 px-7 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35'
                  >
                    {submittingAdd ? (
                      <>
                        <Loader2 className='w-[18px] h-[18px] animate-spin' />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <PackagePlus className='w-[18px] h-[18px]' />
                        Tambahkan Barang
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className='overflow-hidden shadow-[0_2px_20px_-6px_rgba(15,23,42,0.08)] border-slate-200/80'>
          <CardHeader className='p-4 sm:p-5 lg:p-6 flex flex-col gap-3.5 sm:gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-slate-100/80'>
            <div className='min-w-0 flex-1'>
              <CardTitle className='text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2.5'>
                <span className='w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center ring-1 ring-indigo-100'>
                  <Package2 className='w-[18px] h-[18px]' />
                </span>
                Daftar Semua Barang{' '}
                <Badge variant='outline' className='ml-1 text-[11px] font-bold'>
                  {products.length} item
                </Badge>
              </CardTitle>
              <CardDescription className='text-xs sm:text-sm mt-2 text-slate-500 leading-relaxed'>
                Pin barang penting untuk muncul paling atas di Dashboard
              </CardDescription>
            </div>
            <div className='relative w-full sm:w-80 flex-shrink-0 group'>
              <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors duration-300' />
              <Input
                type='search'
                placeholder='Cari SKU / nama barang...'
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
            <Table className='min-w-[720px]'>
              <TableHeader className='sticky top-0 bg-white/90 backdrop-blur-md'>
                <TableRow className='hover:bg-transparent border-b border-slate-100'>
                  <TableHead className='w-[56px] px-3 sm:px-5 py-3.5 text-center'>
                    Pin
                  </TableHead>
                  <TableHead className='text-left px-3 sm:px-5 py-3.5 w-[18%]'>
                    SKU
                  </TableHead>
                  <TableHead className='text-left px-3 sm:px-5 py-3.5'>
                    Nama Barang
                  </TableHead>
                  <TableHead className='text-right px-3 sm:px-5 py-3.5 pr-3 sm:pr-6 w-[18%]'>
                    Sisa Stok
                  </TableHead>
                  <TableHead className='text-right px-3 sm:px-5 py-3.5 pr-4 sm:pr-6 w-[120px]'>
                    Aksi
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
                      <TableCell className='px-3 sm:px-5 py-4 text-right'>
                        <Skeleton className='h-9 w-9 ml-auto rounded-lg' />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <TableRow className='hover:bg-transparent'>
                    <TableCell
                      colSpan={5}
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
                            Tambahkan barang melalui form di atas
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
                            'bg-gradient-to-r from-indigo-50/60 via-transparent to-transparent',
                        )}
                      >
                        <TableCell className='px-3 sm:px-5 py-3.5 sm:py-4 text-center'>
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleTogglePin(p)}
                            className={cn(
                              'p-2 rounded-lg transition-all duration-200',
                              p.pinned
                                ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200 hover:bg-amber-100'
                                : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50',
                            )}
                            title={p.pinned ? 'Lepas pin' : 'Sematkan / pin'}
                          >
                            {p.pinned ? (
                              <Pin className='w-4 h-4 fill-amber-400' />
                            ) : (
                              <PinOff className='w-4 h-4' />
                            )}
                          </motion.button>
                        </TableCell>
                        <TableCell className='px-3 sm:px-5 py-3.5 sm:py-4 whitespace-nowrap'>
                          <code className='text-[11px] sm:text-xs font-mono text-slate-600 bg-slate-100/80 group-hover:bg-slate-100 px-2.5 py-1.5 rounded-lg ring-1 ring-slate-200/70 inline-block'>
                            {p.id}
                          </code>
                        </TableCell>
                        <TableCell className='px-3 sm:px-5 py-3.5 sm:py-4'>
                          <div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3.5'>
                            <span className='font-bold text-slate-900 leading-snug break-words text-[14.5px]'>
                              {p.name}
                            </span>
                            <div className='flex items-center gap-2 flex-wrap'>
                              {p.pinned && (
                                <Badge
                                  variant='outline'
                                  className='text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 border-amber-200 bg-amber-50 text-amber-700'
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
                        <TableCell className='px-3 sm:px-5 py-3.5 sm:py-4 text-right whitespace-nowrap'>
                          <span
                            className={cn(
                              'inline-flex items-center px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-sm sm:text-[15px] font-extrabold ring-1 ring-inset',
                              state.cls,
                            )}
                          >
                            {formatNumber(p.current_stock)}
                          </span>
                        </TableCell>
                        <TableCell className='px-3 sm:px-5 py-3.5 sm:py-4 text-right whitespace-nowrap'>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => openDeleteDialog(p)}
                            className='p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors duration-200 group/btn'
                            title='Hapus barang'
                          >
                            <Trash2 className='w-[18px] h-[18px]' />
                          </motion.button>
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
              <span className='font-medium'>
                Menampilkan{' '}
                <strong className='text-slate-700 text-[12.5px]'>
                  {filteredProducts.length}
                </strong>{' '}
                dari{' '}
                <strong className='text-slate-700 text-[12.5px]'>
                  {products.length}
                </strong>{' '}
                item barang
              </span>
            </div>
          )}
        </Card>
      </motion.section>

      <Dialog open={deleteDialogOpen} onOpenChange={closeDeleteDialog}>
        <DialogContent open={deleteDialogOpen}>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2.5'>
              <span className='w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center ring-1 ring-rose-200'>
                <Trash2 className='w-[18px] h-[18px]' />
              </span>
              Hapus Barang
            </DialogTitle>
            <DialogDescription className='mt-2 text-[13px] leading-relaxed text-slate-600'>
              Tindakan ini tidak dapat dibatalkan. Barang akan dihapus dari
              inventori secara permanen.
            </DialogDescription>
          </DialogHeader>
          <div className='px-6 space-y-4 py-2'>
            {deleteTarget && (
              <div className='p-4 rounded-xl border border-rose-200 bg-rose-50/60'>
                <div className='flex items-start gap-3'>
                  <div className='w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0'>
                    <AlertTriangle className='w-5 h-5' />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-sm font-bold text-rose-900'>
                      {deleteTarget.name}
                    </p>
                    <p className='text-[12px] text-rose-700 mt-0.5 font-mono'>
                      SKU: {deleteTarget.id}
                    </p>
                    <p className='text-[12.5px] text-rose-800/90 mt-2 leading-relaxed'>
                      Stok saat ini:{' '}
                      <strong>
                        {formatNumber(deleteTarget.current_stock)}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className='space-y-2.5'>
              <Label className='text-[14px]'>Konfirmasi Penghapusan</Label>
              <p className='text-[12.5px] text-slate-600 leading-relaxed'>
                Untuk melanjutkan, ketikkan teks berikut:{' '}
                <code className='font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-mono text-[12px]'>
                  {deleteTarget ? `HAPUS ${deleteTarget.id}` : ''}
                </code>
              </p>
              <Input
                type='text'
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='Ketikkan teks konfirmasi...'
                disabled={submittingDelete}
                className='h-11 rounded-xl font-mono text-[13px]'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={closeDeleteDialog}
              disabled={submittingDelete}
              className='text-[14px] font-bold'
            >
              Batal
            </Button>
            <Button
              type='button'
              variant='danger'
              onClick={confirmDelete}
              disabled={
                submittingDelete ||
                !deleteTarget ||
                deleteConfirmText.trim() !== `HAPUS ${deleteTarget?.id}`
              }
              className='text-[14px] font-bold gap-2.5 shadow-lg shadow-rose-500/25'
            >
              {submittingDelete ? (
                <>
                  <Loader2 className='w-[17px] h-[17px] animate-spin' />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className='w-[17px] h-[17px]' />
                  Hapus Permanen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
