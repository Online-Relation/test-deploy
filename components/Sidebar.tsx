// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
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
} from 'lucide-react';

const allNavItems = [
  { key: 'dashboard', href: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { key: 'todo', href: '/todo', label: 'To-Do List', icon: <ListTodo size={20} /> },
  { key: 'dates', href: '/dates', label: 'Date Ideas', icon: <Heart size={20} /> },
  { key: 'fantasy', href: '/fantasy', label: 'Fantasier', icon: <Sparkles size={20} /> },
  { key: 'manifestation', href: '/manifestation', label: 'Manifestation', icon: <Brain size={20} /> },
  { key: 'career', href: '/career', label: 'Karriere', icon: <Briefcase size={20} /> },
  { key: 'bucketlist', href: '/bucketlist', label: 'Bucketlist', icon: <Backpack size={20} /> },
];

export default function Sidebar() {
  const hasMounted = useHasMounted();
  const { user, loading } = useUserContext();
  const pathname = usePathname();
  const { xp } = useXp();
  const [settingsOpen, setSettingsOpen] = useState(pathname.startsWith('/settings'));
  const [allowedMenuKeys, setAllowedMenuKeys] = useState<string[]>([]);

  const isAdmin = user?.email === 'mads@onlinerelation.dk';
  

useEffect(() => {
  if (!user) return;

  const isAdmin = user.email === 'mads@onlinerelation.dk';

  const fetchAccess = async () => {
    if (isAdmin) {
      setAllowedMenuKeys(allNavItems.map((item) => item.key));
      return;
    }

    const { data, error } = await supabase
      .from('access_control')
      .select('menu_key')
      .eq('user_id', user.id)
      .eq('allowed', true);

    if (error) {
      console.error('Fejl ved hentning af adgang:', error.message);
      return;
    }

    const keys = data?.map((row) => row.menu_key) || [];
    setAllowedMenuKeys(keys);
  };

  fetchAccess();
}, [user?.id]);



  if (!hasMounted || loading || !user) return null;

  const navItems = allNavItems.filter((item) => allowedMenuKeys.includes(item.key));

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

function subLinkClass(pathname: string, target: string) {
  return `block px-3 py-1 rounded hover:bg-gray-800 transition ${
    pathname === target ? 'bg-gray-700 font-semibold' : ''
  }`;
}
