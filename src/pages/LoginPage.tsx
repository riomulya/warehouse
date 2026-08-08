import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Warehouse, Lock, Mail, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { classNames } from '../utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const login = useAuthStore((s) => s.login);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
    return () => clearError();
  }, [user, navigate, from, clearError]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) return;
    await login(email.trim(), password);
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-8'>
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl' />
        <div className='absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl' />
      </div>

      <div className='relative w-full max-w-md'>
        <div className='flex items-center justify-center gap-3 mb-8'>
          <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl'>
            <Warehouse className='w-7 h-7 text-white' />
          </div>
          <div className='text-white'>
            <h1 className='text-2xl font-bold leading-tight'>Warehouse M</h1>
            <p className='text-sm text-indigo-200/80'>Management System</p>
          </div>
        </div>

        <div className='bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 border border-white/20'>
          <div className='mb-6'>
            <h2 className='text-2xl font-semibold text-slate-900'>
              Selamat datang
            </h2>
            <p className='text-sm text-slate-500 mt-1'>
              Masuk ke akun Anda untuk melanjutkan
            </p>
          </div>

          {error && (
            <div className='mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-sm text-red-700'>
              <AlertTriangle className='w-5 h-5 flex-shrink-0 mt-0.5 text-red-500' />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-slate-700 mb-1.5'>
                Email
              </label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='contoh@gudang.com'
                  autoComplete='email'
                  disabled={loading}
                  className={classNames(
                    'w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm transition-colors disabled:opacity-60',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                    'bg-white border-slate-300 placeholder:text-slate-400',
                  )}
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-slate-700 mb-1.5'>
                Password
              </label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400' />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Masukkan password'
                  autoComplete='current-password'
                  disabled={loading}
                  className={classNames(
                    'w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm transition-colors disabled:opacity-60',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
                    'bg-white border-slate-300 placeholder:text-slate-400',
                  )}
                />
                <button
                  type='button'
                  onClick={() => setShowPwd((s) => !s)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-indigo-600'
                >
                  {showPwd ? 'Sembunyikan' : 'Lihat'}
                </button>
              </div>
            </div>

            <button
              type='submit'
              disabled={loading || !email || !password}
              className='w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {loading ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          <div className='mt-6 pt-5 border-t border-slate-100 text-xs text-slate-400 text-center'>
            <p>Sistem Warehouse Management &copy; {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
