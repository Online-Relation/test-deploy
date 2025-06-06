// components/ui/TagBadge.tsx
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TagBadgeProps {
  label: string;
  icon?: ReactNode;
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'primary' | 'purple' | 'pink';
  onClick?: () => void;
  className?: string;
}

const colorClasses: Record<string, string> = {
  green: 'bg-green-100 text-green-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-800',
  primary: 'bg-primary/10 text-primary',
  purple: 'bg-purple-100 text-purple-800',
  pink: 'bg-pink-100 text-pink-800',
};

export function TagBadge({ label, icon, color = 'gray', onClick, className }: TagBadgeProps) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full',
        colorClasses[color],
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
    >
      {icon}
      {label}
    </span>
  );
}

export function Badge() {
  throw new Error('Badge.tsx er erstattet af TagBadge.tsx. Brug TagBadge fremover.');
}
