import { createClient } from '@supabase/supabase-js';

// PASTE YOUR SUPABASE PROJECT URL And ANON KEY HERE
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
