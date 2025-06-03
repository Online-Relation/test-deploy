'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Task {
  id: string;
  title: string;
  deadline: string;
  done: boolean;
  created_at: string;
}

export default function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase.from('tasks').select('*');
      if (error) {
        console.error('Fejl ved hentning fra Supabase:', error.message);
      } else {
        setTasks(data);
      }
    };
    fetchTasks();
  }, []);

  const addTask = async () => {
    if (!input.trim()) return;
    const newTask = {
      title: input,
      deadline,
      done: false,
    };
    const { data, error } = await supabase.from('tasks').insert([newTask]).select();
    if (error) {
      console.error('Fejl ved tilføjelse til Supabase:', error.message);
    } else if (data) {
      setTasks(prev => [...prev, ...data]);
      setInput('');
      setDeadline('');
    }
  };

  const toggleTask = async (task: Task) => {
    const updated = { ...task, done: !task.done };
    const { error } = await supabase.from('tasks').update({ done: updated.done }).eq('id', task.id);
    if (error) {
      console.error('Fejl ved opdatering:', error.message);
    } else {
      setTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
    }
  };

  const completedTasks = tasks.filter(t => t.done);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const tasksThisYear = tasks.filter(t => new Date(t.created_at).getFullYear() === currentYear);
  const tasksThisMonth = tasks.filter(t => {
    const d = new Date(t.created_at);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">📝 Din To Do-liste</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">📅 Opgaver i år</h2>
          <p className="text-xl font-bold text-blue-600">{tasksThisYear.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">🗓️ Denne måned</h2>
          <p className="text-xl font-bold text-blue-600">{tasksThisMonth.length}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-semibold mb-2">✔️ Færdige opgaver</h2>
          <p className="text-xl font-bold text-green-600">{completedTasks.length}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Skriv en ny opgave..."
          className="w-full px-3 py-2 border rounded mb-2"
        />
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-2"
        />
        <button
          onClick={addTask}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Tilføj opgave
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-2">Aktive opgaver</h2>
        {tasks.filter(t => !t.done).map(task => (
          <div key={task.id} className="p-3 mb-2 border rounded flex justify-between items-start">
            <div>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task)}
                className="mr-2"
              />
              <span>{task.title}</span>
              <p className="text-sm text-gray-500">
                {task.deadline ? `Deadline: ${task.deadline}` : 'Ingen deadline'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">✔️ Færdige opgaver</h2>
        {completedTasks.length === 0 ? (
          <p className="text-sm text-gray-400">Ingen endnu</p>
        ) : (
          <ul className="list-disc pl-5 text-sm text-gray-600">
            {completedTasks.map(task => (
              <li key={task.id}>{task.title} ({task.deadline || 'Ingen deadline'})</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
