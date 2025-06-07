// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useXp } from '@/context/XpContext';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useUserContext } from '@/context/UserContext';
import { supabase } from '@/lib/supabaseClient';

import { Settings, ChevronDown, ChevronRight, Menu, X } from 'lucide-react';

interface AccessEntry {
  key: string;
  label: string;
  href: string;
  children: AccessEntry[];
}

const accessHierarchy: AccessEntry[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/', children: [] },
  { key: 'todo', label: 'To-Do List', href: '/todo', children: [] },
  { key: 'dates', label: 'Date Ideas', href: '/dates', children: [] },
  { key: 'fantasy', label: 'Fantasier', href: '/fantasy', children: [] },
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
  { key: 'bucketlist', label: 'Bucketlist', href: '/bucketlist', children: [] },
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

export default function Sidebar() {
  const hasMounted = useHasMounted();
  const { user, loading } = useUserContext();
  const pathname = usePathname();
  const router = useRouter();
  const { xp } = useXp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = user?.email === 'mads@onlinerelation.dk';
  const userAccess: Record<string, boolean> = user?.access || {};

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    };
    if (mobileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileOpen]);

  useEffect(() => {
    setCheckinOpen(pathname.startsWith('/checkin'));
    setSettingsOpen(pathname.startsWith('/settings'));
  }, [pathname]);

  if (!hasMounted || loading || !user) {
    return null;
  }

  const hasAccessTo = (key: string) => {
    if (isAdmin) return true;
    return !!userAccess[key];
  };

  const navContent = accessHierarchy.map((entry) => {
    if (!hasAccessTo(entry.key)) return null;
    const anyChildVisible = entry.children.some((child) => hasAccessTo(child.key));

    if (entry.children.length > 0) {
      return (
        <div key={entry.key}>
          <button
            onClick={() => {
              if (entry.key === 'checkin') {
                setCheckinOpen((open) => !open);
              } else {
                setSettingsOpen((open) => !open);
              }
            }}
            className={`w-full flex items-center justify-between px-4 py-2 rounded hover:bg-gray-800 transition ${
              pathname.startsWith(entry.href) ? 'bg-gray-700 font-semibold' : ''
            }`}
          >
            <span className="flex items-center gap-2">{entry.label}</span>
            {entry.key === 'checkin' ? (
              checkinOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            ) : settingsOpen ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>

          {(entry.key === 'checkin' ? checkinOpen : settingsOpen) && anyChildVisible && (
            <div className="ml-6 mt-1 space-y-1">
              {entry.children.map((child) => {
                if (!hasAccessTo(child.key)) return null;
                return (
                  <button
                    key={child.key}
                    onClick={() => {
                      router.push(child.href);
                      setMobileOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-1 rounded hover:bg-gray-800 transition ${
                      pathname === child.href ? 'bg-gray-700 font-semibold' : ''
                    }`}
                  >
                    {child.label}
                  </button>
                );
              })}
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
        className={`flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-800 transition ${
          pathname === entry.href ? 'bg-gray-700 font-semibold' : ''
        }`}
      >
        {entry.label}
      </Link>
    );
  });

  const profileLink = (
    <Link href="/profile" className="flex flex-col items-center gap-2 cursor-pointer">
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt="Profilbillede"
          className="w-14 h-14 rounded-full object-cover border border-white"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-white text-xl font-semibold">
          {user.display_name?.charAt(0) ?? '👤'}
        </div>
      )}
      <div className="text-sm font-medium text-white">{user.display_name}</div>
    </Link>
  );

  const bottomSection = (
    <div className="mb-6 flex flex-col items-center gap-2 px-4">
      {profileLink}
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          router.push('/login');
        }}
        className="text-xs text-gray-300 hover:text-white"
      >
        Log ud
      </button>
      <div className="text-center bg-purple-600 text-white py-1 px-3 rounded-full text-sm font-semibold">
        🎯 XP: {xp}
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden flex items-center justify-between bg-gray-900 text-white px-4 py-3 fixed top-0 left-0 right-0 z-50">
        <button onClick={() => setMobileOpen((prev) => !prev)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />
        }</button>
        <Link href="/" className="text-lg font-bold">✨ Mit Dashboard</Link>
      </div>

      {mobileOpen && (
        <div
          ref={menuRef}
          className="md:hidden fixed top-[56px] left=0 right-0 bottom-0 bg-gray-900 text-white z-40 overflow-y-auto p-4 space-y-2"
        >
          {navContent}
          {bottomSection}
        </div>
      )}

      <div className="hidden md:flex h-screen w-64 bg-gray-900 text-white shadow-lg flex-col justify-between">
        <div>
          <Link href="/" className="p-6 font-bold text-xl">✨ Mit Dashboard</Link>
          <nav className="flex flex-col space-y-1 px-4">{navContent}</nav>
        </div>
        {bottomSection}
      </div>
    </>
  );
}