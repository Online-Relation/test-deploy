// src/components/online-relation/OrTaskManager.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createCustomer, createTask } from '@/lib/orApi';
import { supabase } from '@/lib/supabaseClient';

type Priority = 'low' | 'medium' | 'high';

interface Customer {
  id: string;
  name: string;
}

export default function OrTaskManager() {
  // Kunde-state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Opgave-state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');

  // Status & fejl
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Hent kunder ved mount
  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    const { data, error } = await supabase
      .from('or_customers')
      .select('id, name')
      .order('name');

    if (!error && data) setCustomers(data);
  }

  async function handleCreateCustomer() {
    setError(null);
    setSuccessMsg(null);
    if (!customerName.trim()) {
      setError('Kundenavn er påkrævet');
      return;
    }
    setLoading(true);
    try {
      // Korrekt kald med objekt som argument til createCustomer
      const newCustomer = await createCustomer({
        name: customerName.trim(),
        email: customerEmail.trim(),
        phone: customerPhone.trim(),
      });
      setCustomers((prev) => [...prev, newCustomer]);
      setSelectedCustomerId(newCustomer.id);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setSuccessMsg('Kunden er oprettet');
    } catch (e: any) {
      setError(e.message || 'Fejl ved oprettelse af kunde');
    }
    setLoading(false);
  }

  async function handleCreateTask() {
    setError(null);
    setSuccessMsg(null);
    if (!taskTitle.trim()) {
      setError('Titel på opgave er påkrævet');
      return;
    }
    if (!selectedCustomerId) {
      setError('Vælg en kunde til opgaven');
      return;
    }
    setLoading(true);
    try {
      // Korrekt kald med et objekt eller samme argumentstruktur som createTask forventer
      await createTask({
  customer_id: selectedCustomerId,
  title: taskTitle.trim(),
  description: taskDescription.trim(),
  due_date: taskDueDate || undefined,  // <-- her ændret fra null til undefined
  priority: taskPriority,
});

      setTaskTitle('');
      setTaskDescription('');
      setTaskDueDate('');
      setTaskPriority('medium');
      setSuccessMsg('Opgave er oprettet');
    } catch (e: any) {
      setError(e.message || 'Fejl ved oprettelse af opgave');
    }
    setLoading(false);
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-8 bg-white rounded shadow">
      <h2 className="text-2xl font-bold">Kunde & Opgave Manager</h2>

      {/* Kundeoprettelse */}
      <section className="space-y-3 border-b pb-4">
        <h3 className="font-semibold text-lg">Opret ny kunde</h3>
        <input
          type="text"
          placeholder="Kundenavn *"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          disabled={loading}
        />
        <input
          type="email"
          placeholder="Email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          disabled={loading}
        />
        <input
          type="tel"
          placeholder="Telefonnummer"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          disabled={loading}
        />
        <button
          onClick={handleCreateCustomer}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {loading ? 'Opretter...' : 'Opret kunde'}
        </button>
      </section>

      {/* Opgaveoprettelse */}
      <section className="space-y-3">
        <h3 className="font-semibold text-lg">Opret opgave</h3>

        <select
          value={selectedCustomerId || ''}
          onChange={(e) => setSelectedCustomerId(e.target.value || null)}
          disabled={loading}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">Vælg kunde *</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Opgavetitel *"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          disabled={loading}
        />

        <textarea
          placeholder="Beskrivelse"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          rows={3}
          disabled={loading}
        />

        <input
          type="date"
          value={taskDueDate}
          onChange={(e) => setTaskDueDate(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          disabled={loading}
        />

        <select
          value={taskPriority}
          onChange={(e) => setTaskPriority(e.target.value as Priority)}
          className="w-full px-3 py-2 border rounded"
          disabled={loading}
        >
          <option value="low">Lav</option>
          <option value="medium">Mellem</option>
          <option value="high">Høj</option>
        </select>

        <button
          onClick={handleCreateTask}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? 'Opretter...' : 'Opret opgave'}
        </button>
      </section>

      {error && <p className="text-red-600 mt-4">{error}</p>}
      {successMsg && <p className="text-green-600 mt-4">{successMsg}</p>}
    </div>
  );
}
