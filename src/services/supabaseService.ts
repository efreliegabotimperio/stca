import { createClient } from '@supabase/supabase-js';

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
          message: 'Connected to Supabase, but the table "app_settings" does not exist yet. Please run supabase_schema.sql in the Supabase SQL Editor.' 
        };
      }
      return { success: false, message: `Supabase Error: ${error.message}` };
    }
    
    return { success: true, message: 'Successfully connected to Supabase and app_settings table is ready!' };
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
