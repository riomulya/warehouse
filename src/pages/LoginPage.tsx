import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Warehouse, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

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

  const floatingOrbs = [
    {
      delay: 0,
      size: 400,
      pos: '-top-48 -right-48',
      colors: 'from-indigo-500/30 to-blue-500/20',
      duration: 22,
    },
    {
      delay: 2,
      size: 360,
      pos: '-bottom-44 -left-40',
      colors: 'from-purple-500/25 to-pink-500/20',
      duration: 26,
    },
    {
      delay: 4,
      size: 280,
      pos: 'top-1/3 -left-24',
      colors: 'from-violet-500/20 to-indigo-400/15',
      duration: 18,
    },
    {
      delay: 6,
      size: 220,
      pos: 'bottom-1/4 right-10',
      colors: 'from-blue-500/20 to-cyan-400/15',
      duration: 20,
    },
  ];

  return (
    <div className='relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 px-4 py-8 overflow-hidden'>
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        {floatingOrbs.map((orb, i) => (
          <motion.div
            key={i}
            className={orb.pos}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 1, 0.8, 1],
              scale: [1, 1.15, 1, 1.08, 1],
              x: [0, 30, -15, 20, 0],
              y: [0, -25, 20, -15, 0],
            }}
            transition={{
              duration: orb.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: orb.delay,
            }}
            style={{ width: orb.size, height: orb.size }}
          >
            <div
              className={`w-full h-full bg-gradient-to-br ${orb.colors} rounded-full blur-[90px]`}
            />
          </motion.div>
        ))}
        <div
          className='absolute inset-0 opacity-[0.04]'
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '42px 42px',
          }}
        />
      </div>

      <div className='relative w-full max-w-md z-10'>
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className='flex items-center justify-center gap-3.5 mb-10'
        >
          <motion.div
            initial={{ scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.08, rotate: -3 }}
            whileTap={{ scale: 0.94 }}
            transition={{
              type: 'spring',
              stiffness: 220,
              damping: 18,
              delay: 0.2,
            }}
            className='w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(99,102,241,0.6)] relative overflow-hidden group'
          >
            <div className='absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
            <Warehouse
              className='w-8 h-8 text-white relative z-10'
              strokeWidth={2.2}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className='text-white'
          >
            <h1 className='text-3xl font-extrabold leading-tight bg-gradient-to-r from-white via-indigo-100 to-white bg-clip-text text-transparent'>
              Warehouse M
            </h1>
            <p className='text-sm text-indigo-200/80 mt-1 font-medium tracking-wide'>
              Management System
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.7,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.2,
          }}
          className='relative'
        >
          <div className='absolute -inset-[1px] rounded-[28px] bg-gradient-to-br from-indigo-400/40 via-purple-400/30 to-indigo-500/40 blur-[2px] opacity-60' />
          <div className='relative bg-white/95 backdrop-blur-2xl rounded-[26px] shadow-[0_30px_80px_-20px_rgba(15,23,42,0.5),0_0_0_1px_rgba(255,255,255,0.15)_inset] p-8 sm:p-9 border border-white/40'>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className='mb-8'
            >
              <h2 className='text-[1.65rem] font-extrabold text-slate-900 tracking-tight leading-tight'>
                Selamat datang 👋
              </h2>
              <p className='text-[0.95rem] text-slate-500 mt-2 leading-relaxed'>
                Masuk ke akun Anda untuk melanjutkan pengelolaan gudang
              </p>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className='mb-6'
              >
                <Alert variant='destructive' className='border-red-200'>
                  <AlertTitle className='text-[13px]'>Login Gagal</AlertTitle>
                  <AlertDescription className='text-[13px] leading-relaxed mt-1'>
                    {error}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            <form onSubmit={onSubmit} className='space-y-5'>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className='space-y-2.5'
              >
                <Label htmlFor='email' className='text-[13px]'>
                  Alamat Email
                </Label>
                <div className='relative group'>
                  <Mail className='absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300' />
                  <Input
                    id='email'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='contoh@gudang.com'
                    autoComplete='email'
                    disabled={loading}
                    className='h-12 pl-11 pr-4 text-[14px] rounded-xl bg-white/80 hover:bg-white focus:bg-white border-slate-200 hover:border-indigo-200 transition-all duration-200 shadow-sm hover:shadow-md'
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className='space-y-2.5'
              >
                <Label htmlFor='password' className='text-[13px]'>
                  Kata Sandi
                </Label>
                <div className='relative group'>
                  <Lock className='absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-400 group-focus-within:text-indigo-500 transition-colors duration-300' />
                  <Input
                    id='password'
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='Masukkan kata sandi'
                    autoComplete='current-password'
                    disabled={loading}
                    className='h-12 pl-11 pr-12 text-[14px] rounded-xl bg-white/80 hover:bg-white focus:bg-white border-slate-200 hover:border-indigo-200 transition-all duration-200 shadow-sm hover:shadow-md'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPwd((s) => !s)}
                    className='absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200'
                  >
                    {showPwd ? (
                      <EyeOff className='w-[18px] h-[18px]' />
                    ) : (
                      <Eye className='w-[18px] h-[18px]' />
                    )}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.72, duration: 0.4 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  type='submit'
                  disabled={loading || !email || !password}
                  size='lg'
                  variant='gradient'
                  className='w-full h-12 text-[14px] font-bold tracking-wide rounded-xl shadow-[0_12px_30px_-8px_rgba(99,102,241,0.55)] relative overflow-hidden group'
                >
                  <div className='absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
                  {loading ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className='flex items-center gap-2.5 relative z-10'
                    >
                      <Loader2
                        className='w-5 h-5 animate-spin'
                        strokeWidth={2.5}
                      />
                      <span>Memproses...</span>
                    </motion.div>
                  ) : (
                    <span className='relative z-10'>Masuk ke Sistem</span>
                  )}
                </Button>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className='mt-8 pt-6 border-t border-slate-100/80 text-center'
            >
              <p className='text-[12px] text-slate-400 font-medium'>
                Sistem Warehouse Management &copy; {new Date().getFullYear()}
              </p>
              <p className='text-[11px] text-slate-300 mt-1'>
                Dibuat dengan ❤️ untuk efisiensi gudang
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
