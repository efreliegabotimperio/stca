import type { UserSession, STCABlogPackage } from '../types/blog';

const USER_SESSION_KEY = 'stca_user_session';
const PACKAGE_HISTORY_KEY = 'stca_package_history';
const OPENAI_KEY_STORAGE = 'stca_openai_api_key';
const CLAUDE_KEY_STORAGE = 'stca_claude_api_key';
const ELEVENLABS_KEY_STORAGE = 'stca_elevenlabs_api_key';
const ELEVENLABS_VOICE_IDS_STORAGE = 'stca_elevenlabs_voice_ids';
const CANVA_DESIGN_URLS_STORAGE = 'stca_canva_design_urls';
const AI_PROVIDER_STORAGE = 'stca_ai_provider';
const AI_MODEL_STORAGE = 'stca_ai_model';
const CUSTOM_VOICES_STORAGE = 'stca_custom_presenter_voices';

export const DEFAULT_OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export function getStoredOpenAIKey(): string {
  try {
    const key = localStorage.getItem(OPENAI_KEY_STORAGE);
    if (key && key.trim()) {
      return key.trim();
    }
  } catch (e) {
    console.error('Error loading OpenAI key:', e);
  }
  return DEFAULT_OPENAI_KEY;
}

export function saveOpenAIKey(key: string): void {
  try {
    localStorage.setItem(OPENAI_KEY_STORAGE, key.trim());
  } catch (e) {
    console.error('Error saving OpenAI key:', e);
  }
}

export function getStoredClaudeKey(): string {
  try {
    const key = localStorage.getItem(CLAUDE_KEY_STORAGE);
    if (key && key.trim()) {
      return key.trim();
    }
  } catch (e) {
    console.error('Error loading Claude key:', e);
  }
  return '';
}

export function saveClaudeKey(key: string): void {
  try {
    localStorage.setItem(CLAUDE_KEY_STORAGE, key.trim());
  } catch (e) {
    console.error('Error saving Claude key:', e);
  }
}

export function getStoredElevenLabsKey(): string {
  try {
    const key = localStorage.getItem(ELEVENLABS_KEY_STORAGE);
    if (key && key.trim()) {
      return key.trim();
    }
  } catch (e) {
    console.error('Error loading ElevenLabs key:', e);
  }
  return '';
}

export function saveElevenLabsKey(key: string): void {
  try {
    localStorage.setItem(ELEVENLABS_KEY_STORAGE, key.trim());
  } catch (e) {
    console.error('Error saving ElevenLabs key:', e);
  }
}

export function getStoredElevenLabsVoiceId(presenterId: string): string {
  try {
    const raw = localStorage.getItem(ELEVENLABS_VOICE_IDS_STORAGE);
    if (raw) {
      const map = JSON.parse(raw);
      if (map[presenterId]) {
        return map[presenterId];
      }
    }
  } catch (e) {
    console.error('Error loading ElevenLabs voice IDs:', e);
  }
  return '';
}

export function saveElevenLabsVoiceId(presenterId: string, voiceId: string): void {
  try {
    const raw = localStorage.getItem(ELEVENLABS_VOICE_IDS_STORAGE);
    const map = raw ? JSON.parse(raw) : {};
    map[presenterId] = voiceId.trim();
    localStorage.setItem(ELEVENLABS_VOICE_IDS_STORAGE, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving ElevenLabs voice ID:', e);
  }
}

// Canva Design Direct Link Storage
export function getStoredCanvaDesignUrl(presenterId: string): string {
  try {
    const raw = localStorage.getItem(CANVA_DESIGN_URLS_STORAGE);
    if (raw) {
      const map = JSON.parse(raw);
      if (map[presenterId]) {
        return map[presenterId];
      }
    }
  } catch (e) {
    console.error('Error loading Canva design URLs:', e);
  }
  return '';
}

export function saveCanvaDesignUrl(presenterId: string, url: string): void {
  try {
    const raw = localStorage.getItem(CANVA_DESIGN_URLS_STORAGE);
    const map = raw ? JSON.parse(raw) : {};
    map[presenterId] = url.trim();
    localStorage.setItem(CANVA_DESIGN_URLS_STORAGE, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving Canva design URL:', e);
  }
}

export function getStoredAIProvider(): 'openai' | 'claude' {
  try {
    const provider = localStorage.getItem(AI_PROVIDER_STORAGE);
    if (provider === 'claude' || provider === 'openai') {
      return provider;
    }
  } catch (e) {
    console.error('Error loading provider:', e);
  }
  return 'openai';
}

export function saveAIProvider(provider: 'openai' | 'claude'): void {
  try {
    localStorage.setItem(AI_PROVIDER_STORAGE, provider);
  } catch (e) {
    console.error('Error saving provider:', e);
  }
}

export function getStoredAIModel(): string {
  try {
    const model = localStorage.getItem(AI_MODEL_STORAGE);
    if (model) return model;
  } catch (e) {
    console.error('Error loading model:', e);
  }
  return 'gpt-4o-mini';
}

export function saveAIModel(model: string): void {
  try {
    localStorage.setItem(AI_MODEL_STORAGE, model);
  } catch (e) {
    console.error('Error saving model:', e);
  }
}

// Custom Voice Sample Management
export function getStoredCustomVoice(presenterId: string): { audioUrl: string; fileName: string } | null {
  try {
    const raw = localStorage.getItem(CUSTOM_VOICES_STORAGE);
    if (raw) {
      const map = JSON.parse(raw);
      if (map[presenterId]) {
        return map[presenterId];
      }
    }
  } catch (e) {
    console.error('Error reading custom voices:', e);
  }
  return null;
}

export function saveStoredCustomVoice(presenterId: string, audioUrl: string, fileName: string): void {
  try {
    const raw = localStorage.getItem(CUSTOM_VOICES_STORAGE);
    const map = raw ? JSON.parse(raw) : {};
    map[presenterId] = { audioUrl, fileName };
    localStorage.setItem(CUSTOM_VOICES_STORAGE, JSON.stringify(map));
  } catch (e) {
    console.error('Error saving custom voice:', e);
  }
}

export function removeStoredCustomVoice(presenterId: string): void {
  try {
    const raw = localStorage.getItem(CUSTOM_VOICES_STORAGE);
    if (raw) {
      const map = JSON.parse(raw);
      delete map[presenterId];
      localStorage.setItem(CUSTOM_VOICES_STORAGE, JSON.stringify(map));
    }
  } catch (e) {
    console.error('Error removing custom voice:', e);
  }
}

export function getStoredUserSession(): UserSession {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading session:', e);
  }
  return {
    id: 'user-001',
    username: 'STCA Operator',
    email: 'operator@stcastudios.com',
    isLoggedIn: true,
  };
}

export function saveUserSession(session: UserSession): void {
  try {
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Error saving session:', e);
  }
}

export function getStoredPackageHistory(): STCABlogPackage[] {
  try {
    const raw = localStorage.getItem(PACKAGE_HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading history:', e);
  }
  return [];
}

export function savePackageToHistory(pkg: STCABlogPackage): STCABlogPackage[] {
  const history = getStoredPackageHistory();
  const existingIdx = history.findIndex((item) => item.job.id === pkg.job.id);
  let updated: STCABlogPackage[];
  if (existingIdx >= 0) {
    updated = [...history];
    updated[existingIdx] = pkg;
  } else {
    updated = [pkg, ...history];
  }

  try {
    localStorage.setItem(PACKAGE_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving history item:', e);
  }

  // Asynchronously sync to Supabase database
  savePackageToSupabase(pkg).catch((err) =>
    console.warn('Could not save package to Supabase:', err)
  );
  syncAllSettingsToSupabase().catch((err) =>
    console.warn('Could not sync settings to Supabase:', err)
  );

  return updated;
}

export function deletePackageFromHistory(jobId: string): STCABlogPackage[] {
  const history = getStoredPackageHistory();
  const updated = history.filter((item) => item.job.id !== jobId);
  try {
    localStorage.setItem(PACKAGE_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error deleting history item:', e);
  }

  // Asynchronously remove from Supabase database
  deletePackageFromSupabase(jobId).catch((err) =>
    console.warn('Could not delete package from Supabase:', err)
  );
  syncAllSettingsToSupabase().catch((err) =>
    console.warn('Could not sync settings to Supabase:', err)
  );

  return updated;
}

// Sync all app settings to and from Supabase
import {
  fetchAppSettingsFromSupabase,
  saveAppSettingsToSupabase,
  savePackageToSupabase,
  fetchPackagesFromSupabase,
  deletePackageFromSupabase,
  type AppSettings,
} from './supabaseService';

export function getAllLocalSettings(): AppSettings {
  return {
    openai_api_key: getStoredOpenAIKey(),
    claude_api_key: getStoredClaudeKey(),
    elevenlabs_api_key: getStoredElevenLabsKey(),
    ai_provider: getStoredAIProvider(),
    ai_model: getStoredAIModel(),
    user_session: getStoredUserSession(),
    package_history: getStoredPackageHistory(),
  };
}

export async function syncAllSettingsToSupabase(settingsId: string = 'default'): Promise<boolean> {
  const currentSettings = getAllLocalSettings();
  return await saveAppSettingsToSupabase(currentSettings, settingsId);
}

export async function loadAllSettingsFromSupabase(settingsId: string = 'default'): Promise<boolean> {
  const remoteSettings = await fetchAppSettingsFromSupabase(settingsId);
  
  // Try fetching dedicated stca_packages
  const remotePackages = await fetchPackagesFromSupabase();

  if (!remoteSettings && remotePackages.length === 0) return false;

  if (remoteSettings) {
    if (remoteSettings.openai_api_key) saveOpenAIKey(remoteSettings.openai_api_key);
    if (remoteSettings.claude_api_key) saveClaudeKey(remoteSettings.claude_api_key);
    if (remoteSettings.elevenlabs_api_key) saveElevenLabsKey(remoteSettings.elevenlabs_api_key);
    if (remoteSettings.ai_provider) saveAIProvider(remoteSettings.ai_provider);
    if (remoteSettings.ai_model) saveAIModel(remoteSettings.ai_model);
    if (remoteSettings.user_session) saveUserSession(remoteSettings.user_session);
  }

  // Merge packages from stca_packages table or app_settings package_history
  const combinedPackages = remotePackages.length > 0
    ? remotePackages
    : (remoteSettings?.package_history || []);

  if (combinedPackages.length > 0) {
    try {
      localStorage.setItem(PACKAGE_HISTORY_KEY, JSON.stringify(combinedPackages));
    } catch (e) {
      console.error('Error storing downloaded package history:', e);
    }
  }

  return true;
}

