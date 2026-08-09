import React, {
  useEffect,
  useState,
  type FormEvent,
  useMemo,
  useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  PackageSearch,
  Loader2,
  ArrowLeft,
  Search,
  ChevronDown,
  Check,
  X,
  Package2,
  Pin,
} from 'lucide-react';
import { ref, update, push, serverTimestamp, get } from 'firebase/database';
import { db } from '../services/firebase';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import type { TransactionType, Product } from '../types';
import { cn, formatNumber } from '../utils';
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

import { Textarea } from '../components/ui/textarea';
import { Skeleton } from '../components/ui/skeleton';
import {
  Alert as UIAlert,
  AlertDescription,
  AlertTitle,
} from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import PageTransition from '../components/motion/PageTransition';
import { StaggerItem } from '../components/motion/StaggerContainer';
import {
  useToastSystem,
  ToastContainer,
  type ToastType,
} from '../components/motion/Toast';

export default function InputTransactionPage() {
  const user = useAuthStore((s) => s.user);
  const products = useAppStore((s) => s.products);
  const productsLoading = useAppStore((s) => s.productsLoading);
  const subscribeProducts = useAppStore((s) => s.subscribeProducts);

  const navigate = useNavigate();
  const { toasts, show: showToast, dismiss } = useToastSystem();

  const [type, setType] = useState<TransactionType>('IN');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [productSearch, setProductSearch] = useState('');
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const productPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    subscribeProducts();
  }, [subscribeProducts]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        productPickerRef.current &&
        !productPickerRef.current.contains(e.target as Node)
      ) {
        setProductPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );

  const filteredProductsForPicker = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    let list = [...products];
    if (q) {
      list = list.filter((p) => {
        const id = p.id.toLowerCase();
        const name = p.name.toLowerCase();
        const stock = String(p.current_stock);
        return (
          id.includes(q) ||
          name.includes(q) ||
          stock.includes(q) ||
          p.name.split(/\s+/).some((w) => w.toLowerCase().startsWith(q))
        );
      });
    }
    list.sort((a, b) => {
      if (!!b.pinned !== !!a.pinned)
        return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      return a.name.localeCompare(b.name, 'id-ID');
    });
    return list.slice(0, 50);
  }, [products, productSearch]);

  const selectProductFromPicker = (p: Product) => {
    setProductId(p.id);
    setProductSearch('');
    setProductPickerOpen(false);
  };

  const openPicker = () => {
    setProductSearch('');
    setProductPickerOpen(true);
  };

  const clearProductSelection = () => {
    setProductId('');
    setProductSearch('');
    setProductPickerOpen(false);
  };

  const qtyNum = Number(qty);
  const qtyValid = Number.isInteger(qtyNum) && qtyNum > 0;

  const stockError = useMemo(() => {
    if (type !== 'OUT' || !selectedProduct || !qtyValid) return null;
    if (qtyNum > selectedProduct.current_stock) {
      return `Stok tidak mencukupi. Sisa stok saat ini: ${formatNumber(
        selectedProduct.current_stock,
      )}`;
    }
    return null;
  }, [type, selectedProduct, qtyValid, qtyNum]);

  const isSubmitDisabled =
    submitting || !productId || !qtyValid || !!stockError || !user;

  const resetForm = () => {
    setType('IN');
    setProductId('');
    setQty('');
    setNotes('');
    setFormError(null);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    if (isSubmitDisabled || !user) return;
    if (!selectedProduct) {
      setFormError('Pilih barang terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const stockRef = ref(db, `products/${selectedProduct.id}/current_stock`);
      const stockSnapshot = await get(stockRef);
      const currentStock: number = (stockSnapshot.val() as number) || 0;

      if (type === 'OUT' && currentStock < qtyNum) {
        setSubmitting(false);
        const msg = `Stok real-time tidak mencukupi. Sisa stok terbaru: ${formatNumber(
          currentStock,
        )}`;
        setFormError(msg);
        showToast({ type: 'error', message: msg });
        return;
      }

      const newStock =
        type === 'IN' ? currentStock + qtyNum : currentStock - qtyNum;
      const newTxRef = push(ref(db, 'transactions'));
      const txId = newTxRef.key as string;

      const updates: Record<string, any> = {
        [`products/${selectedProduct.id}/current_stock`]: newStock,
        [`products/${selectedProduct.id}/updated_at`]: serverTimestamp(),
        [`transactions/${txId}`]: {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          type,
          qty: qtyNum,
          created_at: serverTimestamp(),
          created_by: user.uid,
          created_by_name: user.name,
          notes: notes.trim() || null,
        },
      };

      await update(ref(db), updates);

      const toastType: ToastType = type === 'IN' ? 'success' : 'info';
      showToast({
        type: toastType,
        title: 'Transaksi Tersimpan',
        message: `Transaksi ${
          type === 'IN' ? 'Barang Masuk' : 'Barang Keluar'
        } berhasil dicatat.`,
        duration: 5000,
      });
      resetForm();
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Terjadi kesalahan saat menyimpan transaksi.';
      setFormError(msg);
      showToast({ type: 'error', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const typeButtons = [
    {
      type: 'IN' as TransactionType,
      color: 'emerald' as const,
      icon: ArrowDownToLine,
      title: 'Barang Masuk',
      subtitle: 'Tambah stok',
    },
    {
      type: 'OUT' as TransactionType,
      color: 'rose' as const,
      icon: ArrowUpFromLine,
      title: 'Barang Keluar',
      subtitle: 'Kurangi stok',
    },
  ];

  const steps = [
    [
      'Pilih jenis transaksi',
      'Barang Masuk untuk menambah, Barang Keluar untuk mengurangi stok',
    ],
    [
      'Pilih barang',
      'Pastikan barang sudah terdaftar di database. Bisa cari via SKU.',
    ],
    [
      'Isi kuantitas',
      'Untuk transaksi keluar, Qty tidak boleh melebihi sisa stok.',
    ],
    ['Tambah keterangan', 'Opsional, mempermudah tracking riwayat.'],
  ];

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
            Transaksi
          </motion.div>
          <h1 className='text-2xl sm:text-3xl lg:text-[2.15rem] font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5 min-w-0 break-words leading-[1.15]'>
            <motion.span
              whileHover={{ scale: 1.06, rotate: -3 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className='w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-100 via-purple-100 to-indigo-100 text-indigo-600 flex items-center justify-center ring-1 ring-indigo-200 flex-shrink-0 shadow-md shadow-indigo-100/80'
            >
              <ArrowLeftRight
                className='w-5 h-5 sm:w-[22px] sm:h-[22px]'
                strokeWidth={2.2}
              />
            </motion.span>
            <span className='min-w-0'>Input Transaksi Barang</span>
          </h1>
          <p className='text-sm text-slate-500 mt-2 leading-relaxed'>
            Catat pergerakan barang masuk atau keluar dari gudang dengan mudah
            dan aman
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

      <div className='grid lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6'>
        <div className='lg:col-span-3'>
          <Card className='border-slate-200/80 shadow-[0_2px_24px_-10px_rgba(15,23,42,0.1)] overflow-hidden'>
            <CardHeader className='p-5 sm:p-6 lg:p-7 border-b border-slate-100/80 bg-gradient-to-br from-white via-white to-slate-50/50'>
              <CardTitle className='text-[1.1rem] font-extrabold text-slate-900 flex items-center gap-2.5'>
                <span className='w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center ring-1 ring-indigo-100'>
                  <ArrowLeftRight className='w-4 h-4' />
                </span>
                Formulir Transaksi
              </CardTitle>
              <CardDescription className='text-[13.5px] mt-1.5 leading-relaxed'>
                Pastikan semua data diisi dengan benar sebelum menyimpan
              </CardDescription>
            </CardHeader>
            <form
              onSubmit={onSubmit}
              className='p-5 sm:p-6 lg:p-7 space-y-5 sm:space-y-6'
            >
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className='space-y-3'
              >
                <Label className='text-[14px]'>Jenis Transaksi</Label>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5'>
                  {typeButtons.map((tb) => {
                    const Icon = tb.icon;
                    return (
                      <TypeButton
                        key={tb.type}
                        active={type === tb.type}
                        onClick={() => setType(tb.type)}
                        color={tb.color}
                        icon={
                          <Icon
                            className='w-[20px] h-[20px]'
                            strokeWidth={2.2}
                          />
                        }
                        title={tb.title}
                        subtitle={tb.subtitle}
                      />
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.4 }}
                className='space-y-2.5'
              >
                <Label htmlFor='product' className='text-[14px]'>
                  Pilih Barang <span className='text-red-500'>*</span>
                  <span className='ml-2 text-[11.5px] text-slate-400 font-normal'>
                    (Cari via SKU / nama / stok)
                  </span>
                </Label>
                {productsLoading ? (
                  <Skeleton className='h-11 w-full rounded-xl' />
                ) : products.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className='rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center'
                  >
                    <PackageSearch className='w-11 h-11 mx-auto text-slate-300 mb-3' />
                    <p className='text-sm font-semibold text-slate-500'>
                      Belum ada data barang di database.
                    </p>
                    <p className='text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed'>
                      Tambahkan barang terlebih dahulu di menu Kelola Barang.
                    </p>
                  </motion.div>
                ) : (
                  <ProductPicker
                    id='product'
                    ref={productPickerRef}
                    open={productPickerOpen}
                    onOpenChange={setProductPickerOpen}
                    onOpen={openPicker}
                    search={productSearch}
                    setSearch={setProductSearch}
                    selected={selectedProduct}
                    clearSelection={clearProductSelection}
                    filtered={filteredProductsForPicker}
                    onSelect={selectProductFromPicker}
                    disabled={submitting}
                    totalCount={products.length}
                  />
                )}
                {selectedProduct && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 250,
                      damping: 22,
                    }}
                    className='mt-3 p-4 rounded-xl bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 border border-slate-200 flex items-center justify-between gap-3 shadow-sm'
                  >
                    <div className='min-w-0'>
                      <p className='text-sm font-bold text-slate-900 truncate'>
                        {selectedProduct.name}
                      </p>
                      <p className='text-[11.5px] text-slate-500 mt-0.5 font-medium'>
                        SKU:{' '}
                        <code className='font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200'>
                          {selectedProduct.id}
                        </code>
                      </p>
                    </div>
                    <div className='text-right flex-shrink-0'>
                      <p className='text-[11px] text-slate-500 font-semibold'>
                        Sisa Stok
                      </p>
                      <motion.p
                        key={selectedProduct.current_stock}
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 20,
                        }}
                        className={cn(
                          'text-lg font-black mt-0.5',
                          selectedProduct.current_stock <= 0
                            ? 'text-rose-600'
                            : selectedProduct.current_stock <= 10
                              ? 'text-amber-600'
                              : 'text-emerald-600',
                        )}
                      >
                        {formatNumber(selectedProduct.current_stock)}
                      </motion.p>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.26, duration: 0.4 }}
                className='space-y-2.5'
              >
                <Label htmlFor='qty' className='text-[14px]'>
                  Kuantitas (Qty) <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='qty'
                  type='number'
                  inputMode='numeric'
                  min={1}
                  step={1}
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  disabled={submitting || productsLoading}
                  placeholder='Masukkan jumlah barang...'
                  className={cn(
                    'h-11 text-[14px] rounded-xl',
                    stockError &&
                      'border-rose-400 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-500/30 focus:shadow-[0_0_0_4px_rgba(244,63,94,0.08)]',
                  )}
                />
                {qty && !qtyValid && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='text-xs text-rose-600 mt-1.5 flex items-center gap-1.5 font-semibold'
                  >
                    <AlertTriangle className='w-[15px] h-[15px]' />
                    Kuantitas harus berupa angka bulat positif (minimal 1)
                  </motion.p>
                )}
                {stockError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='text-xs text-rose-600 mt-1.5 flex items-center gap-1.5 font-bold'
                  >
                    <AlertTriangle className='w-[15px] h-[15px]' />
                    {stockError}
                  </motion.p>
                )}
                {selectedProduct &&
                  qtyValid &&
                  !stockError &&
                  type === 'OUT' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className='text-xs text-slate-500 mt-1.5'
                    >
                      Sisa stok setelah transaksi:{' '}
                      <span className='font-bold text-slate-700 text-[13px]'>
                        {formatNumber(selectedProduct.current_stock - qtyNum)}
                      </span>
                    </motion.p>
                  )}
                {selectedProduct && qtyValid && type === 'IN' && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className='text-xs text-slate-500 mt-1.5'
                  >
                    Stok setelah penambahan:{' '}
                    <span className='font-bold text-emerald-700 text-[13px]'>
                      {formatNumber(selectedProduct.current_stock + qtyNum)}
                    </span>
                  </motion.p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34, duration: 0.4 }}
                className='space-y-2.5'
              >
                <Label htmlFor='notes' className='text-[14px]'>
                  Keterangan{' '}
                  <span className='text-slate-400 font-normal'>(opsional)</span>
                </Label>
                <Textarea
                  id='notes'
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={submitting}
                  placeholder='Contoh: Restock dari supplier PT. X, Dikirim ke site A, dsb.'
                  className='text-[14px] rounded-xl resize-none'
                  maxLength={500}
                />
                <p className='text-[11.5px] text-slate-400 mt-1 text-right font-semibold'>
                  {notes.length}/500
                </p>
              </motion.div>

              {formError && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  <UIAlert variant='destructive' className='border-red-200'>
                    <AlertTitle className='text-[13px]'>
                      Terjadi Kesalahan
                    </AlertTitle>
                    <AlertDescription className='text-[13px] leading-relaxed mt-1'>
                      {formError}
                    </AlertDescription>
                  </UIAlert>
                </motion.div>
              )}

              <Separator className='opacity-60' />

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, duration: 0.4 }}
                className='flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-1'
              >
                <Button
                  type='button'
                  onClick={resetForm}
                  disabled={submitting}
                  variant='outline'
                  size='lg'
                  className='border-slate-200 bg-white hover:bg-slate-50 text-[14px] font-bold shadow-sm'
                >
                  Reset Form
                </Button>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className='w-full sm:w-auto'
                >
                  <Button
                    type='submit'
                    disabled={isSubmitDisabled}
                    size='lg'
                    variant={type === 'IN' ? 'success' : 'danger'}
                    className={cn(
                      'w-full sm:w-auto text-[14px] font-bold gap-2.5 px-7 shadow-lg',
                      type === 'IN'
                        ? 'shadow-emerald-500/25 hover:shadow-emerald-500/35'
                        : 'shadow-rose-500/25 hover:shadow-rose-500/35',
                    )}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className='w-[18px] h-[18px] animate-spin' />
                        Menyimpan...
                      </>
                    ) : type === 'IN' ? (
                      <>
                        <ArrowDownToLine className='w-[18px] h-[18px]' />
                        Catat Barang Masuk
                      </>
                    ) : (
                      <>
                        <ArrowUpFromLine className='w-[18px] h-[18px]' />
                        Catat Barang Keluar
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </form>
          </Card>
        </div>

        <StaggerItem className='lg:col-span-2 space-y-4 sm:space-y-5 order-first lg:order-last'>
          <Card className='border-slate-200/80 shadow-[0_2px_20px_-10px_rgba(15,23,42,0.1)] hover:shadow-[0_10px_30px_-12px_rgba(15,23,42,0.12)] transition-shadow duration-300'>
            <CardHeader className='p-4 sm:p-5 border-b border-slate-100/80'>
              <CardTitle className='text-[0.95rem] font-extrabold text-slate-900 flex items-center gap-2.5'>
                <div className='w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center ring-1 ring-indigo-100'>
                  <PackageSearch className='w-4 h-4' />
                </div>
                Petunjuk Pengisian
              </CardTitle>
            </CardHeader>
            <CardContent className='p-4 sm:p-5'>
              <ol className='space-y-4 text-xs sm:text-[13px] text-slate-600 relative border-l border-slate-100 ml-2 pl-5'>
                {steps.map(([judul, ket], i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 + i * 0.06, duration: 0.35 }}
                    className='relative'
                  >
                    <span className='absolute -left-[27px] top-0 flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-[10px] font-black ring-4 ring-white shadow-md shadow-indigo-200/60'>
                      {i + 1}
                    </span>
                    <p className='font-bold text-slate-800 leading-snug text-[13.5px]'>
                      {judul}
                    </p>
                    <p className='mt-0.5 leading-relaxed text-slate-500'>
                      {ket}
                    </p>
                  </motion.li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card className='border-amber-200/80 bg-gradient-to-br from-amber-50 via-amber-50/50 to-orange-50 shadow-[0_2px_20px_-10px_rgba(245,158,11,0.18)] hover:shadow-[0_10px_30px_-12px_rgba(245,158,11,0.25)] transition-shadow duration-300'>
            <CardContent className='p-4 sm:p-5'>
              <div className='flex items-start gap-3'>
                <div className='w-9 h-9 rounded-xl bg-white/80 text-amber-600 flex items-center justify-center ring-1 ring-amber-200 flex-shrink-0 shadow-sm'>
                  <AlertTriangle className='w-5 h-5' strokeWidth={2.2} />
                </div>
                <div className='min-w-0'>
                  <p className='text-[13.5px] font-extrabold text-amber-900'>
                    Perhatian
                  </p>
                  <p className='text-xs sm:text-[13px] text-amber-800/90 mt-1 leading-relaxed'>
                    Pastikan semua data sudah benar sebelum menyimpan. Sistem
                    menggunakan{' '}
                    <strong className='text-amber-900'>update atomik</strong>{' '}
                    sehingga perubahan stok dan pencatatan log transaksi terjadi
                    secara bersamaan.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </div>
    </PageTransition>
  );
}

interface TypeButtonProps {
  active: boolean;
  onClick: () => void;
  color: 'emerald' | 'rose';
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

function TypeButton({
  active,
  onClick,
  color,
  icon,
  title,
  subtitle,
}: TypeButtonProps) {
  const activeStyles =
    color === 'emerald'
      ? 'bg-gradient-to-br from-emerald-50/90 via-emerald-50/70 to-transparent border-emerald-400 ring-2 ring-emerald-500/20 text-emerald-700 shadow-[0_4px_18px_-6px_rgba(16,185,129,0.25)]'
      : 'bg-gradient-to-br from-rose-50/90 via-rose-50/70 to-transparent border-rose-400 ring-2 ring-rose-500/20 text-rose-700 shadow-[0_4px_18px_-6px_rgba(244,63,94,0.25)]';
  const iconActive =
    color === 'emerald'
      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/30'
      : 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/30';

  return (
    <motion.button
      type='button'
      onClick={onClick}
      whileHover={!active ? { scale: 1.015, y: -1 } : {}}
      whileTap={{ scale: active ? 0.99 : 0.97 }}
      transition={{ type: 'spring', stiffness: 350, damping: 24 }}
      className={cn(
        'relative text-left p-4 sm:p-4.5 rounded-xl border-2 transition-all duration-300 flex items-center gap-3.5 overflow-hidden',
        active
          ? activeStyles
          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50/80 shadow-sm hover:shadow-md',
      )}
    >
      {active && (
        <motion.div
          layoutId='type-active-bg'
          className={cn(
            'absolute inset-0 opacity-50',
            color === 'emerald'
              ? 'bg-gradient-to-br from-emerald-400/10 via-transparent to-emerald-300/5'
              : 'bg-gradient-to-br from-rose-400/10 via-transparent to-rose-300/5',
          )}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <motion.div
        whileHover={!active ? { rotate: -4, scale: 1.06 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 relative z-10',
          active
            ? iconActive
            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200',
        )}
      >
        {icon}
      </motion.div>
      <div className='min-w-0 relative z-10'>
        <p className='text-sm font-extrabold tracking-tight'>{title}</p>
        <p
          className={cn(
            'text-xs mt-0.5 font-semibold',
            active
              ? color === 'emerald'
                ? 'text-emerald-600'
                : 'text-rose-600'
              : 'text-slate-400',
          )}
        >
          {subtitle}
        </p>
      </div>
      {active && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            delay: 0.05,
          }}
          className={cn(
            'absolute top-3 right-3 w-2.5 h-2.5 rounded-full',
            color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500',
          )}
        >
          <span className='absolute inset-0 rounded-full animate-ping opacity-40 inherit' />
        </motion.div>
      )}
    </motion.button>
  );
}

interface ProductPickerProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpen: () => void;
  search: string;
  setSearch: (s: string) => void;
  selected: Product | undefined;
  clearSelection: () => void;
  filtered: Product[];
  onSelect: (p: Product) => void;
  disabled?: boolean;
  totalCount: number;
}

const ProductPickerInner = React.forwardRef<HTMLDivElement, ProductPickerProps>(
  function ProductPickerInner(
    {
      id,
      open,
      onOpen,
      search,
      setSearch,
      selected,
      clearSelection,
      filtered,
      onSelect,
      disabled,
      totalCount,
    },
    ref,
  ) {
    const LOW = 10;
    const highlight = (text: string, q: string) => {
      const qq = q.trim();
      if (!qq) return text;
      const idx = text.toLowerCase().indexOf(qq.toLowerCase());
      if (idx < 0) return text;
      return (
        <>
          {text.slice(0, idx)}
          <mark className='bg-indigo-100 text-indigo-800 rounded px-0.5 font-bold'>
            {text.slice(idx, idx + qq.length)}
          </mark>
          {text.slice(idx + qq.length)}
        </>
      );
    };

    return (
      <div ref={ref} className='relative w-full'>
        {selected ? (
          <button
            type='button'
            id={id}
            onClick={disabled ? undefined : onOpen}
            disabled={disabled}
            className={cn(
              'w-full text-left px-4 pr-20 h-11 rounded-xl border-2 transition-all duration-200 shadow-sm bg-white',
              disabled
                ? 'border-slate-200 opacity-50 cursor-not-allowed'
                : open
                  ? 'border-indigo-400 ring-2 ring-indigo-500/20 focus:outline-none shadow-[0_0_0_4px_rgba(99,102,241,0.08)]'
                  : 'border-slate-200 hover:border-indigo-200 hover:shadow-md',
            )}
          >
            <div className='flex items-center gap-3 h-full'>
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ring-inset',
                  selected.current_stock <= 0
                    ? 'bg-rose-50 text-rose-600 ring-rose-200'
                    : selected.current_stock <= LOW
                      ? 'bg-amber-50 text-amber-600 ring-amber-200'
                      : 'bg-emerald-50 text-emerald-600 ring-emerald-200',
                )}
              >
                <Package2 className='w-3.5 h-3.5' />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='text-[14px] font-bold text-slate-900 truncate'>
                    {selected.name}
                  </span>
                  {selected.pinned && (
                    <span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold'>
                      <Pin className='w-2.5 h-2.5 fill-amber-400' />
                      PIN
                    </span>
                  )}
                </div>
                <div className='text-[11.5px] text-slate-500 font-medium mt-0.5 flex items-center gap-2'>
                  <code className='font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200'>
                    {selected.id}
                  </code>
                  <span className='text-slate-300'>•</span>
                  <span>Stok: {formatNumber(selected.current_stock)}</span>
                </div>
              </div>
            </div>
            <div className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1'>
              {!disabled && (
                <>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelection();
                    }}
                    role='button'
                    className='p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer'
                    title='Bersihkan pilihan'
                  >
                    <X className='w-3.5 h-3.5' />
                  </span>
                  <span className='p-1.5 rounded-lg text-slate-400 cursor-default'>
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 transition-transform duration-200',
                        open && 'rotate-180',
                      )}
                    />
                  </span>
                </>
              )}
            </div>
          </button>
        ) : (
          <button
            type='button'
            id={id}
            onClick={disabled ? undefined : onOpen}
            disabled={disabled}
            className={cn(
              'w-full text-left px-4 pr-10 h-11 rounded-xl border-2 transition-all duration-200 shadow-sm bg-slate-50/60 hover:bg-white',
              disabled
                ? 'border-slate-200 opacity-50 cursor-not-allowed'
                : open
                  ? 'border-indigo-400 ring-2 ring-indigo-500/20 bg-white focus:outline-none shadow-[0_0_0_4px_rgba(99,102,241,0.08)]'
                  : 'border-slate-200 hover:border-indigo-200 hover:shadow-md',
            )}
          >
            <div className='flex items-center gap-2.5 h-full'>
              <Search className='w-[17px] h-[17px] text-slate-400 flex-shrink-0' />
              <span className='text-[14px] text-slate-500'>
                Klik untuk mencari & pilih barang...
              </span>
            </div>
            <div className='absolute right-3 top-1/2 -translate-y-1/2'>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-slate-400 transition-transform duration-200',
                  open && 'rotate-180',
                )}
              />
            </div>
          </button>
        )}

        <AnimatePresence>
          {open && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className='absolute z-30 left-0 right-0 mt-2.5 rounded-2xl bg-white border border-slate-200 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] overflow-hidden'
            >
              <div className='px-3.5 pt-3.5 pb-2.5 border-b border-slate-100/80 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30'>
                <div className='relative group'>
                  <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-[16px] h-[16px] text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors' />
                  <input
                    autoFocus
                    type='text'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder='Cari SKU, nama barang, atau stok...'
                    inputMode='search'
                    className='w-full h-10 pl-9 pr-9 text-[13.5px] rounded-xl border border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none focus:shadow-[0_0_0_4px_rgba(99,102,241,0.06)] transition-all'
                  />
                  {search && (
                    <button
                      type='button'
                      onClick={() => setSearch('')}
                      className='absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors'
                    >
                      <X className='w-3.5 h-3.5' />
                    </button>
                  )}
                </div>
                <div className='flex items-center justify-between mt-2.5 px-0.5'>
                  <p className='text-[11px] font-semibold text-slate-500'>
                    {search
                      ? `${filtered.length} hasil dari ${totalCount} barang`
                      : `${totalCount} barang tersedia`}
                  </p>
                  {search && (
                    <button
                      type='button'
                      onClick={() => setSearch('')}
                      className='text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline'
                    >
                      Reset pencarian
                    </button>
                  )}
                </div>
              </div>

              <div className='max-h-[340px] overflow-y-auto py-1.5'>
                {filtered.length === 0 ? (
                  <div className='px-4 py-10 text-center'>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 20,
                      }}
                      className='w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-50 flex items-center justify-center ring-1 ring-slate-100'
                    >
                      <PackageSearch className='w-7 h-7 opacity-50 text-slate-400' />
                    </motion.div>
                    <p className='text-sm font-bold text-slate-600 mb-1'>
                      Barang tidak ditemukan
                    </p>
                    <p className='text-xs text-slate-400 max-w-xs mx-auto leading-relaxed'>
                      Coba kata kunci lain atau tambahkan barang baru di{' '}
                      <code className='font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mx-0.5'>
                        Kelola Barang
                      </code>
                    </p>
                  </div>
                ) : (
                  <ul className='px-1.5 space-y-0.5'>
                    {filtered.map((p, i) => {
                      const isSelected = selected?.id === p.id;
                      const state =
                        p.current_stock <= 0
                          ? { cls: 'bg-rose-50 text-rose-700 ring-rose-200' }
                          : p.current_stock <= LOW
                            ? {
                                cls: 'bg-amber-50 text-amber-700 ring-amber-200',
                              }
                            : {
                                cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                              };
                      return (
                        <motion.li
                          key={p.id}
                          initial={{ opacity: 0, y: -3 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: Math.min(i * 0.01, 0.15),
                            duration: 0.2,
                          }}
                        >
                          <button
                            type='button'
                            onClick={() => onSelect(p)}
                            className={cn(
                              'w-full text-left px-2.5 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-150 group',
                              isSelected
                                ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-200'
                                : 'hover:bg-slate-50',
                            )}
                          >
                            <div
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ring-inset',
                                p.current_stock <= 0
                                  ? 'bg-rose-50 text-rose-600 ring-rose-200'
                                  : p.current_stock <= LOW
                                    ? 'bg-amber-50 text-amber-600 ring-amber-200'
                                    : 'bg-emerald-50 text-emerald-600 ring-emerald-200',
                              )}
                            >
                              <Package2 className='w-4 h-4' />
                            </div>
                            <div className='min-w-0 flex-1'>
                              <div className='flex items-center gap-2 flex-wrap'>
                                <span
                                  className={cn(
                                    'text-[13.5px] font-bold truncate leading-tight',
                                    isSelected
                                      ? 'text-indigo-800'
                                      : 'text-slate-900',
                                  )}
                                >
                                  {highlight(p.name, search)}
                                </span>
                                {p.pinned && (
                                  <span className='inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[9.5px] font-extrabold'>
                                    <Pin className='w-2.5 h-2.5 fill-amber-400' />
                                    PIN
                                  </span>
                                )}
                              </div>
                              <div className='text-[11.5px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap'>
                                <code className='font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]'>
                                  {highlight(p.id, search)}
                                </code>
                                <span className='text-slate-300'>•</span>
                                <span
                                  className={cn(
                                    'inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold ring-1 ring-inset',
                                    state.cls,
                                  )}
                                >
                                  {formatNumber(p.current_stock)}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                  type: 'spring',
                                  stiffness: 350,
                                  damping: 22,
                                }}
                                className='w-6 h-6 rounded-lg bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-500/30'
                              >
                                <Check
                                  className='w-3.5 h-3.5'
                                  strokeWidth={3}
                                />
                              </motion.div>
                            )}
                          </button>
                        </motion.li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
ProductPickerInner.displayName = 'ProductPicker';
const ProductPicker = ProductPickerInner;
