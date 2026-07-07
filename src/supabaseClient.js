import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are placeholders or missing
export const isMockMode = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl === '' || 
  supabaseUrl.includes('your-project-id') || 
  supabaseAnonKey === '' || 
  supabaseAnonKey.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');

let supabaseClient = null;

if (!isMockMode) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
  }
}

export const supabase = supabaseClient;
