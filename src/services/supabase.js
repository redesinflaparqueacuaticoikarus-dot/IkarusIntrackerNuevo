import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykebwfopnuzmxkrgtwvx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZWJ3Zm9wbnV6bXhrcmd0d3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxODYwMDQsImV4cCI6MjA5MTc2MjAwNH0.hH1TPz8ahu4G3pjhXjWiPxP27K5b6JRvMH9lqkJBFqo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
