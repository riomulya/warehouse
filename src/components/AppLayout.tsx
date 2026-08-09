import { useState, useEffect } from 'react';
import {
  Link,
  NavLink,
  useNavigate,
  Outlet,
  useLocation,
} from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ScrollText,
  LogOut,
  Menu,
  X,
  Warehouse,
  ChevronRight,
  Package2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { cn } from '../utils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback } from './ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './ui/dialog';

const SIDEBAR_WIDTH = 'w-72';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogoutClick = () => {
    setMobileOpen(false);
    setLogoutOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setLogoutOpen(false);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    {
      to: '/',
      label: 'Dashboard Stok',
      icon: LayoutDashboard,
      roles: ['admin', 'management'],
      color: 'indigo',
    },
    {
      to: '/products',
      label: 'Kelola Barang',
      icon: Package2,
      roles: ['admin'],
      color: 'teal',
    },
    {
      to: '/input-transaction',
      label: 'Input Transaksi',
      icon: ArrowLeftRight,
      roles: ['admin'],
      color: 'emerald',
    },
    {
      to: '/transaction-logs',
      label: 'Log Transaksi',
      icon: ScrollText,
      roles: ['management'],
      color: 'purple',
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false,
  );

  const sidebarNavVariants: any = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: 0.08 + i * 0.05,
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1] as any,
      },
    }),
  };

  return (
    <div className='min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 text-slate-900 antialiased relative overflow-hidden'>
      <div className='fixed inset-0 pointer-events-none overflow-hidden -z-10'>
        <div className='absolute top-0 -right-40 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl' />
        <div className='absolute bottom-0 -left-40 w-96 h-96 bg-purple-300/15 rounded-full blur-3xl' />
      </div>

      <Button
        onClick={() => setMobileOpen(true)}
        variant='outline'
        size='sm'
        className='fixed top-[max(env(safe-area-inset-top),0.75rem)] left-[max(env(safe-area-inset-left),0.75rem)] z-40 md:hidden bg-white/95 backdrop-blur-lg shadow-lg shadow-slate-200/60 border-slate-200 gap-2.5'
        aria-label='Buka menu'
      >
        <Menu className='w-[18px] h-[18px]' />
        <span className='text-sm font-semibold pr-1'>Menu</span>
      </Button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            aria-hidden
            className='fixed inset-0 z-[55] md:hidden bg-slate-900/60 backdrop-blur-md'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(mobileOpen || typeof window !== 'undefined') && (
          <motion.aside
            role='navigation'
            aria-label='Sidebar navigasi'
            className={cn(
              'fixed top-0 left-0 z-[60] h-[100dvh] shrink-0 bg-white/90 backdrop-blur-xl border-r border-slate-200/80 shadow-[0_0_50px_-20px_rgba(15,23,42,0.15)]',
              SIDEBAR_WIDTH,
              'flex flex-col md:translate-x-0',
              'md:block',
              mobileOpen ? 'block' : 'hidden md:block',
            )}
            initial={false}
            animate={
              typeof window !== 'undefined' && window.innerWidth < 768
                ? mobileOpen
                  ? { x: 0 }
                  : { x: '-100%' }
                : { x: 0 }
            }
            transition={
              typeof window !== 'undefined' && window.innerWidth < 768
                ? { type: 'spring', stiffness: 300, damping: 32, mass: 0.9 }
                : { type: false }
            }
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
              paddingLeft: 'env(safe-area-inset-left)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.4 }}
              className='px-5 py-4 border-b border-slate-200/80 flex items-center justify-between gap-2'
            >
              <Link to='/' className='flex items-center gap-3 min-w-0 group'>
                <motion.div
                  whileHover={{ scale: 1.05, rotate: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className='w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 flex-shrink-0 group-hover:shadow-indigo-500/40 transition-shadow duration-300'
                >
                  <Warehouse className='w-5 h-5' />
                </motion.div>
                <div className='min-w-0'>
                  <h1 className='text-base font-extrabold text-slate-900 leading-tight truncate bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent'>
                    Warehouse M
                  </h1>
                  <p className='text-xs text-slate-500 mt-0.5 font-medium'>
                    Management System
                  </p>
                </div>
              </Link>
              <Button
                onClick={() => setMobileOpen(false)}
                variant='ghost'
                size='icon'
                className='md:hidden h-9 w-9 text-slate-500 hover:text-slate-700'
                aria-label='Tutup menu'
              >
                <X className='w-5 h-5' />
              </Button>
            </motion.div>

            <nav className='flex-1 p-3 space-y-1 overflow-y-auto'>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className='px-3 pt-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400'
              >
                Menu Utama
              </motion.p>
              {visibleNavItems.map((item, i) => (
                <motion.div
                  key={item.to}
                  custom={i}
                  variants={sidebarNavVariants}
                  initial='hidden'
                  animate='visible'
                >
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 overflow-hidden',
                        isActive
                          ? 'bg-gradient-to-r from-indigo-50 via-purple-50/70 to-transparent text-indigo-700 shadow-[0_2px_12px_-4px_rgba(99,102,241,0.25)] ring-1 ring-inset ring-indigo-100'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <motion.div
                          layoutId='nav-indicator'
                          className={cn(
                            'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-indigo-500 to-purple-500',
                            isActive ? 'opacity-100' : 'opacity-0',
                          )}
                          transition={{
                            type: 'spring',
                            stiffness: 350,
                            damping: 30,
                          }}
                        />
                        <motion.div
                          whileHover={{ scale: 1.12, rotate: -3 }}
                          whileTap={{ scale: 0.92 }}
                          transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 20,
                          }}
                          className={cn(
                            'w-5 h-5 flex-shrink-0 transition-colors duration-200',
                          )}
                        >
                          <item.icon className='w-full h-full' />
                        </motion.div>
                        <span className='flex-1 truncate'>{item.label}</span>
                        <motion.div
                          initial={false}
                          animate={{
                            opacity: isActive ? 1 : 0,
                            x: isActive ? 0 : -8,
                          }}
                          transition={{ duration: 0.25 }}
                          className='text-current/60'
                        >
                          <ChevronRight className='w-4 h-4' />
                        </motion.div>
                      </>
                    )}
                  </NavLink>
                </motion.div>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className='p-3 border-t border-slate-200/80 space-y-2.5'
            >
              <motion.div
                whileHover={{ scale: 1.01 }}
                className='px-3.5 py-3.5 rounded-2xl bg-gradient-to-br from-slate-50 via-indigo-50/40 to-slate-100/80 ring-1 ring-inset ring-slate-200/80 relative overflow-hidden group'
              >
                <div className='absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-200/40 to-purple-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
                <div className='relative flex items-start gap-3'>
                  <Avatar className='h-10 w-10 rounded-xl shadow-md shadow-slate-200'>
                    <AvatarFallback className='text-[13px] bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600'>
                      {user?.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-bold text-slate-900 truncate leading-tight'>
                      {user?.name || 'User'}
                    </p>
                    <div className='mt-1.5 flex items-center gap-2 flex-wrap'>
                      <Badge
                        variant={user?.role === 'admin' ? 'indigo' : 'purple'}
                        className='text-[10px] font-extrabold uppercase tracking-wider px-2'
                      >
                        {user?.role || ''}
                      </Badge>
                      <p className='text-[11px] text-slate-500 truncate font-medium'>
                        {user?.email || ''}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <Separator className='opacity-60' />

              <Button
                onClick={handleLogoutClick}
                variant='ghost'
                className='w-full flex items-center justify-start gap-3 px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 hover:ring-1 hover:ring-red-200 transition-all duration-200 rounded-xl h-auto'
              >
                <motion.div
                  whileHover={{ x: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <LogOut className='w-5 h-5 flex-shrink-0' />
                </motion.div>
                Logout
              </Button>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>

      <Dialog
        open={logoutOpen}
        onOpenChange={(o) => !isLoggingOut && setLogoutOpen(o)}
      >
        <DialogContent open={logoutOpen} className='sm:max-w-md'>
          <DialogHeader className='pb-3'>
            <div className='flex items-start gap-4 sm:gap-5'>
              <motion.div
                initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 20,
                  delay: 0.05,
                }}
                className='relative shrink-0'
              >
                <div className='absolute inset-0 rounded-2xl bg-gradient-to-br from-red-400 to-orange-500 blur-xl opacity-30 scale-105' />
                <div className='relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/25 ring-1 ring-red-500/20'>
                  <AlertTriangle className='w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow-sm' />
                </div>
              </motion.div>
              <div className='min-w-0 flex-1 pt-1'>
                <DialogTitle className='text-lg sm:text-xl font-extrabold text-slate-900 leading-tight'>
                  Keluar dari akun?
                </DialogTitle>
                <DialogDescription className='text-sm sm:text-[15px] text-slate-500 mt-2 leading-relaxed'>
                  Kamu akan dikeluarkan dari sistem Warehouse Management.
                  <span className='block mt-1.5'>
                    Pastikan semua data transaksi sudah tersimpan ya.
                  </span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className='gap-2.5 sm:gap-3 pt-2 sm:pt-3'>
            <DialogClose asChild>
              <Button
                type='button'
                variant='outline'
                disabled={isLoggingOut}
                className='flex-1 h-11 sm:h-12 rounded-xl text-[14px] font-bold border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 transition-all duration-200'
              >
                <span>Batal</span>
              </Button>
            </DialogClose>
            <motion.button
              whileHover={!isLoggingOut ? { scale: 1.015, y: -0.5 } : {}}
              whileTap={!isLoggingOut ? { scale: 0.985 } : {}}
              onClick={handleLogoutConfirm}
              disabled={isLoggingOut}
              className='flex-1 h-11 sm:h-12 rounded-xl text-[14px] font-bold text-white inline-flex items-center justify-center gap-2 bg-gradient-to-br from-red-500 via-orange-500 to-red-600 shadow-lg shadow-red-500/25 hover:shadow-red-500/35 ring-1 ring-inset ring-white/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300'
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className='w-[18px] h-[18px] animate-spin' />
                  <span>Keluar...</span>
                </>
              ) : (
                <>
                  <LogOut className='w-[18px] h-[18px]' />
                  <span>Ya, Keluar</span>
                </>
              )}
            </motion.button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main
        className='md:ml-72 min-h-[100dvh] flex flex-col'
        style={{
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <div className='w-full pt-[calc(max(env(safe-area-inset-top),0.75rem)+3.5rem)] md:pt-[max(env(safe-area-inset-top),1.5rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)] px-4 sm:px-6 lg:px-8 flex-1 flex flex-col'>
          <div className='w-full max-w-[1400px] mx-auto flex-1'>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
