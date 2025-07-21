// /app/profile/page.tsx

'use client';

import React, { useState } from 'react';

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState('Mads Petersen');
  const [fullName, setFullName] = useState('Mads Frederik Petersen');
  const [email, setEmail] = useState('mads@example.com');
  const [phone, setPhone] = useState('+45 12 34 56 78');
  const [dopamineTriggers, setDopamineTriggers] = useState('Solopgang, Kaffe, Musik');
  const [relationshipGoals, setRelationshipGoals] = useState('Være mere tilstede, kommunikation');

  const handleSave = () => {
    alert('Profil gemt! (Dummy)');
  };

  return (
    <main className="flex min-h-screen bg-gray-50 text-gray-800">
      {/* Venstremenu */}
      <nav className="w-64 bg-white p-6 border-r border-gray-200">
        <div className="flex flex-col items-center mb-10">
          <img
            src="https://i.pravatar.cc/100?img=12"
            alt="Avatar"
            className="rounded-full w-24 h-24 mb-3"
          />
          <h2 className="font-semibold text-xl">{displayName}</h2>
          <p className="text-sm text-gray-500">Profil</p>
        </div>
        <ul className="space-y-4 text-sm font-medium">
          <li className="text-indigo-600 cursor-pointer">Konto</li>
          <li className="hover:text-indigo-600 cursor-pointer">Notifikationer</li>
          <li className="hover:text-indigo-600 cursor-pointer">Sikkerhed</li>
          <li className="hover:text-indigo-600 cursor-pointer">Indstillinger</li>
        </ul>
      </nav>

      {/* Indhold */}
      <section className="flex-1 p-8 max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Min Profil</h1>
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded font-semibold"
          >
            Gem
          </button>
        </header>

        {/* Konto sektion */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2 mb-4">Kontoindstillinger</h2>

          <div className="flex items-center space-x-8">
            <div>
              <img
                src="https://i.pravatar.cc/100?img=12"
                alt="Avatar"
                className="rounded-full w-20 h-20"
              />
              <button
                className="mt-2 text-indigo-600 hover:underline text-sm"
                type="button"
              >
                Skift avatar
              </button>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Visningsnavn</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fulde navn</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefonnummer</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Energi & Dopamin */}
        <div className="bg-white rounded-lg shadow p-6 mt-8 space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Energi & Dopamin</h2>

          <label className="block text-sm font-medium mb-1">Dopamin triggers</label>
          <input
            type="text"
            value={dopamineTriggers}
            onChange={(e) => setDopamineTriggers(e.target.value)}
            placeholder="Skriv triggers adskilt med komma"
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {/* Parforhold */}
        <div className="bg-white rounded-lg shadow p-6 mt-8 space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Parforholdsmål</h2>

          <textarea
            rows={4}
            value={relationshipGoals}
            onChange={(e) => setRelationshipGoals(e.target.value)}
            placeholder="Hvilke mål har du for jeres parforhold?"
            className="w-full p-2 border border-gray-300 rounded resize-none"
          />
        </div>
      </section>
    </main>
  );
}
