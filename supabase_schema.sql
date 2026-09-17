-- SQL Script: Setup app_settings table in Supabase for STCA App
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/pgshhvvngtlwmbitfnox/sql

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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for anon key
DROP POLICY IF EXISTS "Allow public read/write to app_settings" ON public.app_settings;
CREATE POLICY "Allow public read/write to app_settings" ON public.app_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert or update default row with initial settings
INSERT INTO public.app_settings (id, ai_provider, ai_model)
VALUES ('default', 'openai', 'gpt-4o-mini')
ON CONFLICT (id) DO NOTHING;

-- Example: To manually update API keys via SQL Editor in Supabase:
-- UPDATE public.app_settings 
-- SET openai_api_key = 'your_openai_api_key_here',
--     updated_at = NOW()
-- WHERE id = 'default';

