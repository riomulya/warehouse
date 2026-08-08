import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  ScrollText,
  LogOut,
  Menu,
  X,
  Warehouse,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { classNames } from '../utils';

const SIDEBAR_WIDTH = 'w-72';

export default function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    {
      to: '/',
      label: 'Dashboard Stok',
      icon: LayoutDashboard,
      roles: ['admin', 'management'],
    },
    {
      to: '/input-transaction',
      label: 'Input Transaksi',
      icon: ArrowLeftRight,
      roles: ['admin'],
    },
    {
      to: '/transaction-logs',
      label: 'Log Transaksi',
      icon: ScrollText,
      roles: ['management'],
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false,
  );

  return (
    <div className='min-h-screen w-full bg-slate-50 text-slate-900 antialiased'>
      <button
        onClick={() => setMobileOpen(true)}
        className='fixed top-[max(env(safe-area-inset-top),0.75rem)] left-[max(env(safe-area-inset-left),0.75rem)] z-40 p-2.5 rounded-xl bg-white/95 backdrop-blur shadow-lg ring-1 ring-slate-200 text-slate-700 md:hidden flex items-center gap-2'
        aria-label='Buka menu'
      >
        <Menu className='w-5 h-5' />
        <span className='text-sm font-semibold pr-1'>Menu</span>
      </button>

      <div
        aria-hidden={!mobileOpen}
        className={classNames(
          'fixed inset-0 z-[55] md:hidden bg-slate-900/60 backdrop-blur-sm transition-opacity duration-200',
          mobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        role='navigation'
        aria-label='Sidebar navigasi'
        className={classNames(
          'fixed top-0 left-0 z-[60] h-[100dvh] shrink-0 bg-white border-r border-slate-200 shadow-sm',
          SIDEBAR_WIDTH,
          'flex flex-col transition-transform duration-300 ease-out',
          '-translate-x-full md:translate-x-0',
          mobileOpen && 'translate-x-0',
        )}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
        }}
      >
        <div className='px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2'>
          <Link
            to='/'
            className='flex items-center gap-3 min-w-0'
            onClick={() => setMobileOpen(false)}
          >
            <div className='w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 flex-shrink-0'>
              <Warehouse className='w-5 h-5' />
            </div>
            <div className='min-w-0'>
              <h1 className='text-base font-bold text-slate-900 leading-tight truncate'>
                Warehouse M
              </h1>
              <p className='text-xs text-slate-500 mt-0.5'>Management System</p>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className='md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition'
            aria-label='Tutup menu'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <nav className='flex-1 p-3 space-y-1 overflow-y-auto'>
          <p className='px-3 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400'>
            Menu Utama
          </p>
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                classNames(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )
              }
            >
              <item.icon
                className={classNames(
                  'w-5 h-5 flex-shrink-0 transition-transform',
                  'group-hover:scale-105',
                )}
              />
              <span className='flex-1 truncate'>{item.label}</span>
              <ChevronRight className='w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-current/60' />
            </NavLink>
          ))}
        </nav>

        <div className='p-3 border-t border-slate-200 space-y-2'>
          <div className='px-3.5 py-3 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/80 ring-1 ring-inset ring-slate-200'>
            <p className='text-sm font-semibold text-slate-900 truncate'>
              {user?.name || 'User'}
            </p>
            <div className='mt-1 flex items-center gap-2'>
              <span
                className={classNames(
                  'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset',
                  user?.role === 'admin'
                    ? 'bg-indigo-50 text-indigo-700 ring-indigo-200'
                    : 'bg-purple-50 text-purple-700 ring-purple-200',
                )}
              >
                {user?.role || ''}
              </span>
              <p className='text-[11px] text-slate-500 truncate'>
                {user?.email || ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className='w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:ring-1 hover:ring-red-200 transition-all'
          >
            <LogOut className='w-5 h-5 flex-shrink-0' />
            Logout
          </button>
        </div>
      </aside>

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
