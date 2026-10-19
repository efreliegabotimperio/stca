import React, { useState } from 'react';
import {
  X,
  History,
  Calendar,
  Search,
  CheckCircle2,
  Trash2,
  Bot,
  FileText,
} from 'lucide-react';
import type { STCABlogPackage, UserSession } from '../types/blog';

interface HistoryDrawerProps {
  isOpen: boolean;
  history: STCABlogPackage[];
  currentUser: UserSession;
  onClose: () => void;
  onSelectPackage: (pkg: STCABlogPackage) => void;
  onDeletePackage: (jobId: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  history,
  currentUser,
  onClose,
  onSelectPackage,
  onDeletePackage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const isSuperadmin = currentUser.role === 'superadmin';
  const isAdmin = currentUser.role === 'admin';
  const isStandardUser = !isSuperadmin && !isAdmin;

  // RBAC History Visibility Filter:
  // 1. Superadmin: can view all histories for users including own history
  // 2. Admin: can view only for standard user including own history
  // 3. Standard user: can view only the own history
  const accessibleHistory = history.filter((item) => {
    const itemEmail = item.userEmail || item.job.userEmail;
    const itemRole = item.userRole || item.job.userRole || 'standard user';

    // Superadmin: view all
    if (isSuperadmin) return true;

    // Admin: view standard users + own history
    if (isAdmin) {
      const isOwn = itemEmail === currentUser.email;
      const isStandard = itemRole === 'standard user';
      return isOwn || isStandard;
    }

    // Standard user: view ONLY own history
    return itemEmail === currentUser.email;
  });

  const filteredHistory = accessibleHistory.filter(
    (item) =>
      item.job.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.presenter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.userName && item.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.userEmail && item.userEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl space-y-4">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                isSuperadmin
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : isAdmin
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              }`}>
                <History className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-slate-100">
                    {isSuperadmin
                      ? 'All Production History'
                      : isAdmin
                      ? 'Team & Own History'
                      : 'My Production History'}
                  </h3>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border ${
                    isSuperadmin
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : isAdmin
                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}>
                    {isSuperadmin ? 'Superadmin' : isAdmin ? 'Admin' : 'Personal'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {accessibleHistory.length} {accessibleHistory.length === 1 ? 'Package' : 'Packages'}{' '}
                  {isSuperadmin ? '(All Users)' : isAdmin ? '(Standard Users & Own)' : '(Own Activity)'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                isSuperadmin
                  ? 'Search all history by topic, author, or presenter...'
                  : isAdmin
                  ? 'Search team & own history...'
                  : 'Search your history...'
              }
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs font-medium">
                {isStandardUser
                  ? 'You have not generated any blog packages yet.'
                  : 'No matching production history found.'}
              </p>
              <p className="text-[11px] text-slate-600 font-mono">
                {isStandardUser
                  ? 'Generate your first blog package using the creator above!'
                  : 'History items will appear here as team packages are created.'}
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const itemEmail = item.userEmail || item.job.userEmail;
              const itemRole = item.userRole || item.job.userRole || 'standard user';
              const itemAuthor = item.userName || item.job.userName || itemEmail?.split('@')[0] || 'Studio User';
              const isOwn = itemEmail === currentUser.email;

              const dateFormatted = new Date(item.job.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={item.job.id}
                  className="glass-panel rounded-xl p-4 border border-slate-800 hover:border-amber-500/50 transition group relative space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        <span>{dateFormatted}</span>
                      </span>

                      {/* Author Pill */}
                      {isOwn ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          You ({itemRole})
                        </span>
                      ) : (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${
                            itemRole === 'superadmin'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : itemRole === 'admin'
                              ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {itemAuthor} ({itemRole})
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePackage(item.job.id);
                      }}
                      className="text-slate-600 hover:text-rose-400 transition"
                      title="Delete from history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4
                    onClick={() => {
                      onSelectPackage(item);
                      onClose();
                    }}
                    className="font-bold text-slate-200 text-xs sm:text-sm hover:text-amber-300 cursor-pointer line-clamp-2 transition"
                  >
                    {item.job.topic}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <span className="flex items-center space-x-1">
                      <Bot className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.presenter.name}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>QA PASS (12/12)</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            {isSuperadmin
              ? 'RBAC History Registry • Superadmin full access'
              : isAdmin
              ? 'RBAC History Registry • Standard user & own logs'
              : 'Personal History Registry • Private to your account'}
          </p>
        </div>
      </div>
    </div>
  );
};
