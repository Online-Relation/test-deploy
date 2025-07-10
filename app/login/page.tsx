// app/login/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(''); // Email eller username
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    let email = identifier.trim();

    // Hvis det IKKE ligner en email, så antag det er username:
    if (!email.includes('@')) {
      // Find email ud fra username
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', email)
        .maybeSingle();

      if (error || !data?.email) {
        alert('Brugernavn findes ikke.');
        setLoading(false);
        return;
      }
      email = data.email;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

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
            Din rejse mod et sjovere og mere nærværende parforhold starter her.
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
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Email eller brugernavn"
              autoComplete="username"
              className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={loading}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Adgangskode"
              autoComplete="current-password"
              className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
              disabled={loading}
            />
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
              disabled={loading}
            >
              {loading ? 'Logger ind...' : 'Log ind'}
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
