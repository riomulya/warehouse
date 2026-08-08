import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Warehouse } from 'lucide-react';
import { useAuthStore, hasRole } from '../store/authStore';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const location = useLocation();

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 relative overflow-hidden'>
        <div className='absolute inset-0 pointer-events-none overflow-hidden'>
          <div className='absolute top-0 -right-40 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl' />
          <div className='absolute bottom-0 -left-40 w-96 h-96 bg-purple-300/15 rounded-full blur-3xl' />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className='flex flex-col items-center gap-5 relative z-10'
        >
          <motion.div
            animate={{
              y: [0, -6, 0],
              rotate: [0, -2, 2, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className='w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40'
          >
            <Warehouse className='w-8 h-8 text-white' />
          </motion.div>
          <div className='flex flex-col items-center gap-3'>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className='flex items-center gap-2'
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className='w-6 h-6 border-[3px] border-indigo-200 border-t-indigo-600 rounded-full'
              />
              <motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className='text-slate-600 text-sm font-semibold'
              >
                Menyiapkan sistem...
              </motion.p>
            </motion.div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 200 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className='h-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-70'
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to='/login' replace state={{ from: location }} />;
  }

  if (!hasRole(user.role, allowedRoles)) {
    return <Navigate to='/' replace />;
  }

  return <>{children}</>;
}
