// src/components/ui/badge.tsx
import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors';
  const variantClasses =
    variant === 'outline'
      ? 'border border-current bg-transparent'
      : 'bg-gray-100 text-gray-800';

  return (
    <div className={cn(baseClasses, variantClasses, className)} {...props} />
  );
}