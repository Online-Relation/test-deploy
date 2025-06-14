// /components/ui/separator.tsx
import React from 'react'

export function Separator({ className = '' }: { className?: string }) {
  return <hr className={`my-6 border-t border-muted ${className}`} />
}