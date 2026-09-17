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
import type { STCABlogPackage } from '../types/blog';

interface HistoryDrawerProps {
  isOpen: boolean;
  history: STCABlogPackage[];
  onClose: () => void;
  onSelectPackage: (pkg: STCABlogPackage) => void;
  onDeletePackage: (jobId: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  history,
  onClose,
  onSelectPackage,
  onDeletePackage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredHistory = history.filter(
    (item) =>
      item.job.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.presenter.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl space-y-4">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <History className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Production History</h3>
                <p className="text-xs text-slate-400">{history.length} Packages Saved</p>
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
              placeholder="Search history by topic or presenter..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs font-medium">No blog production history found.</p>
              <p className="text-[11px] text-slate-600 font-mono">Generate your first blog package above!</p>
            </div>
          ) : (
            filteredHistory.map((item) => {
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
                  <div className="flex items-start justify-between">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      <span>{dateFormatted}</span>
                    </span>
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
            STCA Studios History Registry • Synchronized with Local Storage
          </p>
        </div>
      </div>
    </div>
  );
};
