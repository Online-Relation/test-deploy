// app/online-relation/tasks/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Task {
  id: string;
  title: string;
  deadline: string;
  completed: boolean;
  completed_at?: string | null;
  priority: 'low' | 'medium' | 'high';
  customer_id: string | null;
}

interface Client {
  id: string;
  name: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Opgaveoprettelse states
  const [newTitle, setNewTitle] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newCustomerId, setNewCustomerId] = useState<string | null>(null);

  // Filter states
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  useEffect(() => {
    fetchTasks();
    fetchClients();
  }, []);

  async function fetchTasks() {
    setLoading(true);
    setError(null);

    let query = supabase.from('or_tasks').select('*').order('deadline', { ascending: true });

    if (filterPriority !== 'all') {
      query = query.eq('priority', filterPriority);
    }

    const { data, error } = await query;

    if (error) {
      setError('Fejl ved hentning af opgaver: ' + error.message);
    } else if (data) {
      setTasks(data);
    }
    setLoading(false);
  }

  async function fetchClients() {
    const { data, error } = await supabase
      .from('or_clients')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      setError('Fejl ved hentning af kunder: ' + error.message);
      setClients([]);
    } else if (data) {
      setClients(data);
    }
  }

  async function markComplete(taskId: string) {
    const completedAt = new Date().toISOString().slice(0, 10);
    setLoading(true);
    const { error } = await supabase
      .from('or_tasks')
      .update({ completed: true, completed_at: completedAt })
      .eq('id', taskId);
    setLoading(false);

    if (error) {
      setError('Fejl ved opdatering af opgave: ' + error.message);
      return;
    }
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: true, completed_at: completedAt } : t));
  }

  async function createTask() {
    if (!newTitle.trim()) {
      setError('Titel er påkrævet');
      return;
    }
    if (!newDeadline) {
      setError('Deadline er påkrævet');
      return;
    }
    if (!newCustomerId) {
      setError('Vælg en kunde');
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase.from('or_tasks').insert([{
      title: newTitle.trim(),
      deadline: newDeadline,
      completed: false,
      priority: newPriority,
      customer_id: newCustomerId,
      completed_at: null,
    }]).select().maybeSingle();

    setLoading(false);

    if (error) {
      setError('Fejl ved oprettelse: ' + error.message);
      return;
    }

    if (data) {
      setTasks(prev => [...prev, data]);
      setNewTitle('');
      setNewDeadline('');
      setNewPriority('medium');
      setNewCustomerId(null);
      setError(null);
    }
  }

  const completedOnTime = tasks.filter(t => t.completed && (!t.completed_at || t.completed_at <= t.deadline)).length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (completedOnTime / totalTasks) * 100 : 0;

  // Filter tasks lokalt efter prioritet
  const filteredTasks = filterPriority === 'all' ? tasks : tasks.filter(t => t.priority === filterPriority);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 overflow-x-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Opgaver & Statistisk Oversigt</h1>

      {/* Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-100 rounded p-4 text-center">
          <p className="font-semibold text-blue-700">Total Opgaver</p>
          <p className="text-3xl font-bold">{totalTasks}</p>
        </div>
        <div className="bg-green-100 rounded p-4 text-center">
          <p className="font-semibold text-green-700">Fuldførte Opgaver</p>
          <p className="text-3xl font-bold">{tasks.filter(t => t.completed).length}</p>
        </div>
        <div className="bg-yellow-100 rounded p-4 text-center">
          <p className="font-semibold text-yellow-700">Åbne Opgaver</p>
          <p className="text-3xl font-bold">{tasks.filter(t => !t.completed).length}</p>
        </div>
        <div className="bg-red-100 rounded p-4 text-center">
          <p className="font-semibold text-red-700">Temperatur</p>
          <p className="text-3xl font-bold">{completionRate.toFixed(0)}%</p>
          <div className="w-full h-3 bg-red-300 rounded-full mt-2 relative overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ease-in-out`}
              style={{
                width: `${completionRate}%`,
                backgroundColor:
                  completionRate > 75 ? '#16a34a' :
                    completionRate > 50 ? '#ca8a04' : '#dc2626'
              }}
            />
          </div>
        </div>
      </div>

      {/* Opgave oprettelse */}
      <section className="mb-8 bg-white rounded shadow p-4 max-w-xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Opret ny opgave</h2>
        {error && <p className="text-red-600 mb-3">{error}</p>}

        <input
          type="text"
          placeholder="Titel *"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-3"
          disabled={loading}
        />
        <input
          type="date"
          value={newDeadline}
          onChange={(e) => setNewDeadline(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-3"
          disabled={loading}
        />

        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
          className="w-full px-3 py-2 border rounded mb-3"
          disabled={loading}
        >
          <option value="low">Lav prioritet</option>
          <option value="medium">Mellem prioritet</option>
          <option value="high">Høj prioritet</option>
        </select>

        <select
          value={newCustomerId || ''}
          onChange={e => setNewCustomerId(e.target.value || null)}
          className="w-full px-3 py-2 border rounded mb-3"
          disabled={loading}
        >
          <option value="">Vælg kunde *</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>

        <button
          onClick={createTask}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? 'Opretter...' : 'Opret opgave'}
        </button>
      </section>

      {/* Prioritetsfilter */}
      <div className="mb-6 max-w-xl mx-auto flex justify-center gap-4">
        <button
          onClick={() => setFilterPriority('all')}
          className={`px-4 py-2 rounded font-semibold border ${
            filterPriority === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-100 text-gray-700 border-gray-300'
          }`}
        >
          Alle
        </button>
        <button
          onClick={() => setFilterPriority('low')}
          className={`px-4 py-2 rounded font-semibold border ${
            filterPriority === 'low' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-100 text-gray-700 border-gray-300'
          }`}
        >
          Lav
        </button>
        <button
          onClick={() => setFilterPriority('medium')}
          className={`px-4 py-2 rounded font-semibold border ${
            filterPriority === 'medium' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-100 text-gray-700 border-gray-300'
          }`}
        >
          Mellem
        </button>
        <button
          onClick={() => setFilterPriority('high')}
          className={`px-4 py-2 rounded font-semibold border ${
            filterPriority === 'high' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-100 text-gray-700 border-gray-300'
          }`}
        >
          Høj
        </button>
      </div>

      {/* Opgaver i kolonner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto overflow-x-auto">
        {/* Åbne opgaver */}
        <section className="bg-white rounded shadow p-4 max-h-[600px] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Åbne Opgaver</h2>
          {loading && <p>Indlæser...</p>}
          <ul className="space-y-3">
            {filteredTasks.filter(t => !t.completed).map(task => (
              <li key={task.id} className="p-3 border rounded hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">{task.title}</p>
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => markComplete(task.id)}
                    aria-label={`Markér ${task.title} som udført`}
                  />
                </div>
                <p className="text-sm text-gray-500">Deadline: {new Date(task.deadline).toLocaleDateString()}</p>
                <p className="text-sm text-gray-700 font-semibold">Kunde: {
                  clients.find(c => c.id === task.customer_id)?.name || 'Ukendt'
                }</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Færdige opgaver */}
        <section className="bg-white rounded shadow p-4 max-h-[600px] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">Færdige Opgaver</h2>
          <ul className="space-y-3">
            {filteredTasks.filter(t => t.completed).map(task => (
              <li key={task.id} className="p-3 border rounded bg-green-50 line-through text-gray-500 hover:bg-green-100">
                <p className="font-semibold">{task.title}</p>
                <p className="text-sm">Deadline: {new Date(task.deadline).toLocaleDateString()}</p>
                <p className="text-sm">Fuldført: {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : '-'}</p>
                <p className="text-sm text-gray-700 font-semibold">Kunde: {
                  clients.find(c => c.id === task.customer_id)?.name || 'Ukendt'
                }</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
