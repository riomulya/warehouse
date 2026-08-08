import { useEffect, useState, type FormEvent, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  CheckCircle2,
  PackageSearch,
  Loader2,
  X,
} from 'lucide-react';
import { ref, update, push, serverTimestamp, get } from 'firebase/database';
import { db } from '../services/firebase';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import type { TransactionType } from '../types';
import { classNames, formatNumber } from '../utils';

type Toast = { type: 'success' | 'error'; message: string } | null;

export default function InputTransactionPage() {
  const user = useAuthStore((s) => s.user);
  const products = useAppStore((s) => s.products);
  const productsLoading = useAppStore((s) => s.productsLoading);
  const subscribeProducts = useAppStore((s) => s.subscribeProducts);

  const navigate = useNavigate();

  const [type, setType] = useState<TransactionType>('IN');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    subscribeProducts();
  }, [subscribeProducts]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId],
  );

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

  const showToast = (t: Toast) => {
    setToast(t);
    if (t) {
      window.setTimeout(() => setToast(null), 4000);
    }
  };

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
        setFormError(
          `Stok real-time tidak mencukupi. Sisa stok terbaru: ${formatNumber(currentStock)}`,
        );
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

      showToast({
        type: 'success',
        message: `Transaksi ${type === 'IN' ? 'Barang Masuk' : 'Barang Keluar'} berhasil dicatat.`,
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

  return (
    <div className='space-y-5 sm:space-y-6 lg:space-y-8 relative'>
      {toast && (
        <div
          role='alert'
          className={classNames(
            'fixed top-[calc(max(env(safe-area-inset-top),0.5rem)+0.5rem)] inset-x-2 sm:inset-x-auto sm:right-4 z-50 w-[calc(100%-1rem)] sm:w-96 rounded-2xl shadow-xl border px-4 py-3.5 flex items-start gap-3 animate-[slideIn_0.2s_ease-out] sm:top-4',
            toast.type === 'success'
              ? 'bg-white border-emerald-200'
              : 'bg-white border-red-200',
          )}
        >
          <div
            className={classNames(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-600',
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className='w-5 h-5' />
            ) : (
              <AlertTriangle className='w-5 h-5' />
            )}
          </div>
          <div className='flex-1 min-w-0'>
            <p
              className={classNames(
                'text-sm font-semibold',
                toast.type === 'success' ? 'text-emerald-900' : 'text-red-900',
              )}
            >
              {toast.type === 'success' ? 'Berhasil' : 'Gagal'}
            </p>
            <p
              className={classNames(
                'text-xs mt-0.5',
                toast.type === 'success' ? 'text-emerald-700' : 'text-red-700',
              )}
            >
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => setToast(null)}
            className='flex-shrink-0 p-1 -m-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
      )}

      <header className='flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0'>
          <div className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100 text-[11px] font-semibold uppercase tracking-wider mb-2'>
            Transaksi
          </div>
          <h1 className='text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5 min-w-0 break-words'>
            <span className='w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center ring-1 ring-indigo-200 flex-shrink-0'>
              <ArrowLeftRight className='w-5 h-5' />
            </span>
            <span className='min-w-0'>Input Transaksi Barang</span>
          </h1>
          <p className='text-sm text-slate-500 mt-1.5'>
            Catat pergerakan barang masuk atau keluar dari gudang
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className='inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition w-full sm:w-auto self-start sm:self-auto'
        >
          &larr; Kembali ke Dashboard
        </button>
      </header>

      <div className='grid lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6'>
        <form
          onSubmit={onSubmit}
          className='lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-7 space-y-4 sm:space-y-5'
        >
          <div>
            <label className='block text-sm font-semibold text-slate-700 mb-2'>
              Jenis Transaksi
            </label>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3'>
              <TypeButton
                active={type === 'IN'}
                onClick={() => setType('IN')}
                color='emerald'
                icon={<ArrowDownToLine className='w-5 h-5' />}
                title='Barang Masuk'
                subtitle='Tambah stok'
              />
              <TypeButton
                active={type === 'OUT'}
                onClick={() => setType('OUT')}
                color='rose'
                icon={<ArrowUpFromLine className='w-5 h-5' />}
                title='Barang Keluar'
                subtitle='Kurangi stok'
              />
            </div>
          </div>

          <div>
            <label
              htmlFor='product'
              className='block text-sm font-semibold text-slate-700 mb-2'
            >
              Pilih Barang <span className='text-red-500'>*</span>
            </label>
            {productsLoading ? (
              <div className='h-11 rounded-lg bg-slate-100 animate-pulse' />
            ) : products.length === 0 ? (
              <div className='rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center'>
                <PackageSearch className='w-10 h-10 mx-auto text-slate-300 mb-2' />
                <p className='text-sm text-slate-500'>
                  Belum ada data barang di database.
                </p>
              </div>
            ) : (
              <select
                id='product'
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                disabled={submitting}
                className={classNames(
                  'w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60',
                  productId
                    ? 'border-slate-300 text-slate-900'
                    : 'border-slate-300 text-slate-500',
                )}
              >
                <option value=''>-- Pilih barang --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.id}] {p.name} (Stok: {formatNumber(p.current_stock)})
                  </option>
                ))}
              </select>
            )}
            {selectedProduct && (
              <div className='mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-slate-900'>
                    {selectedProduct.name}
                  </p>
                  <p className='text-xs text-slate-500 mt-0.5'>
                    SKU: {selectedProduct.id}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='text-xs text-slate-500'>Sisa Stok</p>
                  <p
                    className={classNames(
                      'text-lg font-bold',
                      selectedProduct.current_stock <= 0
                        ? 'text-red-600'
                        : selectedProduct.current_stock <= 10
                          ? 'text-amber-600'
                          : 'text-emerald-600',
                    )}
                  >
                    {formatNumber(selectedProduct.current_stock)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor='qty'
              className='block text-sm font-semibold text-slate-700 mb-2'
            >
              Kuantitas (Qty) <span className='text-red-500'>*</span>
            </label>
            <input
              id='qty'
              type='number'
              inputMode='numeric'
              min={1}
              step={1}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              disabled={submitting || productsLoading}
              placeholder='Masukkan jumlah barang...'
              className={classNames(
                'w-full px-3.5 py-2.5 rounded-lg border text-sm bg-white transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60',
                stockError ? 'border-red-400 bg-red-50/50' : 'border-slate-300',
              )}
            />
            {qty && !qtyValid && (
              <p className='text-xs text-red-600 mt-1.5 flex items-center gap-1'>
                <AlertTriangle className='w-3.5 h-3.5' />
                Kuantitas harus berupa angka bulat positif (minimal 1)
              </p>
            )}
            {stockError && (
              <p className='text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium'>
                <AlertTriangle className='w-3.5 h-3.5' />
                {stockError}
              </p>
            )}
            {selectedProduct && qtyValid && !stockError && type === 'OUT' && (
              <p className='text-xs text-slate-500 mt-1.5'>
                Sisa stok setelah transaksi:{' '}
                <span className='font-semibold text-slate-700'>
                  {formatNumber(selectedProduct.current_stock - qtyNum)}
                </span>
              </p>
            )}
            {selectedProduct && qtyValid && type === 'IN' && (
              <p className='text-xs text-slate-500 mt-1.5'>
                Stok setelah penambahan:{' '}
                <span className='font-semibold text-slate-700'>
                  {formatNumber(selectedProduct.current_stock + qtyNum)}
                </span>
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor='notes'
              className='block text-sm font-semibold text-slate-700 mb-2'
            >
              Keterangan{' '}
              <span className='text-slate-400 font-normal'>(opsional)</span>
            </label>
            <textarea
              id='notes'
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              placeholder='Contoh: Restock dari supplier PT. X, Dikirim ke site A, dsb.'
              className='w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60 transition-colors'
              maxLength={500}
            />
            <p className='text-xs text-slate-400 mt-1 text-right'>
              {notes.length}/500
            </p>
          </div>

          {formError && (
            <div className='p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-sm text-red-700'>
              <AlertTriangle className='w-5 h-5 flex-shrink-0 mt-0.5 text-red-500' />
              <span>{formError}</span>
            </div>
          )}

          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-2 border-t border-slate-100'>
            <button
              type='button'
              onClick={resetForm}
              disabled={submitting}
              className='px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition'
            >
              Reset Form
            </button>
            <button
              type='submit'
              disabled={isSubmitDisabled}
              className={classNames(
                'px-5 py-2.5 rounded-lg text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]',
                type === 'IN'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20',
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin' />
                  Menyimpan...
                </>
              ) : (
                <>
                  {type === 'IN' ? (
                    <>
                      <ArrowDownToLine className='w-4 h-4' />
                      Catat Barang Masuk
                    </>
                  ) : (
                    <>
                      <ArrowUpFromLine className='w-4 h-4' />
                      Catat Barang Keluar
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>

        <aside className='lg:col-span-2 space-y-4 sm:space-y-5 order-first lg:order-last'>
          <div className='bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5'>
            <div className='flex items-center gap-2 mb-3.5'>
              <div className='w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center'>
                <PackageSearch className='w-4 h-4' />
              </div>
              <h3 className='text-sm font-bold text-slate-900'>
                Petunjuk Pengisian
              </h3>
            </div>
            <ol className='space-y-3 text-xs sm:text-sm text-slate-600 relative border-l border-slate-100 ml-2 pl-5'>
              {[
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
                [
                  'Tambah keterangan',
                  'Opsional, mempermudah tracking riwayat.',
                ],
              ].map(([judul, ket], i) => (
                <li key={i} className='relative'>
                  <span className='absolute -left-[27px] top-0 flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold ring-4 ring-white shadow-sm'>
                    {i + 1}
                  </span>
                  <p className='font-semibold text-slate-800 leading-snug'>
                    {judul}
                  </p>
                  <p className='mt-0.5 leading-relaxed text-slate-500'>{ket}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className='bg-gradient-to-br from-amber-50 via-amber-50/50 to-orange-50 rounded-2xl border border-amber-200 p-4 sm:p-5 shadow-sm'>
            <div className='flex items-start gap-2.5'>
              <div className='w-9 h-9 rounded-xl bg-white/70 text-amber-600 flex items-center justify-center ring-1 ring-amber-200 flex-shrink-0'>
                <AlertTriangle className='w-5 h-5' />
              </div>
              <div className='min-w-0'>
                <p className='text-sm font-bold text-amber-900'>Perhatian</p>
                <p className='text-xs sm:text-sm text-amber-800/90 mt-1 leading-relaxed'>
                  Pastikan semua data sudah benar sebelum menyimpan. Sistem
                  menggunakan <strong>update atomik</strong> sehingga perubahan
                  stok dan pencatatan log transaksi terjadi secara bersamaan
                  (tidak bisa setengah-setengah).
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
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
      ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 text-emerald-700'
      : 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-500/20 text-rose-700';
  const iconActive =
    color === 'emerald'
      ? 'bg-emerald-600 text-white'
      : 'bg-rose-600 text-white';

  return (
    <button
      type='button'
      onClick={onClick}
      className={classNames(
        'relative text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3',
        active
          ? activeStyles
          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50',
      )}
    >
      <div
        className={classNames(
          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
          active ? iconActive : 'bg-slate-100 text-slate-500',
        )}
      >
        {icon}
      </div>
      <div className='min-w-0'>
        <p className='text-sm font-semibold'>{title}</p>
        <p
          className={classNames(
            'text-xs mt-0.5',
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
    </button>
  );
}
