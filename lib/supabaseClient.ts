// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lhjunwhgvduwcaqrzojh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoanVud2hndmR1d2NhcXJ6b2poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2NTM1MzcsImV4cCI6MjA2NDIyOTUzN30.OvFxzMZlbkUZlPJpgoDyxJjhNQUbYJFhmpnJb1ItX7w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
