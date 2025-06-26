import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gwzbofssvyydmzggurpm.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3emJvZnNzdnl5ZG16Z2d1cnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NDkzODUsImV4cCI6MjA2NjQyNTM4NX0.93I8bxan5t5PdYT4u67JXobFEEwKaaHi3C5UgUt5edQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
