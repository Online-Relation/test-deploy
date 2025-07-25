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
import { DatabaseZap } from 'lucide-react';
import {
  LayoutDashboard, ListTodo, Sparkles, Backpack, HeartHandshake, Briefcase, Settings, ChevronDown, ChevronRight, Menu, X, BrainCircuit, Globe, UserCircle, Heart,CalendarDays,ClipboardCheck,MessageSquareQuote,User,Image
} from 'lucide-react';

import { accessHierarchy } from '@/lib/accessHierarchy'; // <-- brug denne!

const iconMap: Record<string, ReactNode> = {
  dashboard: <LayoutDashboard size={20} />,
  "/private-todo": <ListTodo size={20} />,
  'online-relation': <Globe size={20} />,
  'tasks-couple': <ListTodo size={20} />,
  fantasy: <Sparkles size={20} />,
  'bucketlist-couple': <Backpack size={20} />,
  checkin: <HeartHandshake size={20} />,
  manifestation: <BrainCircuit size={20} />,
  career: <Briefcase size={20} />,
  tanker: <UserCircle size={20} />,
  indtjekning: <ClipboardCheck size={20} />,
  personlighed: <UserCircle size={20} />,
  profile: <User size={20} />,
  settings: <Settings size={20} />,
  kommunikation: <Sparkles size={20} />,
  spil: <ListTodo size={20} />,
  data: <DatabaseZap size={20} />,
  intim: <Heart size={20} />,
  memories: <Image size={20} />,
  kalender: <CalendarDays size={20} />,

};

export default function Sidebar() {
  const hasMounted = useHasMounted();
  const { user, loading } = useUserContext();
  const pathname = usePathname();
  const router = useRouter();
  const { xp } = useXp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [openState, setOpenState] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const newOpenState: Record<string, boolean> = {};
    accessHierarchy.forEach(entry => {
      if (entry.href && pathname.startsWith(entry.href)) {
        newOpenState[entry.key] = true;
      }
    });
    setOpenState(os => ({ ...os, ...newOpenState }));
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

 // Indsæt i Sidebar.tsx
const renderNav = (entries: any[], level = 0) => entries.map(entry => {
  if (!hasAccessTo(entry.key)) return null;
  const isOpen = openState[entry.key] || false;
  const isSubMenu = level > 0;

  if (entry.children.length) {
    return (
      <div key={entry.key}>
        <div
          className={
            `w-full flex items-center justify-between px-4 py-2 rounded hover:bg-gray-800 transition group relative cursor-pointer` +
            (isSubMenu ? ' sidebar-submenu' : '')
          }
          onClick={() => setOpenState(os => ({ ...os, [entry.key]: !isOpen }))}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 select-none">
            {iconMap[entry.key]}
            {entry.label}
          </div>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setOpenState(os => ({ ...os, [entry.key]: !isOpen }));
            }}
            className="flex items-center px-2 py-1 ml-2 rounded hover:bg-gray-700 transition"
            aria-label={isOpen ? 'Luk' : 'Åbn'}
            tabIndex={0}
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
        {isOpen && (
          <div className="ml-6 mt-1 space-y-1">
            {renderNav(entry.children, level + 1)}
          </div>
        )}
      </div>
    );
  }

  // Ingen children: normalt link
  return (
    <Link
      key={entry.key}
      href={entry.href || '#'}
      onClick={() => setMobileOpen(false)}
      className={
        `flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-800 transition` +
        (entry.href && pathname === entry.href ? ' bg-gray-700 font-semibold' : '') +
        (isSubMenu ? ' sidebar-submenu' : '')
      }
    >
      {iconMap[entry.key]}
      {entry.label}
    </Link>
  );
});



  return (
    <>
      {/* Mobilmenu */}
      <div
  className="md:hidden flex items-center justify-between bg-gray-900 text-white px-4 py-3 fixed left-0 right-0 z-50"
  style={{
    top: 'env(safe-area-inset-top)',
    paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)', // 0.75rem er din py-3 padding
  }}
>
        <button onClick={() => setMobileOpen(prev => !prev)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <Link href="/dashboard" className="text-lg font-bold hover:underline">
          ✨ ConnectUs
        </Link>
      </div>

     {mobileOpen && (
  <div
    ref={menuRef}
    className="md:hidden fixed inset-0 bg-gray-900 text-white overflow-y-auto p-4 space-y-2 z-40"
  >
    {dashboardLink}
    {renderNav(accessHierarchy)}

    {/* --- Brugerboks og log ud på mobil --- */}
    <div className="flex flex-col items-center gap-2 mt-8">
      <Link href="/profile" className="flex flex-col items-center gap-2 cursor-pointer">
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
      <div className="text-center bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold mt-2">
        🎯 XP: {xp}
      </div>
    </div>
    {/* --- Slut brugerblok --- */}
  </div>
)}

{/* Desktopmenu */}
<div className="hidden md:flex min-h-screen w-64 bg-gray-900 text-white flex-col justify-between pt-6">
  <div>
    <div className="p-6 text-xl font-bold">
      <Link href="/dashboard" className="hover:underline">✨ ConnectUs</Link>
    </div>
    <nav className="flex flex-col space-y-1 px-4 mt-4">{renderNav(accessHierarchy)}</nav>
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
