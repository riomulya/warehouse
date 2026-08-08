import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-all duration-200 ring-1 ring-inset',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80 ring-primary/20',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 ring-slate-200',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80 ring-destructive/20',
        outline: 'text-foreground ring-border',
        indigo:
          'bg-indigo-50 text-indigo-700 ring-indigo-200',
        purple:
          'bg-purple-50 text-purple-700 ring-purple-200',
        emerald:
          'bg-emerald-50 text-emerald-700 ring-emerald-200',
        amber:
          'bg-amber-50 text-amber-700 ring-amber-200',
        rose:
          'bg-rose-50 text-rose-700 ring-rose-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
