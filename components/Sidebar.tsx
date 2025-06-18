// /components/Sidebar.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useXp } from '@/context/XpContext';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useUserContext } from '@/context/UserContext';
import { supabase } from '@/lib/supabaseClient';
import {
  LayoutDashboard,
  ListTodo,
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
  Globe,
  UserCircle,
  Heart,
} from 'lucide-react';

interface AccessEntry {
  key: string;
  label: string;
  href: string;
  children: AccessEntry[];
}

const accessHierarchy: AccessEntry[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', children: [] },
  { key: 'todo', label: 'To-Do List', href: '/todo', children: [] },
  {
    key: 'online-relation',
    label: 'Online Relation',
    href: '/online-relation',
    children: [
      { key: 'online-relation/tasks', label: 'Opgaver', href: '/online-relation/tasks', children: [] },
    ],
  },
  { key: 'tasks-couple', label: 'Opgaver', href: '/tasks-couple', children: [] },
  {
    key: 'fantasy',
    label: 'Parforhold',
    href: '/fantasy',
    children: [
      { key: 'fantasy/fantasier', label: 'Fantasier', href: '/fantasy', children: [] },
      { key: 'fantasy/parquiz', label: 'Parquiz', href: '/quiz/parquiz', children: [] },
      { key: 'fantasy/anbefalinger', label: 'Anbefalinger', href: '/fantasy/anbefalinger', children: [] },
      { key: 'dates', label: 'Date Ideas', href: '/dates', children: [] },
    ],
  },
  {
    key: 'indtjekning',
    label: 'Indtjekning',
    href: '/indtjekning',
    children: [
      { key: 'indtjekning/sex', label: 'Sex', href: '/indtjekning/sex', children: [] },
      { key: 'indtjekning/kompliment', label: 'Kompliment', href: '/indtjekning/kompliment', children: [] },
    ],
  },
  { key: 'bucketlist-couple', label: 'Bucketlist', href: '/bucketlist-couple', children: [] },
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
  {
    key: 'spil',
    label: 'Spil',
    href: '/spil/sellerk',
    children: [
      { key: 'spil/sellerk', label: 'S eller K', href: '/spil/sellerk', children: [] },
      { key: 'spil/memorygaver', label: 'Memory', href: '/spil/memorygaver', children: [] },
      { key: 'spil/quiz', label: 'Quiz', href: '/spil/quizzen', children: [] },
    ],
  },
  {
    key: 'kommunikation',
    label: 'Kommunikation',
    href: '/kommunikation/kompliment',
    children: [
      { key: 'kommunikation/spoergsmaal', label: 'Spørgsmål', href: '/kommunikation/spoergsmaal', children: [] },
      { key: 'kommunikation/random', label: 'Random', href: '/kommunikation/random', children: [] },
    ],
  },
  {
    key: 'personlighed',
    label: 'Personlighed',
    href: '/personlighed',
    children: [
      { key: 'personlighed/manifestation', label: 'Manifestation', href: '/personlighed/manifestation', children: [] },
      { key: 'personlighed/career', label: 'Karriere', href: '/personlighed/career', children: [] },
      { key: 'personlighed/tanker', label: 'Tanker', href: '/personlighed/tanker', children: [] },
    ],
  },
  { key: 'profile', label: 'Profil', href: '/profile', children: [] },
  {
    key: 'settings',
    label: 'Indstillinger',
    href: '/settings',
    children: [
      { key: 'settings/widgets/layout', label: 'Layout', href: '/settings/widgets/layout', children: [] },
      { key: 'settings/widgets', label: 'Widgets', href: '/settings/widgets', children: [] },
      { key: 'settings/recommendation', label: 'Anbefaling', href: '/settings/recommendation', children: [] },
      { key: 'settings/points', label: 'Points', href: '/settings/points', children: [] },
      { key: 'settings/rewards', label: 'Rewards', href: '/settings/rewards', children: [] },
      { key: 'settings/categories', label: 'Categories', href: '/settings/categories', children: [] },
      { key: 'settings/game-themes', label: 'Temaer', href: '/settings/game-themes', children: [] },
      { key: 'settings/access', label: 'Profiladgange', href: '/settings/access', children: [] },
      { key: 'settings/quiz-admin', label: 'Quiz admin', href: '/settings/quiz-admin', children: [] },
      { key: 'settings/couple-background', label: 'Baggrund', href: '/settings/couple-background', children: [] },
      { key: 'settings/tables', label: 'Tables', href: '/settings/tables', children: [] },
      {
        key: 'settings/gpt',
        label: 'Gpt',
        href: '/settings/gpt/api',
        children: [
          { key: 'settings/gpt/api', label: 'API kald', href: '/settings/gpt/api', children: [] },
        ],
      },
    ],
  },
];

const iconMap: Record<string, ReactNode> = {
  dashboard: <LayoutDashboard size={20} />,
  todo: <ListTodo size={20} />,
  'online-relation': <Globe size={20} />,
  'tasks-couple': <ListTodo size={20} />,
  fantasy: <Sparkles size={20} />,
  'bucketlist-couple': <Backpack size={20} />,
  checkin: <HeartHandshake size={20} />,
  manifestation: <BrainCircuit size={20} />,
  career: <Briefcase size={20} />,
  tanker: <UserCircle size={20} />,
  indtjekning: <Heart size={20} />,
  personlighed: <UserCircle size={20} />,
  profile: <Settings size={20} />,
  settings: <Settings size={20} />,
  kommunikation: <Sparkles size={20} />,
  spil: <ListTodo size={20} />,
};

export default function Sidebar() {
  const hasMounted = useHasMounted();
  const { user, loading } = useUserContext();
  const pathname = usePathname();
  const router = useRouter();
  const { xp } = useXp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const openMap = {
    fantasy: useState(false),
    checkin: useState(false),
    settings: useState(false),
    'settings/gpt': useState(false),
    spil: useState(false),
    kommunikation: useState(false),
    'online-relation': useState(false),
    personlighed: useState(false),
    indtjekning: useState(false),
  };

  useEffect(() => {
    for (const key in openMap) {
      if (pathname.startsWith(`/${key}`)) {
        openMap[key as keyof typeof openMap][1](true);
      }
    }
  }, [pathname]);

  if (!hasMounted || loading || !user) return null;

  const isAdmin = user?.email === 'mads@onlinerelation.dk';
  const userAccess: Record<string, boolean> = user?.access || {};

  const hasAccessTo = (key: string) => {
    if (key === 'dashboard') return true;
    if (isAdmin) return true;
    if (userAccess[key]) return true;
    return Object.keys(userAccess).some(k => k.startsWith(`${key}/`) && userAccess[k]);
  };

  const dashboardLink = (
    <Link
      key="dashboard"
      href="/dashboard"
      onClick={() => setMobileOpen(false)}
      className={`flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-800 transition ${pathname === '/dashboard' ? 'bg-gray-700 font-semibold' : ''}`}
    >
      {iconMap['dashboard']}
      Dashboard
    </Link>
  );

  const navContent = accessHierarchy.map(entry => {
    if (!hasAccessTo(entry.key)) return null;
    const isOpen = (entry.key in openMap) ? openMap[entry.key as keyof typeof openMap][0] : false;



    if (entry.children.length) {
      return (
        <div key={entry.key}>
          <button
            onClick={() => (entry.key in openMap) && openMap[entry.key as keyof typeof openMap][1](o => !o)}

            className={`w-full flex items-center justify-between px-4 py-2 rounded hover:bg-gray-800 transition ${pathname.startsWith(entry.href) ? 'bg-gray-700 font-semibold' : ''}`}
          >
            <span className="flex items-center gap-2">
              {iconMap[entry.key]}
              {entry.label}
            </span>
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {isOpen && (
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

  return (
    <>
      {/* Mobilmenu */}
      <div className="md:hidden flex items-center justify-between bg-gray-900 text-white px-4 py-3 fixed top-0 left-0 right-0 z-50">
        <button onClick={() => setMobileOpen(prev => !prev)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Link href="/dashboard" className="text-lg font-bold hover:underline">
          ✨ Mit Dashboard
        </Link>
      </div>

      {mobileOpen && (
        <div
          ref={menuRef}
          className="md:hidden fixed inset-0 bg-gray-900 text-white overflow-y-auto p-4 space-y-2 z-40"
        >
          {dashboardLink}
          {navContent}
        </div>
      )}

      {/* Desktopmenu */}
      <div className="hidden md:flex min-h-screen w-64 bg-gray-900 text-white flex-col justify-between pt-6">
        <div>
          <div className="p-6 text-xl font-bold">
            <Link href="/dashboard" className="hover:underline">✨ Mit Dashboard</Link>
          </div>
          <nav className="flex flex-col space-y-1 px-4 mt-4">{navContent}</nav>
        </div>
        <div className="mb-6 flex flex-col items-center gap-2 px-4">
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
      </div>
    </>
  );
}
