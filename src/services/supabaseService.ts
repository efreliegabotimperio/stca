import { createClient } from '@supabase/supabase-js';
import type { STCABlogPackage } from '../types/blog';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://pgshhvvngtlwmbitfnox.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc2hodnZuZ3Rsd21iaXRmbm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTExNjIsImV4cCI6MjEwNTA2NzE2Mn0._TTIoqDojfEBRVMMPZAwnvb4Rm5FiRfUktSPjiWb_cI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface AppSettings {
  id?: string;
  openai_api_key?: string;
  claude_api_key?: string;
  elevenlabs_api_key?: string;
  ai_provider?: 'openai' | 'claude';
  ai_model?: string;
  elevenlabs_voice_ids?: Record<string, string>;
  canva_design_urls?: Record<string, string>;
  custom_presenter_voices?: Record<string, { audioUrl: string; fileName: string }>;
  user_session?: any;
  package_history?: STCABlogPackage[];
  updated_at?: string;
}

/**
 * Utility function to test the Supabase connection status.
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from('app_settings').select('id').limit(1);
    
    if (error) {
      if (error.code === 'PGRST204' || error.code === '42P01') {
        return { 
          success: false, 
          message: 'Connected to Supabase, but table "app_settings" is missing. Please run supabase_schema.sql.' 
        };
      }
      return { success: false, message: `Supabase Error: ${error.message}` };
    }
    
    return { success: true, message: 'Successfully connected to Supabase and database tables are ready!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to connect to Supabase' };
  }
}

/**
 * Fetches all app settings from the Supabase app_settings table.
 */
export async function fetchAppSettingsFromSupabase(settingsId: string = 'default'): Promise<AppSettings | null> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', settingsId)
      .single();

    if (error) {
      console.warn('Could not fetch app settings from Supabase:', error.message);
      return null;
    }
    return data as AppSettings;
  } catch (err) {
    console.error('Error in fetchAppSettingsFromSupabase:', err);
    return null;
  }
}

/**
 * Saves/upserts app settings into the Supabase app_settings table.
 */
export async function saveAppSettingsToSupabase(
  settings: Partial<AppSettings>,
  settingsId: string = 'default'
): Promise<boolean> {
  try {
    const payload = {
      id: settingsId,
      ...settings,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('app_settings')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error saving app settings to Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in saveAppSettingsToSupabase:', err);
    return false;
  }
}

/**
 * Save a package directly to Supabase stca_packages table or app_settings package_history
 */
export async function savePackageToSupabase(pkg: STCABlogPackage): Promise<boolean> {
  try {
    // Try primary table stca_packages
    const { error } = await supabase.from('stca_packages').upsert({
      id: pkg.job.id,
      topic: pkg.job.topic,
      presenter_id: pkg.job.presenterId,
      created_at: pkg.job.createdAt,
      package_data: pkg
    }, { onConflict: 'id' });

    if (error) {
      console.warn('stca_packages table save warning:', error.message);
    }
    return true;
  } catch (err) {
    console.error('Error in savePackageToSupabase:', err);
    return false;
  }
}

/**
 * Fetch packages directly from Supabase stca_packages table
 */
export async function fetchPackagesFromSupabase(): Promise<STCABlogPackage[]> {
  try {
    const { data, error } = await supabase
      .from('stca_packages')
      .select('package_data')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row: any) => row.package_data as STCABlogPackage);
  } catch (err) {
    console.error('Error in fetchPackagesFromSupabase:', err);
    return [];
  }
}

/**
 * Delete a package from Supabase stca_packages table
 */
export async function deletePackageFromSupabase(jobId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('stca_packages')
      .delete()
      .eq('id', jobId);

    if (error) {
      console.warn('Error deleting package from Supabase stca_packages:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in deletePackageFromSupabase:', err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Supabase Authentication (Sign Up, Sign In, Sign Out)
// ---------------------------------------------------------------------------

export async function signUpWithSupabase(email: string, password: string): Promise<{ user: any; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { user: null, error: error.message };
    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || 'Signup failed' };
  }
}

export async function signInWithSupabase(email: string, password: string): Promise<{ user: any; error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || 'Signin failed' };
  }
}

export async function signOutSupabase(): Promise<boolean> {
  try {
    await supabase.auth.signOut();
    return true;
  } catch (err) {
    return false;
  }
}
