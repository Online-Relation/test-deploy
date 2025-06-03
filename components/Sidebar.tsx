// src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useXp } from '@/context/XpContext';
import {
  LayoutDashboard,
  Heart,
  Sparkles,
  Settings,
  ListTodo,
  Briefcase,
  Backpack,
  Brain,
  ChevronDown,
  ChevronRight,
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
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith('/settings'));

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

          {/* Dropdown for Indstillinger */}
          <div>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`w-full flex items-center justify-between gap-2 px-4 py-2 rounded hover:bg-gray-800 transition ${
                pathname.startsWith('/settings') ? 'bg-gray-700 font-semibold' : ''
              }`}
            >
              <span className="flex items-center gap-2">
                <Settings size={20} />
                Indstillinger
              </span>
              {settingsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {settingsOpen && (
              <div className="ml-6 mt-1 space-y-1">
                <Link
                  href="/settings/points"
                  className={`block px-3 py-1 rounded hover:bg-gray-800 transition ${
                    pathname === '/settings/points' ? 'bg-gray-700 font-semibold' : ''
                  }`}
                >
                  Points
                </Link>
                <Link
                  href="/settings/rewards"
                  className={`block px-3 py-1 rounded hover:bg-gray-800 transition ${
                    pathname === '/settings/rewards' ? 'bg-gray-700 font-semibold' : ''
                  }`}
                >
                  Rewards
                </Link>
                <Link
                  href="/settings/categories"
                  className={`block px-3 py-1 rounded hover:bg-gray-800 transition ${
                    pathname === '/settings/categories' ? 'bg-gray-700 font-semibold' : ''
                  }`}
                >
                  Categories
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="mb-6 px-4">
        <div className="text-center bg-purple-600 text-white py-1 px-3 rounded-full text-sm font-semibold">
          🎯 XP: {xp}
        </div>
      </div>
    </div>
  );
}
