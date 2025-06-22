// app/login/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      router.push('/');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-indigo-100 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden max-w-4xl w-full animate-fade-in">
        {/* Left side with text/illustration */}
        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-blue-300 to-indigo-400 text-white p-8">
          <h2 className="text-2xl font-semibold text-center">Velkommen tilbage!</h2>
          <p className="mt-4 text-center text-sm opacity-90">
            Dinnnnn rejse mod et sjovere og mere nærværende parforhold starter her.
          </p>
          <Image
            src="/motivating-illustration.webp"
            alt="Par illustration"
            width={220}
            height={220}
            className="mt-8"
          />
        </div>

        {/* Right side with form */}
        <div className="p-8 space-y-6 w-full">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-indigo-600">Log ind</h1>
            <p className="text-sm text-gray-500 mt-1">Adgang til dit dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Adgangskode"
              className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Log ind
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center">
            Har du ikke en bruger? Kontakt admin.
          </p>
        </div>
      </div>
    </div>
  );
}
