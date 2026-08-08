import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef, type MouseEvent, type ReactNode } from 'react';
import { cn } from '../../utils';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  tiltAmount?: number;
  glow?: boolean;
  glowColor?: string;
}

export default function AnimatedCard({
  children,
  className,
  tiltAmount = 6,
  glow = true,
  glowColor = '99, 102, 241',
}: AnimatedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const springConfig = { mass: 0.8, stiffness: 150, damping: 18 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  const maskImageX = useTransform(rotateYSpring, [-tiltAmount, tiltAmount], ['0%', '100%']);
  const maskImageY = useTransform(rotateXSpring, [-tiltAmount, tiltAmount], ['0%', '100%']);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    rotateX.set(-yPct * tiltAmount * 2);
    rotateY.set(xPct * tiltAmount * 2);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: rotateXSpring,
        rotateY: rotateYSpring,
        transformStyle: 'preserve-3d',
        transformPerspective: 800,
      }}
      transition={{ type: 'spring' }}
      className={cn('relative group', className)}
    >
      {children}
      {glow && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(${glowColor}, 0.12), transparent 40%)`,
            WebkitMaskImage: `linear-gradient(#000 0 0), linear-gradient(#000 0 0)`,
            WebkitMaskPosition: `calc(${maskImageX} - 50%) calc(${maskImageY} - 50%), 0 0`,
            WebkitMaskSize: `200% 200%, 100% 100%`,
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}
    </motion.div>
  );
}
