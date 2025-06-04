// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useXp } from '@/context/XpContext';
import { useHasMounted } from '@/hooks/useHasMounted';
import { useUserContext } from '@/context/UserContext';
import { supabase } from '@/lib/supabaseClient';

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
  Menu,
  X,
} from 'lucide-react';

const allNavItems = [
  { key: 'dashboard', href: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { key: 'todo', href: '/todo', label: 'To-Do List', icon: <ListTodo size={20} /> },
  { key: 'dates', href: '/dates', label: 'Date Ideas', icon: <Heart size={20} /> },
  { key: 'fantasy', href: '/fantasy', label: 'Parforhold', icon: <Sparkles size={20} /> },
  { key: 'manifestation', href: '/manifestation', label: 'Manifestation', icon: <Brain size={20} /> },
  { key: 'career', href: '/career', label: 'Karriere', icon: <Briefcase size={20} /> },
  { key: 'bucketlist', href: '/bucketlist', label: 'Bucketlist', icon: <Backpack size={20} /> },
  { key: 'profile', href: '/profile', label: 'Profil', icon: <Settings size={20} /> },
];

export default function Sidebar() {
  const hasMounted = useHasMounted();
  const { user, loading } = useUserContext();
  const pathname = usePathname();
  const { xp } = useXp();
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith('/settings'));
  const [allowedMenuKeys, setAllowedMenuKeys] = useState<string[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const isAdmin = user?.email === 'mads@onlinerelation.dk';



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

if (!hasMounted || loading || !user || user.access == null) return null;


 const navItems = allNavItems.filter((item) =>
  isAdmin || user.access?.[item.key] === true
);

  const navContent = (
    <>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-800 transition ${
            pathname === item.href ? 'bg-gray-700 font-semibold' : ''
          }`}
        >
          {item.icon}
          {item.label}
        </Link>
      ))}

      {isAdmin && (
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
              <Link href="/settings/points" className={subLinkClass(pathname, '/settings/points')}>Points</Link>
              <Link href="/settings/rewards" className={subLinkClass(pathname, '/settings/rewards')}>Rewards</Link>
              <Link href="/settings/categories" className={subLinkClass(pathname, '/settings/categories')}>Categories</Link>
              <Link href="/settings/access" className={subLinkClass(pathname, '/settings/access')}>Profiladgange</Link>
            </div>
          )}
        </div>
      )}
    </>
  );

  const profileLink = (
    <Link href="/profile" className="flex flex-col items-center gap-2 cursor-pointer">
      {user?.avatar_url ? (
        <img
          src={user.avatar_url}
          alt="Profilbillede"
          className="w-14 h-14 rounded-full object-cover border border-white"
        />
      ) : (
        <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center text-white text-xl font-semibold">
          {user?.display_name?.[0] ?? '👤'}
        </div>
      )}
      <div className="text-sm font-medium text-white">{user?.display_name ?? 'Bruger'}</div>
    </Link>
  );

  const bottomSection = (
    <div className="mb-6 flex flex-col items-center gap-2 px-4">
      {profileLink}
      <button
        onClick={async () => await supabase.auth.signOut()}
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
      {/* Mobil topbar */}
      <div className="md:hidden flex items-center justify-between bg-gray-900 text-white px-4 py-3 fixed top-0 left-0 right-0 z-50">
        <button onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="text-lg font-bold">✨ Mit Dashboard</span>
      </div>

      {/* Mobilmenu */}
      {mobileOpen && (
        <div
          ref={menuRef}
          className="md:hidden fixed top-[56px] left-0 right-0 bottom-0 bg-gray-900 text-white z-40 overflow-y-auto p-4 space-y-2"
        >
          {navContent}
          {bottomSection}
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex h-screen w-64 bg-gray-900 text-white shadow-lg flex-col justify-between">
        <div>
          <div className="p-6 font-bold text-xl">✨ Mit Dashboard</div>
          <nav className="flex flex-col space-y-1 px-4">{navContent}</nav>
        </div>
        {bottomSection}
      </div>
    </>
  );
}

function subLinkClass(pathname: string, target: string) {
  return `block px-3 py-1 rounded hover:bg-gray-800 transition ${
    pathname === target ? 'bg-gray-700 font-semibold' : ''
  }`;
}
