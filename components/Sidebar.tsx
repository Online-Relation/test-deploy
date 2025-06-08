// /components/Sidebar.tsx
'use client';

import React from 'react';
import type { ReactNode } from 'react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useXp } from '@/context/XpContext';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useUserContext } from '@/context/UserContext';
import { supabase } from '@/lib/supabaseClient';
import {
  LayoutDashboard,
  ListTodo,
  Heart,
  Sparkles,
  Backpack,
  HeartHandshake,
  Briefcase,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  BrainCircuit,
} from 'lucide-react';

interface AccessEntry {
  key: string;
  label: string;
  href: string;
  children: AccessEntry[];
}

const accessHierarchy: AccessEntry[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/', children: [] },
  { key: 'todo', label: 'To-Do List', href: '/todo', children: [] },
  {
    key: 'fantasy',
    label: 'Parforhold',
    href: '/fantasy',
    children: [
      { key: 'fantasy/fantasier', label: 'Fantasier', href: '/fantasy', children: [] },
      { key: 'dates', label: 'Date Ideas', href: '/dates', children: [] },
      { key: 'bucketlist-couple', label: 'Bucketlist', href: '/bucketlist-couple', children: [] },
    ],
  },
  {
    key: 'checkin',
    label: 'Check-in',
    href: '/checkin',
    children: [
      { key: 'checkin/oversigt', label: 'Oversigt', href: '/checkin/oversigt', children: [] },
      { key: 'checkin/mine-behov', label: 'Mine behov', href: '/checkin/mine-behov', children: [] },
      { key: 'checkin/historik', label: 'Historik', href: '/checkin/historik', children: [] },
      { key: 'checkin/evaluering', label: 'Evaluering', href: '/checkin/evaluering', children: [] },
    ],
  },
  { key: 'manifestation', label: 'Manifestation', href: '/manifestation', children: [] },
  { key: 'career', label: 'Karriere', href: '/career', children: [] },
  { key: 'profile', label: 'Profil', href: '/profile', children: [] },
  {
    key: 'settings',
    label: 'Indstillinger',
    href: '/settings',
    children: [
      { key: 'settings/points', label: 'Points', href: '/settings/points', children: [] },
      { key: 'settings/rewards', label: 'Rewards', href: '/settings/rewards', children: [] },
      { key: 'settings/categories', label: 'Categories', href: '/settings/categories', children: [] },
      { key: 'settings/access', label: 'Profiladgange', href: '/settings/access', children: [] },
    ],
  },
];

const iconMap: Record<string, ReactNode> = {
  dashboard: <LayoutDashboard size={20} />,
  todo: <ListTodo size={20} />,
  dates: <Heart size={20} />,
  fantasy: <Sparkles size={20} />,
  'fantasy/fantasier': <Sparkles size={20} />,
  'bucketlist-couple': <Backpack size={20} />,
  checkin: <HeartHandshake size={20} />,
  manifestation: <BrainCircuit size={20} />,
  career: <Briefcase size={20} />,
  profile: <Settings size={20} />,
  settings: <Settings size={20} />,
};

export default function Sidebar() {
  const hasMounted = useHasMounted();
  const { user, loading } = useUserContext();
  const pathname = usePathname();
  const router = useRouter();
  const { xp } = useXp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [fantasyOpen, setFantasyOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = user?.email === 'mads@onlinerelation.dk';
  const userAccess: Record<string, boolean> = user?.access || {};

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    if (mobileOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileOpen]);

  useEffect(() => {
    setFantasyOpen(pathname.startsWith('/fantasy'));
    setCheckinOpen(pathname.startsWith('/checkin'));
    setSettingsOpen(pathname.startsWith('/settings'));
  }, [pathname]);

  if (!hasMounted || loading || !user) return null;

  const hasAccessTo = (key: string) => isAdmin || !!userAccess[key];

  const navContent = accessHierarchy.map(entry => {
    if (!hasAccessTo(entry.key)) return null;
    const anyChild = entry.children.some(c => hasAccessTo(c.key));
    const isOpen = entry.key === 'fantasy' ? fantasyOpen :
                   entry.key === 'checkin' ? checkinOpen : settingsOpen;

    if (entry.children.length) {
      return (
        <div key={entry.key}>
          <button
            onClick={() => {
              if (entry.key === 'fantasy') setFantasyOpen(o => !o);
              if (entry.key === 'checkin') setCheckinOpen(o => !o);
              if (entry.key === 'settings') setSettingsOpen(o => !o);
              // Menumen forbliver åben på mobil, når du åbner undermenuer
            }}
            className={`w-full flex items-center justify-between px-4 py-2 rounded hover:bg-gray-800 transition ${pathname.startsWith(entry.href) ? 'bg-gray-700 font-semibold' : ''}`}
          >
            <span className="flex items-center gap-2">
              {iconMap[entry.key]}
              {entry.label}
            </span>
            {isOpen ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
          </button>
          {isOpen && anyChild && (
            <div className="ml-6 mt-1 space-y-1">
              {entry.children.map(child => hasAccessTo(child.key) && (
                <Link
                  key={child.key}
                  href={child.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-800 transition ${pathname === child.href ? 'bg-gray-700 font-semibold' : ''}`}
                >
                  {iconMap[child.key]}
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={entry.key}
        href={entry.href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-800 transition ${pathname === entry.href ? 'bg-gray-700 font-semibold' : ''}`}
      >
        {iconMap[entry.key]}
        {entry.label}
      </Link>
    );
  });

  const profileLink = (
    <Link href="/profile" className="flex flex-col items-center gap-2 cursor-pointer mt-6">
      {user.avatar_url ? (
        <img src={user.avatar_url} className="w-14 h-14 rounded-full" alt="avatar" />
      ) : (
        <div className="w-14 h-14 rounded-full bg-gray-700 text-white flex items-center justify-center font-semibold">
          {user.display_name?.[0] || '👤'}
        </div>
      )}
      <div className="text-sm font-medium text-white">{user.display_name}</div>
    </Link>
  );

  const bottomSection = (
    <div className="mb-6 flex flex-col items-center gap-2 px-4">
      {profileLink}
      <button
        onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
        className="text-xs text-gray-300 hover:text-white"
      >
        Log ud
      </button>
      <div className="text-center bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
        🎯 XP: {xp}
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden flex items-center justify-between bg-gray-900 text-white px-4 py-3 fixed top-0 left-0 right-0 z-50">
        <button onClick={() => setMobileOpen(prev => !prev)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="text-lg font-bold">✨ Mit Dashboard</span>
      </div>
      {mobileOpen && (
        <div
          ref={menuRef}
          className="md:hidden fixed inset-0 bg-gray-900 text-white overflow-y-auto p-4 space-y-2 z-40"
        >
          {navContent}
          {bottomSection}
        </div>
      )}
      <div className="hidden md:flex h-screen w-64 bg-gray-900 text-white flex-col justify-between pt-6">
        <div>
          <div className="p-6 text-xl font-bold">✨ Mit Dashboard</div>
          <nav className="flex flex-col space-y-1 px-4 mt-4">{navContent}</nav>
        </div>
        {bottomSection}
      </div>
    </>
  );
}
