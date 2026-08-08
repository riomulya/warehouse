import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: (delay = 0.05) => ({
    opacity: 1,
    transition: {
      delayChildren: delay,
      staggerChildren: delay,
    },
  }),
};

const itemVariants: any = {
  hidden: {
    opacity: 0,
    y: 18,
    filter: 'blur(4px)',
  },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as any,
    },
  },
};

export function StaggerContainer({
  children,
  className,
  delay = 0.02,
}: StaggerContainerProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial='hidden'
      animate='show'
      custom={delay}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
