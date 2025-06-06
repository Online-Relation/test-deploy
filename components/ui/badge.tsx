import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors';
  const variantClasses =
    variant === 'outline'
      ? 'border border-current bg-transparent'
      : 'bg-muted text-muted-foreground';

  return (
    <span className={cn(baseClasses, variantClasses, className)} {...props} />
  );
}