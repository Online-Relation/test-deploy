// src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useXp } from '../context/XpContext';
import {
  LayoutDashboard,
  Heart,
  Sparkles,
  Settings,
  ListTodo,
  Briefcase,
  Backpack,
  Brain,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { href: '/todo', label: 'To-Do List', icon: <ListTodo size={20} /> },
  { href: '/dates', label: 'Date Ideas', icon: <Heart size={20} /> },
  { href: '/fantasy', label: 'Fantasier', icon: <Sparkles size={20} /> },
  { href: '/manifestation', label: 'Manifestation', icon: <Brain size={20} /> },
  { href: '/career', label: 'Karriere', icon: <Briefcase size={20} /> },
  { href: '/bucketlist', label: 'Bucketlist', icon: <Backpack size={20} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { xp } = useXp();

  return (
    <div className="h-screen w-64 bg-gray-900 text-white shadow-lg flex flex-col justify-between">
      <div>
        <div className="p-6 font-bold text-xl">✨ Mit Dashboard</div>
        <nav className="flex flex-col space-y-1 px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-800 transition ${
                pathname === item.href ? 'bg-gray-700 font-semibold' : ''
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mb-6 px-4 space-y-3">
        <Link
          href="/settings"
          className={`flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-800 transition ${
            pathname === '/settings' ? 'bg-gray-700 font-semibold' : ''
          }`}
        >
          <Settings size={20} />
          Indstillinger
        </Link>

        <div className="text-center bg-purple-600 text-white py-1 px-3 rounded-full text-sm font-semibold">
          🎯 XP: {xp}
        </div>
      </div>
    </div>
  );
}