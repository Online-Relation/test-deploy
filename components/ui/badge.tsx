// components/ui/badge.tsx

import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'success';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors';

  const variantClasses = {
    default: 'bg-muted text-muted-foreground',
    outline: 'border border-current bg-transparent',
    success: 'bg-green-100 text-green-800',
  };

  return (
    <span className={cn(baseClasses, variantClasses[variant], className)} {...props} />
  );
}
