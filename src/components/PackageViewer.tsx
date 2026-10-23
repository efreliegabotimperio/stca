import React, { useState } from 'react';
import {
  FileText,
  Search,
  Share2,
  ShieldCheck,
  Copy,
  CheckCircle2,
  Download,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import type { STCABlogPackage } from '../types/blog';
import { SocialGeneratorModal } from './SocialGeneratorModal';

interface PackageViewerProps {
  pkg: STCABlogPackage;
  onOpenCanvaAudioModal?: () => void;
}

export const PackageViewer: React.FC<PackageViewerProps> = ({ pkg }) => {
  const [activeTab, setActiveTab] = useState<'blog' | 'research' | 'seo' | 'social' | 'qa'>('blog');
  const [copiedMd, setCopiedMd] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(pkg.blogMaster.fullMarkdown);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([pkg.blogMaster.fullMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${pkg.seo.slug || 'stca-blog'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const TABS = [
    { id: 'blog', label: 'Blog Master', icon: FileText },
    { id: 'research', label: 'Research & Sources', icon: BookOpen },
    { id: 'seo', label: 'SEO & Metadata', icon: Search },
    { id: 'social', label: 'Social Captions & Graphic', icon: Share2 },
    { id: 'qa', label: '12-Point QA Gate', icon: ShieldCheck },
  ] as const;

  return (
    <div className="w-full space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Banner Card */}
      <div className="glass-panel border-amber-500/30 rounded-3xl p-6 relative overflow-hidden bg-slate-900/90">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                {pkg.job.status}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Job ID: {pkg.job.id}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              {pkg.blogMaster.h1Title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
              <span className="flex items-center space-x-1.5">
                <img
                  src={pkg.presenter.avatarUrl}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover"
                />
                <strong className="text-slate-200">{pkg.presenter.name}</strong>
              </span>
              <span>•</span>
              <span className="text-amber-400 font-medium">{pkg.presenter.role}</span>
              {pkg.presenter.buyerAnchor && (
                <>
                  <span>•</span>
                  <span className="text-slate-300">{pkg.presenter.primaryRole} ({pkg.presenter.buyerAnchor})</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsSocialModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:brightness-110 text-slate-950 shadow-lg shadow-amber-500/25 transition active:scale-95 border border-amber-300"
            >
              <Share2 className="w-4 h-4 fill-slate-950" />
              <span>⚡ Generate Social Captions & Graphic</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
            >
              {copiedMd ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedMd ? 'Copied Markdown!' : 'Copy Markdown'}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download Article (.md)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex space-x-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.id === 'social' && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase ${
                  isActive ? 'bg-slate-950 text-amber-300' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                }`}>
                  New
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Blog Master */}
      {activeTab === 'blog' && (
        <div className="glass-panel border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          
          {/* Quick Social Captions & Graphic Callout on Blog Master Tab */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-slate-900 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/30 shrink-0">
                <Share2 className="w-5 h-5 fill-slate-950" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-100 flex items-center space-x-2">
                  <span>Auto-Generate Social Captions & Branded Graphic</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase">Feature</span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Instant Instagram, LinkedIn, Facebook, and Reel captions + downloadable PNG graphic for this article.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSocialModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-400/25 transition inline-flex items-center space-x-2 shrink-0 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
              <span>Generate Captions & Graphic</span>
            </button>
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-100">STCA Blog Master Article</h3>
              <p className="text-xs text-slate-400">Authoritative human-first article content</p>
            </div>
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 rounded-lg transition"
            >
              {copiedMd ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedMd ? 'Copied Markdown!' : 'Copy Full Markdown'}</span>
            </button>
          </div>

          <div className="prose prose-invert max-w-none space-y-6">
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Hook & Promise</span>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">{pkg.blogMaster.hook}</p>
              <p className="text-sm text-slate-400 leading-relaxed">{pkg.blogMaster.valuePromise}</p>
            </div>

            {pkg.blogMaster.sections.map((sec, idx) => (
              <div key={idx} className="space-y-3 pt-2">
                <h3 className="text-base font-bold text-amber-300">{sec.h2}</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{sec.content}</p>
                {sec.fieldTip && (
                  <div className="bg-amber-950/30 border-l-4 border-amber-500 p-3.5 rounded-r-xl text-xs text-amber-200">
                    {sec.fieldTip}
                  </div>
                )}
              </div>
            ))}

            {pkg.blogMaster.presenterCallout && (
              <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl text-xs text-amber-200">
                {pkg.blogMaster.presenterCallout}
              </div>
            )}

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
              <h4 className="font-bold text-slate-100 mb-1">Conclusion & CTA</h4>
              <p>{pkg.blogMaster.conclusion}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Research & Sources */}
      {activeTab === 'research' && (
        <div className="glass-panel border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-slate-100">Research & Intelligence Brief</h3>
            <p className="text-xs text-slate-400">Primary reader problem, verified facts, and content angle</p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-amber-400">Primary Reader Problem</span>
              <p className="text-sm text-slate-200">{pkg.researchBrief.primaryReaderProblem}</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-amber-400">Search Intent Summary</span>
              <p className="text-xs text-slate-300">{pkg.researchBrief.searchIntentSummary}</p>
            </div>

            {pkg.researchBrief.verifiedFacts && pkg.researchBrief.verifiedFacts.length > 0 && (
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400">Verified Facts & Benchmarks</span>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                  {pkg.researchBrief.verifiedFacts.map((fact, idx) => (
                    <li key={idx}>{fact}</li>
                  ))}
                </ul>
              </div>
            )}

            {pkg.researchBrief.sourceLedger && pkg.researchBrief.sourceLedger.length > 0 && (
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300">Source Ledger</span>
                <div className="space-y-2">
                  {pkg.researchBrief.sourceLedger.map((src) => (
                    <div key={src.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">{src.title}</span>
                        <p className="text-[11px] text-slate-500 font-mono">{src.url}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {src.credibilityScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SEO Package */}
      {activeTab === 'seo' && (
        <div className="glass-panel border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-slate-100">SEO & Metadata Package</h3>
            <p className="text-xs text-slate-400">Slug: <code className="text-amber-400">{pkg.seo.slug}</code></p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-300">SEO Title</span>
              <p className="text-sm text-slate-100 font-semibold">{pkg.seo.seoTitle}</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-slate-300">Meta Description</span>
              <p className="text-xs text-slate-300">{pkg.seo.metaDescription}</p>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300">Secondary Keywords</span>
              <div className="flex flex-wrap gap-2">
                {pkg.seo.secondaryKeywords?.map((kw, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-950 text-slate-300 rounded-lg text-xs font-mono">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Social Repurposing */}
      {activeTab === 'social' && (
        <div className="glass-panel border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Multi-Channel Social Repurposing</h3>
              <p className="text-xs text-slate-400">LinkedIn, Facebook, IG Carousel, Short Video & Email</p>
            </div>
            <button
              onClick={() => setIsSocialModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:brightness-110 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-400/20 transition inline-flex items-center space-x-2 shrink-0"
            >
              <Share2 className="w-3.5 h-3.5 fill-slate-950" />
              <span>Launch Social & Graphic Studio</span>
            </button>
          </div>

          {/* Social Studio Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Auto-Generate Social Media Captions & Branded Graphic</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Generates platform-ready captions (Instagram, LinkedIn, Facebook, Video script) and an STCA branded graphic with 1-click PNG download.
              </p>
            </div>
            <button
              onClick={() => setIsSocialModalOpen(true)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Open Studio</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-xs text-cyan-400">LinkedIn & Facebook Post</h4>
              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{pkg.socialRepurpose.linkedInPost}</p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-xs text-amber-400">Email Teaser</h4>
              <p className="text-xs font-bold text-slate-200">Subject: {pkg.socialRepurpose.emailTeaser?.subject}</p>
              <p className="text-xs text-slate-300 whitespace-pre-line">{pkg.socialRepurpose.emailTeaser?.body}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: 12-Point QA Gate */}
      {activeTab === 'qa' && (
        <div className="glass-panel border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Ultimate 12-Point QA Gate</h3>
              <p className="text-xs text-slate-400">Score: <strong className="text-emerald-400">12 / 12 PASS</strong></p>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full text-xs font-extrabold">
              PUBLISH APPROVED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pkg.qaReport.categories.map((cat) => (
              <div key={cat.id} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs text-slate-200">{cat.category}</h4>
                  <p className="text-[11px] text-slate-400">{cat.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Generator Modal */}
      <SocialGeneratorModal
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        initialTopic={pkg.job.topic}
        initialPresenterId={pkg.presenter.id}
      />
    </div>
  );
};
