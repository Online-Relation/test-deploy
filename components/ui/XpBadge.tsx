// /components/ui/XpBadge.tsx
import React from 'react';
import { cn } from '@/lib/utils';

export default function XpBadge({
  xp,
  size = 'small',
  variant = 'default',
}: {
  xp: number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'success';
}) {
  const sizeClass = {
    small: 'text-xs px-2 py-0.5',
    medium: 'text-sm px-3 py-1',
    large: 'text-base px-4 py-1.5',
  }[size];

  const variantClass = {
    default: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    success: 'bg-green-100 text-green-800 border-green-300',
  }[variant];

  return (
    <span
      className={cn(
        'inline-block rounded-full font-semibold border',
        sizeClass,
        variantClass
      )}
    >
      🎯 {xp} XP
    </span>
  );
}
