import React from 'react';
import { cn } from '../../lib/utils.js';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'slate' | 'indigo' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'md',
  className,
}) => {
  const variants = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200/80',
    success: 'bg-brand-50 text-brand-700 border-brand-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    outline: 'bg-transparent text-slate-600 border-slate-300',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg border tracking-wide uppercase',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};
