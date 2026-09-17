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
