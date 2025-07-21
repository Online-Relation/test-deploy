'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Client {
  id: string;
  name: string;
  employees: Employee[];
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formular til ny kunde
  const [newClientName, setNewClientName] = useState('');

  // Formular til ny ansat
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newEmployeeEmail, setNewEmployeeEmail] = useState('');
  const [newEmployeePhone, setNewEmployeePhone] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Redigerings-state for medarbejder
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [editingEmployeeName, setEditingEmployeeName] = useState('');
  const [editingEmployeeEmail, setEditingEmployeeEmail] = useState('');
  const [editingEmployeePhone, setEditingEmployeePhone] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('or_clients')
      .select(`
        id,
        name,
        or_employees (
          id,
          name,
          email,
          phone
        )
      `)
      .order('name');

    if (error) {
      setError('Fejl ved hentning af kunder: ' + error.message);
      setClients([]);
    } else if (data) {
      const mappedClients = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        employees: c.or_employees || [],
      }));
      setClients(mappedClients);
    }
    setLoading(false);
  }

  async function createClient() {
    if (!newClientName.trim()) {
      setError('Kundenavn er påkrævet');
      return;
    }
    setError(null);
    setLoading(true);

    const { data, error } = await supabase
      .from('or_clients')
      .insert([{ name: newClientName.trim() }])
      .select()
      .maybeSingle();

    setLoading(false);

    if (error) {
      setError('Fejl ved oprettelse af kunde: ' + error.message);
      return;
    }
    if (data) {
      setClients(prev => [...prev, { ...data, employees: [] }]);
      setNewClientName('');
    }
  }

  async function createEmployee() {
    if (!selectedClientId) {
      setError('Vælg kunde for at tilføje ansat');
      return;
    }
    if (!newEmployeeName.trim()) {
      setError('Navn på ansat er påkrævet');
      return;
    }

    setError(null);
    setLoading(true);

    const { data, error } = await supabase
      .from('or_employees')
      .insert([{
        client_id: selectedClientId,
        name: newEmployeeName.trim(),
        email: newEmployeeEmail.trim() || null,
        phone: newEmployeePhone.trim() || null,
      }])
      .select()
      .maybeSingle();

    setLoading(false);

    if (error) {
      setError('Fejl ved oprettelse af ansat: ' + error.message);
      return;
    }

    if (data) {
      setClients(prev => prev.map(c => {
        if (c.id === selectedClientId) {
          return { ...c, employees: [...c.employees, data] };
        }
        return c;
      }));

      setNewEmployeeName('');
      setNewEmployeeEmail('');
      setNewEmployeePhone('');
    }
  }

  async function deleteEmployee(clientId: string, employeeId: string) {
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from('or_employees')
      .delete()
      .eq('id', employeeId);

    setLoading(false);

    if (error) {
      setError('Fejl ved sletning af medarbejder: ' + error.message);
      return;
    }

    setClients(prev =>
      prev.map(client => {
        if (client.id === clientId) {
          return {
            ...client,
            employees: client.employees.filter(emp => emp.id !== employeeId),
          };
        }
        return client;
      })
    );
  }

  function startEditingEmployee(clientId: string, employee: Employee) {
    setSelectedClientId(clientId);
    setEditingEmployeeId(employee.id);
    setEditingEmployeeName(employee.name);
    setEditingEmployeeEmail(employee.email || '');
    setEditingEmployeePhone(employee.phone || '');
  }

  async function saveEditedEmployee() {
    if (!editingEmployeeId) return;

    if (!editingEmployeeName.trim()) {
      setError('Navn på ansat er påkrævet');
      return;
    }

    setLoading(true);
    setError(null);

    const { error, data } = await supabase
      .from('or_employees')
      .update({
        name: editingEmployeeName.trim(),
        email: editingEmployeeEmail.trim() || null,
        phone: editingEmployeePhone.trim() || null,
      })
      .eq('id', editingEmployeeId)
      .select()
      .maybeSingle();

    setLoading(false);

    if (error) {
      setError('Fejl ved opdatering af medarbejder: ' + error.message);
      return;
    }

    if (data) {
      setClients(prev => prev.map(client => {
        if (client.id === selectedClientId) {
          const updatedEmployees = client.employees.map(emp =>
            emp.id === editingEmployeeId
              ? { ...emp, name: data.name, email: data.email, phone: data.phone }
              : emp
          );
          return { ...client, employees: updatedEmployees };
        }
        return client;
      }));

      cancelEditing();
    }
  }

  function cancelEditing() {
    setEditingEmployeeId(null);
    setEditingEmployeeName('');
    setEditingEmployeeEmail('');
    setEditingEmployeePhone('');
    setSelectedClientId(null);
    setError(null);
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-6">Kunder & Ansatte</h1>

      {error && <p className="text-red-600 text-center">{error}</p>}

      {/* Opret ny kunde */}
      <section className="bg-white p-4 rounded shadow max-w-xl mx-auto space-y-3">
        <h2 className="text-xl font-semibold">Opret ny kunde</h2>
        <input
          type="text"
          placeholder="Kundenavn *"
          value={newClientName}
          onChange={e => setNewClientName(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border rounded"
        />
        <button
          onClick={createClient}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {loading ? 'Opretter...' : 'Opret kunde'}
        </button>
      </section>

      {/* Tilføj ansat */}
      <section className="bg-white p-4 rounded shadow max-w-xl mx-auto space-y-3">
        <h2 className="text-xl font-semibold">Tilføj ansat til kunde</h2>

        <select
          value={selectedClientId || ''}
          onChange={e => setSelectedClientId(e.target.value || null)}
          disabled={loading || editingEmployeeId !== null}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="">Vælg kunde *</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Navn på ansat *"
          value={editingEmployeeId ? editingEmployeeName : newEmployeeName}
          onChange={e => editingEmployeeId ? setEditingEmployeeName(e.target.value) : setNewEmployeeName(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email"
          value={editingEmployeeId ? editingEmployeeEmail : newEmployeeEmail}
          onChange={e => editingEmployeeId ? setEditingEmployeeEmail(e.target.value) : setNewEmployeeEmail(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="tel"
          placeholder="Telefonnummer"
          value={editingEmployeeId ? editingEmployeePhone : newEmployeePhone}
          onChange={e => editingEmployeeId ? setEditingEmployeePhone(e.target.value) : setNewEmployeePhone(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border rounded"
        />

        {editingEmployeeId ? (
          <div className="flex gap-4">
            <button
              onClick={saveEditedEmployee}
              disabled={loading}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              {loading ? 'Gemmer...' : 'Gem ændringer'}
            </button>
            <button
              onClick={cancelEditing}
              disabled={loading}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Annuller
            </button>
          </div>
        ) : (
          <button
            onClick={createEmployee}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading ? 'Tilføjer...' : 'Tilføj ansat'}
          </button>
        )}
      </section>

      {/* Vis kunder og ansatte */}
      <section className="bg-white p-4 rounded shadow max-w-5xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Eksisterende kunder & ansatte</h2>
        {loading ? (
          <p>Indlæser...</p>
        ) : (
          <ul className="space-y-6">
            {clients.map(client => (
              <li key={client.id} className="border rounded p-4">
                <h3 className="font-semibold text-lg">{client.name}</h3>
                {client.employees.length > 0 ? (
                  <ul className="ml-4 mt-2 space-y-1 text-gray-700">
                    {client.employees.map(emp => (
                      <li key={emp.id} className="flex justify-between items-center">
                        <span>
                          {emp.name} {emp.email && `- ${emp.email}`} {emp.phone && `- ${emp.phone}`}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditingEmployee(client.id, emp)}
                            disabled={loading}
                            className="text-indigo-600 hover:text-indigo-900"
                            aria-label={`Rediger medarbejder ${emp.name}`}
                          >
                            Rediger
                          </button>
                          <button
                            onClick={() => deleteEmployee(client.id, emp.id)}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800"
                            aria-label={`Slet medarbejder ${emp.name}`}
                          >
                            Slet
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="ml-4 italic text-gray-500">Ingen ansatte tilknyttet endnu.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
