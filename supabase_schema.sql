-- SQL Script: Setup app_settings & stca_packages tables in Supabase for STCA App
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/pgshhvvngtlwmbitfnox/sql

-- 1. App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  openai_api_key TEXT DEFAULT '',
  claude_api_key TEXT DEFAULT '',
  elevenlabs_api_key TEXT DEFAULT '',
  ai_provider TEXT DEFAULT 'openai',
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  elevenlabs_voice_ids JSONB DEFAULT '{}'::jsonb,
  canva_design_urls JSONB DEFAULT '{}'::jsonb,
  custom_presenter_voices JSONB DEFAULT '{}'::jsonb,
  user_session JSONB DEFAULT '{}'::jsonb,
  package_history JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure package_history column exists if table already existed
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS package_history JSONB DEFAULT '[]'::jsonb;

-- Enable Row Level Security (RLS) for app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read/write to app_settings" ON public.app_settings;
CREATE POLICY "Allow public read/write to app_settings" ON public.app_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert initial default row
INSERT INTO public.app_settings (id, ai_provider, ai_model)
VALUES ('default', 'openai', 'gpt-4o-mini')
ON CONFLICT (id) DO NOTHING;

-- 2. STCA Packages History Table
CREATE TABLE IF NOT EXISTS public.stca_packages (
  id TEXT PRIMARY KEY,
  topic TEXT,
  presenter_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  package_data JSONB NOT NULL
);

-- Enable RLS for stca_packages
ALTER TABLE public.stca_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read/write to stca_packages" ON public.stca_packages;
CREATE POLICY "Allow public read/write to stca_packages" ON public.stca_packages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. Users Table (User Management)
-- Roles allowed: 'superadmin', 'admin', 'standard user' ONLY
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'standard user' CHECK (role IN ('superadmin', 'admin', 'standard user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ
);

-- Index for fast user lookup by email and role
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);

-- CRITICAL RULE: Exactly ONE superadmin allowed in the entire system
CREATE UNIQUE INDEX IF NOT EXISTS idx_only_one_superadmin 
ON public.users (role) 
WHERE role = 'superadmin';


-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public / authenticated read/write access for the STCA app
DROP POLICY IF EXISTS "Allow public read/write to users" ON public.users;
CREATE POLICY "Allow public read/write to users" ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function & Trigger: Automatically keep updated_at up to date
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger: Automatically sync new signups from Supabase Auth (auth.users) into public.users
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'standard user')
  )
  ON CONFLICT (email) DO UPDATE
  SET id = EXCLUDED.id,
      username = COALESCE(public.users.username, EXCLUDED.username),
      full_name = COALESCE(public.users.full_name, EXCLUDED.full_name),
      updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 4. Passwords & Initial Studio Accounts Setup (SuperAdmin, Admin, StandardUser)
-- Enable pgcrypto for industry-standard bcrypt password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Seed all 3 default roles into Supabase Auth (auth.users) and public.users:
-- 1) SuperAdmin    : superadmin@stcastudios.com | Password: SuperAdmin2026! or 123456
-- 2) Admin         : admin@stcastudios.com      | Password: 123456
-- 3) StandardUser  : user@stcastudios.com       | Password: 123456
DO $$
DECLARE
  rec RECORD;
  u_id UUID;
BEGIN
  FOR rec IN
    SELECT 
      'superadmin@stcastudios.com'::TEXT as email,
      'SuperAdmin'::TEXT as username,
      'Lead Super Administrator'::TEXT as full_name,
      'superadmin'::TEXT as role,
      '123456'::TEXT as plain_pwd
    UNION ALL
    SELECT 
      'admin@stcastudios.com',
      'Admin',
      'Production Studio Admin',
      'admin',
      '123456'
    UNION ALL
    SELECT 
      'user@stcastudios.com',
      'StandardUser',
      'Standard Team Member',
      'standard user',
      '123456'
  LOOP
    -- 1. Upsert public.users
    INSERT INTO public.users (email, username, full_name, role, status)
    VALUES (rec.email, rec.username, rec.full_name, rec.role, 'active')
    ON CONFLICT (email) DO UPDATE
    SET username = EXCLUDED.username,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        status = 'active',
        updated_at = NOW()
    RETURNING id INTO u_id;

    -- 2. Insert or update auth.users with confirmed password '123456'
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = rec.email) THEN
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        role,
        aud,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      )
      VALUES (
        COALESCE(u_id, gen_random_uuid()),
        '00000000-0000-0000-0000-000000000000',
        rec.email,
        crypt(rec.plain_pwd, gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('username', rec.username, 'full_name', rec.full_name, 'role', rec.role),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated',
        '',
        '',
        '',
        ''
      );
    ELSE
      UPDATE auth.users
      SET encrypted_password = crypt(rec.plain_pwd, gen_salt('bf')),
          email_confirmed_at = NOW(),
          raw_user_meta_data = jsonb_build_object('username', rec.username, 'full_name', rec.full_name, 'role', rec.role),
          confirmation_token = COALESCE(confirmation_token, ''),
          email_change = COALESCE(email_change, ''),
          email_change_token_new = COALESCE(email_change_token_new, ''),
          recovery_token = COALESCE(recovery_token, ''),
          updated_at = NOW()
      WHERE email = rec.email;
    END IF;
  END LOOP;

  -- Ensure any other auth.users rows have empty strings instead of NULL for internal tokens
  UPDATE auth.users
  SET 
    confirmation_token = COALESCE(confirmation_token, ''),
    email_change = COALESCE(email_change, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    recovery_token = COALESCE(recovery_token, '')
  WHERE confirmation_token IS NULL 
     OR email_change IS NULL 
     OR email_change_token_new IS NULL 
     OR recovery_token IS NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Function: admin_update_user
-- Allows Superadmin to update user profile details and reset user password
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_user(
  target_user_id TEXT,
  new_full_name TEXT DEFAULT NULL,
  new_username TEXT DEFAULT NULL,
  new_status TEXT DEFAULT NULL,
  new_role TEXT DEFAULT NULL,
  new_password TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_uuid UUID;
  v_email TEXT;
  v_current_role TEXT;
BEGIN
  -- Attempt UUID conversion
  BEGIN
    v_uuid := target_user_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_uuid := NULL;
  END;

  -- Locate user in public.users
  SELECT email, role INTO v_email, v_current_role
  FROM public.users
  WHERE (v_uuid IS NOT NULL AND id = v_uuid) OR id::TEXT = target_user_id OR email = target_user_id;

  -- Fallback to auth.users if not found in public.users
  IF v_email IS NULL AND v_uuid IS NOT NULL THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_uuid;
  END IF;

  IF v_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Prevent creating another superadmin if constraint applies
  IF new_role = 'superadmin' AND v_current_role <> 'superadmin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only one superadmin is allowed in the system.');
  END IF;

  -- Update public.users
  UPDATE public.users
  SET
    full_name = COALESCE(NULLIF(trim(new_full_name), ''), full_name),
    username = COALESCE(NULLIF(trim(new_username), ''), username),
    status = CASE 
      WHEN new_status IN ('active', 'suspended', 'pending') THEN new_status 
      ELSE status 
    END,
    role = CASE 
      WHEN v_current_role = 'superadmin' THEN 'superadmin'
      WHEN new_role IN ('admin', 'standard user') THEN new_role 
      ELSE role 
    END,
    updated_at = NOW()
  WHERE (v_uuid IS NOT NULL AND id = v_uuid) OR id::TEXT = target_user_id OR email = v_email;

  -- Also update metadata in auth.users if exists
  IF v_uuid IS NOT NULL OR v_email IS NOT NULL THEN
    UPDATE auth.users
    SET
      raw_user_meta_data = jsonb_strip_nulls(
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
          'full_name', COALESCE(NULLIF(trim(new_full_name), ''), raw_user_meta_data->>'full_name'),
          'username', COALESCE(NULLIF(trim(new_username), ''), raw_user_meta_data->>'username'),
          'role', CASE 
            WHEN v_current_role = 'superadmin' THEN 'superadmin'
            WHEN new_role IN ('admin', 'standard user') THEN new_role 
            ELSE COALESCE(raw_user_meta_data->>'role', 'standard user')
          END
        )
      ),
      updated_at = NOW()
    WHERE (v_uuid IS NOT NULL AND id = v_uuid) OR email = v_email;
  END IF;

  -- If new_password is provided, update encrypted_password in auth.users
  IF new_password IS NOT NULL AND length(trim(new_password)) >= 6 THEN
    UPDATE auth.users
    SET
      encrypted_password = crypt(trim(new_password), gen_salt('bf')),
      updated_at = NOW()
    WHERE (v_uuid IS NOT NULL AND id = v_uuid) OR email = v_email;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User details and credentials updated successfully'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;




