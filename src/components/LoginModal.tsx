import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { UserSession } from '../types/blog';
import {
  getStoredAIProvider,
  saveAIProvider,
  getStoredAIModel,
  saveAIModel,
  getStoredClaudeKey,
  saveClaudeKey,
  getStoredOpenAIKey,
  saveOpenAIKey,
  syncAllSettingsToSupabase,
} from '../services/authService';
import { signUpWithSupabase, signInWithSupabase } from '../services/supabaseService';

interface LoginModalProps {
  isOpen: boolean;
  currentUser: UserSession;
  onClose: () => void;
  onSaveUser: (session: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSaveUser,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'ai'>('profile');
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'save' | 'login' | 'signup'>('save');
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // AI settings
  const [provider, setProvider] = useState<'openai' | 'claude'>(getStoredAIProvider());
  const [model, setModel] = useState<string>(getStoredAIModel());
  const [openAIKey, setOpenAIKey] = useState<string>(getStoredOpenAIKey());
  const [claudeKey, setClaudeKey] = useState<string>(getStoredClaudeKey());

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);

    if (authMode === 'signup' && password) {
      const res = await signUpWithSupabase(email, password);
      if (res.error) {
        setAuthMessage(`Signup note: ${res.error}`);
      } else {
        setAuthMessage('Account created successfully on Supabase!');
      }
    } else if (authMode === 'login' && password) {
      const res = await signInWithSupabase(email, password);
      if (res.error) {
        setAuthMessage(`Login note: ${res.error}`);
      } else {
        setAuthMessage('Authenticated with Supabase!');
      }
    }

    const updatedSession = {
      ...currentUser,
      username: username || 'STCA Operator',
      email: email || 'operator@stcastudios.com',
      isLoggedIn: true,
    };

    onSaveUser(updatedSession);
    saveAIProvider(provider);
    saveAIModel(model);
    saveOpenAIKey(openAIKey);
    saveClaudeKey(claudeKey);

    // Save everything to Supabase DB
    await syncAllSettingsToSupabase();

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg glass-panel border border-slate-700/60 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">STCA Operator & AI Engine Settings</h3>
            <p className="text-xs text-slate-400">Configure operator identity & AI model provider</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'profile'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Operator Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'ai'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AI Engine (OpenAI / Claude)
          </button>
        </div>

        {savedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <p className="text-sm font-semibold text-emerald-300">
              Settings & AI Engine Provider Saved!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'profile' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Operator Username / Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="operator@stcastudios.com"
                      className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Account Password <span className="text-slate-500 font-normal">(Optional for Supabase Auth)</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 text-[11px] pt-1">
                  <button
                    type="button"
                    onClick={() => setAuthMode('save')}
                    className={`px-2.5 py-1 rounded-md border font-semibold ${
                      authMode === 'save'
                        ? 'bg-slate-800 border-amber-500/50 text-amber-300'
                        : 'border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Save & Sync DB
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`px-2.5 py-1 rounded-md border font-semibold ${
                      authMode === 'login'
                        ? 'bg-slate-800 border-emerald-500/50 text-emerald-300'
                        : 'border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Login Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('signup')}
                    className={`px-2.5 py-1 rounded-md border font-semibold ${
                      authMode === 'signup'
                        ? 'bg-slate-800 border-blue-500/50 text-blue-300'
                        : 'border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                {authMessage && (
                  <p className="text-xs text-amber-400 font-medium bg-amber-500/10 p-2 rounded border border-amber-500/20">
                    {authMessage}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* AI Provider Switcher */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Active AI Engine Provider
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProvider('openai');
                        setModel('gpt-4o-mini');
                      }}
                      className={`p-3 rounded-xl border text-left transition ${
                        provider === 'openai'
                          ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="font-bold text-xs">OpenAI GPT Models</div>
                      <div className="text-[10px] text-slate-400">gpt-4o-mini, gpt-4o</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProvider('claude');
                        setModel('claude-3-5-sonnet-20241022');
                      }}
                      className={`p-3 rounded-xl border text-left transition ${
                        provider === 'claude'
                          ? 'bg-amber-500/10 border-amber-500/60 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="font-bold text-xs">Anthropic Claude</div>
                      <div className="text-[10px] text-slate-400">Claude 3.5 Sonnet / Haiku</div>
                    </button>
                  </div>
                </div>

                {/* Specific Model Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Specific Model Version
                  </label>
                  {provider === 'openai' ? (
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    >
                      <option value="gpt-4o-mini">gpt-4o-mini (Ultra Fast & Low Cost)</option>
                      <option value="gpt-4o">gpt-4o (Flagship Omnimodal reasoning)</option>
                    </select>
                  ) : (
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    >
                      <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet (Superior Prose & Copywriting)</option>
                      <option value="claude-3-5-haiku-20241022">claude-3-5-haiku (Lightning Fast)</option>
                    </select>
                  )}
                </div>

                {/* Keys */}
                {provider === 'openai' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      OpenAI API Key
                    </label>
                    <input
                      type="password"
                      value={openAIKey}
                      onChange={(e) => setOpenAIKey(e.target.value)}
                      placeholder="sk-proj-..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Anthropic Claude API Key
                    </label>
                    <input
                      type="password"
                      value={claudeKey}
                      onChange={(e) => setClaudeKey(e.target.value)}
                      placeholder="sk-ant-api..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-lg shadow-lg shadow-amber-500/10 transition"
              >
                Save Settings & Configuration
              </button>
            </div>

            <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>STCA Brand Registry 2026 Secured</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
