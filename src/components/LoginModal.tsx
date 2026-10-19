import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  User,
  ShieldCheck,
  ShieldAlert,
  Bot,
  LogOut,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import type { UserSession, UserRole } from '../types/blog';
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

interface LoginModalProps {
  isOpen: boolean;
  currentUser: UserSession;
  onClose: () => void;
  onSaveUser: (session: UserSession) => void;
  onLogout: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSaveUser,
  onLogout,
}) => {
  // Only the superadmin role can access the AI model and API keys tab
  const canManageAIKeys = currentUser.role === 'superadmin';

  const [activeTab, setActiveTab] = useState<'profile' | 'ai'>('profile');
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState(currentUser.email);
  const [role, setRole] = useState<UserRole>(currentUser.role || 'standard user');

  // AI settings
  const [provider, setProvider] = useState<'openai' | 'claude'>(getStoredAIProvider());
  const [model, setModel] = useState<string>(getStoredAIModel());
  const [openAIKey, setOpenAIKey] = useState<string>(getStoredOpenAIKey());
  const [claudeKey, setClaudeKey] = useState<string>(getStoredClaudeKey());

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsername(currentUser.username);
      setEmail(currentUser.email);
      setRole(currentUser.role || 'standard user');
      setActiveTab('profile');
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedSession: UserSession = {
      ...currentUser,
      username: username.trim() || currentUser.username,
      role: role,
      isLoggedIn: true,
    };

    onSaveUser(updatedSession);

    if (canManageAIKeys) {
      saveAIProvider(provider);
      saveAIModel(model);
      saveOpenAIKey(openAIKey);
      saveClaudeKey(claudeKey);

      // Persist API settings to Supabase DB
      await syncAllSettingsToSupabase();
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  const getRoleBadge = (userRole: UserRole) => {
    if (userRole === 'superadmin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          superadmin (Full Access)
        </span>
      );
    }
    if (userRole === 'admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          admin (Studio Manager)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        <User className="w-3.5 h-3.5 text-emerald-400" />
        standard user (Studio Operator)
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Bot className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              {canManageAIKeys ? 'Operator Profile & AI Settings' : 'Operator Profile'}
            </h3>
            <p className="text-xs text-slate-400">
              {canManageAIKeys
                ? 'Manage your active session details & AI provider keys'
                : 'Manage your active session details'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Removed for admin and superadmin roles) */}
        {canManageAIKeys && (
          <div className="flex border-b border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 pb-3 text-xs sm:text-sm font-semibold transition border-b-2 flex items-center justify-center gap-2 ${
                activeTab === 'profile'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Account Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`flex-1 pb-3 text-xs sm:text-sm font-semibold transition border-b-2 flex items-center justify-center gap-2 ${
                activeTab === 'ai'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Model & API Keys</span>
            </button>
          </div>
        )}

        {savedSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-2 animate-in fade-in">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-emerald-300">
              Settings Saved Successfully!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!canManageAIKeys || activeTab === 'profile' ? (
              <div className="space-y-4">
                {/* Current Role Display */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Assigned Studio Role
                  </label>
                  <div className="pt-0.5">{getRoleBadge(role)}</div>
                </div>

                {/* Email (Readonly) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      readOnly
                      disabled
                      className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-lg text-sm text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Display Name / Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                      required
                    />
                  </div>
                </div>

                {/* Sign Out Action */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Switch user or sign out of session:
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-xs font-semibold transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
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
                      className={`p-3 rounded-lg border text-left transition flex items-center space-x-2 ${
                        provider === 'openai'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold shadow-sm'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Bot className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-xs font-bold">OpenAI</div>
                        <div className="text-[10px] text-slate-500">GPT-4o & GPT-4o-mini</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProvider('claude');
                        setModel('claude-3-5-sonnet-20241022');
                      }}
                      className={`p-3 rounded-lg border text-left transition flex items-center space-x-2 ${
                        provider === 'claude'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-semibold shadow-sm'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Bot className="w-4 h-4 text-orange-400" />
                      <div>
                        <div className="text-xs font-bold">Anthropic Claude</div>
                        <div className="text-[10px] text-slate-500">Claude 3.5 Sonnet</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Active Language Model
                  </label>
                  {provider === 'openai' ? (
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    >
                      <option value="gpt-4o-mini">gpt-4o-mini (Cost-effective & High Speed)</option>
                      <option value="gpt-4o">gpt-4o (Maximum Capability & Precision)</option>
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
                {canManageAIKeys ? 'Save Settings' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
