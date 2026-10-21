import {
  History,
  User,
  Users,
  ExternalLink,
  PlusCircle,
  Zap,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import type { UserSession } from '../types/blog';
import type { AppTheme } from '../services/themeService';

interface NavbarProps {
  user: UserSession;
  historyCount: number;
  theme: AppTheme;
  onToggleTheme: () => void;
  onOpenLogin: () => void;
  onOpenHistory: () => void;
  onNewGenerator: () => void;
  onOpenUserManagement: () => void;
  onLogout: () => void;
}


export const Navbar: React.FC<NavbarProps> = ({
  user,
  historyCount,
  theme,
  onToggleTheme,
  onOpenLogin,
  onOpenHistory,
  onNewGenerator,
  onOpenUserManagement,
  onLogout,
}) => {


  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 bg-slate-950/80">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={onNewGenerator}>
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-white/95 border border-amber-400/50 p-1 shadow-md shadow-amber-500/10 group-hover:border-amber-400 transition">
            <img
              src="https://assets.cdn.filesafe.space/cXVGcSjHPvm9Z4paH9gG/media/6a51c7bb708c41d4dfa93e71.webp"
              alt="STCA Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo.webp';
              }}
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-200">
                STCA STUDIOS
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-full">
                v2.0.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Ultimate Blog Production Orchestrator
            </p>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* New Package Generator Button */}
          <button
            onClick={onNewGenerator}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-lg shadow-md shadow-amber-500/10 transition duration-150 transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Blog Topic</span>
            <span className="sm:hidden">Create</span>
          </button>

          {/* Canva Direct Link Shortcut */}
          <a
            href="https://canva.com"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition"
            title="Open Canva Brand Kit & Templates"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Canva Templates</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Theme Mode Toggle (Dark / Light) */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Dark and Light Mode"
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border border-slate-700/60 bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 transition group cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                <span className="hidden xl:inline text-xs font-semibold text-slate-300">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-amber-500 group-hover:-rotate-12 transition-transform duration-300" />
                <span className="hidden xl:inline text-xs font-semibold text-slate-700">Dark</span>
              </>
            )}
          </button>

          {/* History Drawer Trigger */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full">
                {historyCount}
              </span>
            )}
          </button>

          {/* User Management / Account Info Trigger */}
          <button
            onClick={onOpenUserManagement}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg border transition ${
              user.role === 'superadmin'
                ? 'text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30'
                : user.role === 'admin'
                ? 'text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30'
                : 'text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30'
            }`}
            title={
              user.role === 'superadmin'
                ? 'User Management (All Users & RBAC)'
                : user.role === 'admin'
                ? 'Team Management (Standard Users)'
                : 'My Account Information'
            }
          >
            {user.role === 'superadmin' ? (
              <Users className="w-4 h-4 text-amber-400" />
            ) : user.role === 'admin' ? (
              <Users className="w-4 h-4 text-blue-400" />
            ) : (
              <User className="w-4 h-4 text-emerald-400" />
            )}
            <span className="hidden sm:inline">
              {user.role === 'superadmin'
                ? 'Users'
                : user.role === 'admin'
                ? 'Team'
                : 'Account Info'}
            </span>
          </button>

          {/* User Account / Profile & Status Indicator */}
          {user.role === 'superadmin' ? (
            <button
              onClick={onOpenLogin}
              title="SuperAdmin Settings (AI Models & API Keys)"
              className="flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-amber-500/30 rounded-lg transition"
            >
              <User className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline max-w-[100px] truncate text-slate-200">{user.username}</span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                SUPERADMIN
              </span>
            </button>
          ) : (
            <div
              title={`Active session: ${user.username} (${user.role})`}
              className="flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 bg-slate-900/80 border border-slate-800 rounded-lg select-none"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline max-w-[100px] truncate text-slate-200">{user.username}</span>
              {user.role === 'admin' ? (
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  ADMIN
                </span>
              ) : (
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  STANDARD
                </span>
              )}
            </div>
          )}

          {/* Log Out Button */}
          <button
            onClick={onLogout}
            title="Log out of session"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/30 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};
