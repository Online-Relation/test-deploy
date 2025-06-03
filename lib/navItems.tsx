import {
  LayoutDashboard,
  Heart,
  Sparkles,
  ListTodo,
  Briefcase,
  Backpack,
  Brain,
} from 'lucide-react';

export const navItems = [
  { key: 'dashboard', href: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { key: 'todo', href: '/todo', label: 'To-Do List', icon: <ListTodo size={20} /> },
  { key: 'dates', href: '/dates', label: 'Date Ideas', icon: <Heart size={20} /> },
  { key: 'fantasy', href: '/fantasy', label: 'Fantasier', icon: <Sparkles size={20} /> },
  { key: 'manifestation', href: '/manifestation', label: 'Manifestation', icon: <Brain size={20} /> },
  { key: 'career', href: '/career', label: 'Karriere', icon: <Briefcase size={20} /> },
  { key: 'bucketlist', href: '/bucketlist', label: 'Bucketlist', icon: <Backpack size={20} /> },
];
