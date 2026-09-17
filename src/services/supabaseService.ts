import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://pgshhvvngtlwmbitfnox.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc2hodnZuZ3Rsd21iaXRmbm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTExNjIsImV4cCI6MjEwNTA2NzE2Mn0._TTIoqDojfEBRVMMPZAwnvb4Rm5FiRfUktSPjiWb_cI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Utility function to test the Supabase connection status.
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    // Attempt a light query or ping to check connection
    const { error } = await supabase.from('_stca_health_check').select('*').limit(1);
    
    // Note: If table does not exist (PGRST204 / 42P01), connection to Supabase itself succeeded
    if (error && error.code !== 'PGRST204' && error.code !== '42P01') {
      return { success: false, message: `Supabase Error: ${error.message}` };
    }
    
    return { success: true, message: 'Successfully connected to Supabase project!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to connect to Supabase' };
  }
}
