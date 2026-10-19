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
// ---------------------------------------------------------------------------
// Supabase Authentication (Login with Email/Username + Password)
// ---------------------------------------------------------------------------

export const PRESET_STUDIO_ACCOUNTS = [
  {
    email: 'superadmin@stcastudios.com',
    username: 'SuperAdmin',
    fullName: 'Lead Super Administrator',
    role: 'superadmin' as const,
    passwords: ['123456', 'SuperAdmin2026!'],
  },
  {
    email: 'admin@stcastudios.com',
    username: 'Admin',
    fullName: 'Production Studio Admin',
    role: 'admin' as const,
    passwords: ['123456', 'Admin2026!'],
  },
  {
    email: 'user@stcastudios.com',
    username: 'StandardUser',
    fullName: 'Standard Team Member',
    role: 'standard user' as const,
    passwords: ['123456', 'User2026!'],
  },
];

export async function findEmailByUsername(identifier: string): Promise<string | null> {
  const clean = identifier.trim();
  if (clean.includes('@')) return clean.toLowerCase();

  // 1. Check preset accounts first
  const matchedPreset = PRESET_STUDIO_ACCOUNTS.find(
    (a) => a.username.toLowerCase() === clean.toLowerCase()
  );
  if (matchedPreset) return matchedPreset.email;

  // 2. Query Supabase users table
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .ilike('username', clean)
      .limit(1)
      .maybeSingle();

    if (!error && data && data.email) {
      return data.email;
    }
  } catch (e) {
    console.error('Error finding email by username:', e);
  }
  return null;
}

export async function loginWithCredentials(
  identifier: string,
  password: string
): Promise<{
  user: any;
  profile?: import('../types/blog').AppUser | null;
  role: import('../types/blog').UserRole;
  error: string | null;
}> {
  try {
    let email = identifier.trim();
    if (!email.includes('@')) {
      const foundEmail = await findEmailByUsername(email);
      if (!foundEmail) {
        return {
          user: null,
          role: 'standard user',
          error: `Username "${identifier}" was not found. Please log in with your email or register an account.`,
        };
      }
      email = foundEmail;
    }

    const preset = PRESET_STUDIO_ACCOUNTS.find(
      (a) =>
        a.email.toLowerCase() === email.toLowerCase() ||
        a.username.toLowerCase() === identifier.trim().toLowerCase()
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // If Supabase authentication returned error (e.g. user not yet seeded in auth.users)
      // and credentials match any preset account with accepted password:
      if (preset && preset.passwords.includes(password)) {
        try {
          await supabase.auth.signUp({
            email: preset.email,
            password,
            options: {
              data: {
                username: preset.username,
                full_name: preset.fullName,
                role: preset.role,
              },
            },
          });
        } catch {
          // ignore
        }

        return {
          user: {
            id: 'preset-' + preset.username.toLowerCase(),
            email: preset.email,
            user_metadata: {
              username: preset.username,
              full_name: preset.fullName,
              role: preset.role,
            },
          },
          profile: {
            id: 'preset-' + preset.username.toLowerCase(),
            email: preset.email,
            username: preset.username,
            full_name: preset.fullName,
            role: preset.role,
            status: 'active',
          },
          role: preset.role,
          error: null,
        };
      }

      return { user: null, role: 'standard user', error: error.message };
    }

    // Resolve user role
    let role: import('../types/blog').UserRole = preset?.role || 'standard user';
    let profile: import('../types/blog').AppUser | null = null;
    try {
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1)
        .maybeSingle();

      if (profileData) {
        profile = profileData;
        if (profileData.role) role = profileData.role;
      } else if (data.user?.user_metadata?.role) {
        role = data.user.user_metadata.role;
      }
    } catch {
      if (data.user?.user_metadata?.role) {
        role = data.user.user_metadata.role;
      }
    }

    return { user: data.user, profile, role, error: null };
  } catch (err: any) {
    return { user: null, role: 'standard user', error: err.message || 'Login failed' };
  }
}

export async function registerWithCredentials(
  email: string,
  password: string,
  username: string,
  role: import('../types/blog').UserRole,
  fullName?: string
): Promise<{ user: any; error: string | null }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim() || cleanEmail.split('@')[0];
    const cleanFullName = (fullName && fullName.trim()) ? fullName.trim() : cleanUsername;

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          username: cleanUsername,
          full_name: cleanFullName,
          role: role || 'standard user',
        },
      },
    });

    if (error) return { user: null, error: error.message };

    // Also register in public.users table if it exists
    try {
      await supabase.from('users').upsert({
        id: data.user?.id,
        email: cleanEmail,
        username: cleanUsername,
        full_name: cleanFullName,
        role: role || 'standard user',
        status: 'active',
      });
    } catch (dbErr) {
      console.warn('Could not upsert into public.users table:', dbErr);
    }

    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || 'Registration failed' };
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


// ---------------------------------------------------------------------------
// Supabase User Management (Roles: superadmin, admin, standard user)
// ---------------------------------------------------------------------------

export async function fetchUsersFromSupabase(): Promise<import('../types/blog').AppUser[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching users from Supabase:', error.message);
      return [];
    }
    return (data as import('../types/blog').AppUser[]) || [];
  } catch (err) {
    console.error('Error in fetchUsersFromSupabase:', err);
    return [];
  }
}

export async function createUserInSupabase(
  user: Partial<import('../types/blog').AppUser>
): Promise<{ user: import('../types/blog').AppUser | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: user.email,
        username: user.username || user.email?.split('@')[0],
        full_name: user.full_name || '',
        role: user.role || 'standard user',
        status: user.status || 'active',
      })
      .select()
      .single();

    if (error) {
      return { user: null, error: error.message };
    }
    return { user: data as import('../types/blog').AppUser, error: null };
  } catch (err: any) {
    return { user: null, error: err.message || 'Failed to create user' };
  }
}

export async function updateUserInSupabase(
  id: string,
  updates: Partial<import('../types/blog').AppUser>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update user' };
  }
}

export async function adminUpdateUserDetails(
  targetUserId: string,
  params: {
    fullName?: string;
    username?: string;
    status?: 'active' | 'suspended' | 'pending';
    role?: import('../types/blog').UserRole;
    password?: string;
  }
): Promise<{ success: boolean; error: string | null; warning?: string }> {
  try {
    let rpcSucceeded = false;
    let rpcErrorMessage: string | null = null;

    // 1. Try calling the SECURITY DEFINER RPC admin_update_user
    try {
      const { data, error } = await supabase.rpc('admin_update_user', {
        target_user_id: targetUserId,
        new_full_name: params.fullName?.trim() || null,
        new_username: params.username?.trim() || null,
        new_status: params.status || null,
        new_role: params.role || null,
        new_password: params.password?.trim() || null,
      });

      if (!error && data && data.success) {
        rpcSucceeded = true;
      } else if (error) {
        rpcErrorMessage = error.message;
      } else if (data && !data.success) {
        rpcErrorMessage = data.error || 'Failed to update user';
      }
    } catch (e: any) {
      rpcErrorMessage = e.message;
    }

    if (rpcSucceeded) {
      return { success: true, error: null };
    }

    // 2. Fallback to direct table update if RPC failed (e.g. RPC not yet executed in Supabase)
    const tablePayload: any = { updated_at: new Date().toISOString() };
    if (params.fullName !== undefined) tablePayload.full_name = params.fullName.trim();
    if (params.username !== undefined) tablePayload.username = params.username.trim();
    if (params.status !== undefined) tablePayload.status = params.status;
    if (params.role !== undefined) tablePayload.role = params.role;

    const { error: tableErr } = await supabase
      .from('users')
      .update(tablePayload)
      .eq('id', targetUserId);

    if (tableErr) {
      return { success: false, error: tableErr.message || rpcErrorMessage };
    }

    // If password was provided but RPC failed:
    if (params.password && params.password.trim().length >= 6) {
      return {
        success: true,
        error: null,
        warning: 'User details updated. (Note: Password update requires running the admin_update_user SQL script in Supabase).',
      };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update user' };
  }
}


export async function checkSuperadminExists(): Promise<{ exists: boolean; superadminEmail?: string }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'superadmin')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return { exists: true, superadminEmail: data.email };
    }
  } catch (e) {
    console.error('Error checking superadmin exists:', e);
  }
  return { exists: false };
}

export async function assignUserRoleBySuperadmin(
  targetUserId: string,
  newRole: import('../types/blog').UserRole,
  currentSuperadminId?: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    if (newRole === 'superadmin') {
      // If transferring superadmin role, demote the current superadmin to 'admin' first
      // to respect the exactly-one-superadmin unique constraint
      if (currentSuperadminId && currentSuperadminId !== targetUserId) {
        const { error: demoteErr } = await supabase
          .from('users')
          .update({ role: 'admin', updated_at: new Date().toISOString() })
          .eq('id', currentSuperadminId);

        if (demoteErr) {
          return {
            success: false,
            error: 'Could not demote existing superadmin: ' + demoteErr.message,
          };
        }
      }
    }

    const { error } = await supabase
      .from('users')
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetUserId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to assign role' };
  }
}


export async function deleteUserFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.warn('Error deleting user from Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error in deleteUserFromSupabase:', err);
    return false;
  }
}

