import React from 'react';
import {
  History,
  User,
  ExternalLink,
  Bot,
  PlusCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { UserSession } from '../types/blog';

interface NavbarProps {
  user: UserSession;
  historyCount: number;
  onOpenLogin: () => void;
  onOpenHistory: () => void;
  onNewGenerator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  historyCount,
  onOpenLogin,
  onOpenHistory,
  onNewGenerator,
}) => {
  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80 bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onNewGenerator}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-600 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-amber-400" />
            </div>
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

          {/* User Account / Login */}
          <button
            onClick={onOpenLogin}
            className="flex items-center space-x-2 px-3 py-2 text-xs sm:text-sm font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition"
          >
            <User className="w-4 h-4 text-slate-400" />
            <span className="hidden md:inline max-w-[100px] truncate">{user.username}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 hidden sm:inline" />
          </button>
        </div>
      </div>
    </header>
  );
};
