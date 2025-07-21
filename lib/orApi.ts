// lib/orTaskApi.ts

import { supabase } from '@/lib/supabaseClient';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface Task {
  id: string;
  customer_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export async function fetchCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('or_customers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createCustomer(customer: Partial<Customer>): Promise<Customer> {
  const { data, error } = await supabase
    .from('or_customers')
    .insert([customer])
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Kunne ikke oprette kunde');
  return data;
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
  const { data, error } = await supabase
    .from('or_customers')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Kunne ikke opdatere kunde');
  return data;
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from('or_customers').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchTasks(customerId?: string): Promise<Task[]> {
  let query = supabase.from('or_tasks').select('*').order('due_date', { ascending: true });
  if (customerId) query = query.eq('customer_id', customerId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createTask(task: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('or_tasks')
    .insert([task])
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Kunne ikke oprette opgave');
  return data;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('or_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Kunne ikke opdatere opgave');
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('or_tasks').delete().eq('id', id);
  if (error) throw error;
}
