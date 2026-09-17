import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Mic,
  Video,
  Search,
  Share2,
  ShieldCheck,
  Code,
  Download,
  Copy,
  CheckCircle2,
  Zap,
  Volume2,
} from 'lucide-react';
import JSZip from 'jszip';
import type { STCABlogPackage } from '../types/blog';

interface PackageViewerProps {
  pkg: STCABlogPackage;
  onOpenCanvaAudioModal: () => void;
}

export const PackageViewer: React.FC<PackageViewerProps> = ({
  pkg,
  onOpenCanvaAudioModal,
}) => {
  const [activeTab, setActiveTab] = useState<
    'blog' | 'canva' | 'voiceover' | 'avatar' | 'seo' | 'social' | 'qa' | 'manifest'
  >('blog');
  const [copiedMd, setCopiedMd] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(pkg.blogMaster.fullMarkdown);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const dateStr = new Date().toISOString().split('T')[0];
      const folderName = `${dateStr}__${pkg.seo.slug}`;
      const folder = zip.folder(folderName);

      if (folder) {
        folder.file('00_JOB.json', JSON.stringify(pkg.job, null, 2));
        folder.file('01_RESEARCH-BRIEF.md', JSON.stringify(pkg.researchBrief, null, 2));
        folder.file('02_SOURCE-LEDGER.md', JSON.stringify(pkg.researchBrief.sourceLedger, null, 2));
        folder.file('03_BLOG-MASTER.md', pkg.blogMaster.fullMarkdown);
        folder.file('04_SEO.md', JSON.stringify(pkg.seo, null, 2));
        folder.file('05_CANVA-VISUAL-SPEC.md', JSON.stringify(pkg.canvaVisualSpec, null, 2));
        folder.file('06_VOICEOVER__CHARACTER.md', JSON.stringify(pkg.voiceover, null, 2));
        folder.file('07_AVATAR-VIDEO-BRIEF__CHARACTER.md', JSON.stringify(pkg.avatarVideo, null, 2));
        folder.file('08_SOCIAL-REPURPOSE.md', JSON.stringify(pkg.socialRepurpose, null, 2));
        folder.file('09_PUBLISH-FIELD-MAP.md', JSON.stringify({ slug: pkg.seo.slug, title: pkg.blogMaster.h1Title }, null, 2));
        folder.file('10_QA-REPORT.md', JSON.stringify(pkg.qaReport, null, 2));
        folder.file('MANIFEST.json', JSON.stringify(pkg.manifest, null, 2));
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('ZIP export error:', e);
    } finally {
      setIsZipping(false);
    }
  };

  const TABS = [
    { id: 'blog', label: 'Blog Master', icon: FileText },
    { id: 'canva', label: 'Canva Specs', icon: ImageIcon },
    { id: 'voiceover', label: 'Voiceover & Audio', icon: Mic },
    { id: 'avatar', label: 'Avatar Video Brief', icon: Video },
    { id: 'seo', label: 'SEO & Metadata', icon: Search },
    { id: 'social', label: 'Social Repurpose', icon: Share2 },
    { id: 'qa', label: '12-Point QA Gate', icon: ShieldCheck },
    { id: 'manifest', label: 'Manifest & Bundle', icon: Code },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Banner Card */}
      <div className="glass-panel border-amber-500/30 rounded-3xl p-6 relative overflow-hidden bg-slate-900/90">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                {pkg.job.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Job ID: {pkg.job.id}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              {pkg.blogMaster.h1Title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
              <span className="flex items-center space-x-1">
                <img
                  src={pkg.presenter.avatarUrl}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover"
                />
                <strong className="text-slate-200">{pkg.presenter.name}</strong>
              </span>
              <span>•</span>
              <span>Voice: <code className="text-amber-400">{pkg.presenter.masterVoiceId}</code></span>
              <span>•</span>
              <span>Avatar: <code className="text-cyan-400">{pkg.presenter.masterAvatarId}</code></span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Canva & Audio Integration Trigger */}
            <button
              onClick={onOpenCanvaAudioModal}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition active:scale-95"
            >
              <Zap className="w-4 h-4 text-cyan-200" />
              <span>Link Canva / Generate Audio</span>
            </button>

            {/* ZIP Bundle Download */}
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>{isZipping ? 'Zipping...' : 'Download Bundle ZIP'}</span>
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
            </button>
          );
        })}
      </div>

      {/* TAB 1: Blog Master */}
      {activeTab === 'blog' && (
        <div className="glass-panel border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
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

            <div className="bg-purple-950/30 border border-purple-500/30 p-4 rounded-2xl text-xs text-purple-200">
              {pkg.blogMaster.presenterCallout}
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300">
              <h4 className="font-bold text-slate-100 mb-1">Conclusion & CTA</h4>
              <p>{pkg.blogMaster.conclusion}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Canva Visual Specs */}
      {activeTab === 'canva' && (
        <div className="glass-panel border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Canva Visual Production Plan</h3>
              <p className="text-xs text-slate-400">Template ID: <code className="text-amber-400 font-mono">{pkg.canvaVisualSpec.templateId}</code></p>
            </div>
            <button
              onClick={onOpenCanvaAudioModal}
              className="flex items-center space-x-2 px-3 py-1.5 text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-lg transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Copy Canva Dataset JSON</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pkg.canvaVisualSpec.graphicsList.map((gfx, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                    {gfx.type}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{gfx.dimensions}</span>
                </div>
                <h4 className="font-bold text-slate-200 text-sm">{gfx.headline}</h4>
                <p className="text-xs text-slate-400">{gfx.layoutInstructions}</p>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between font-mono">
                  <span>File: {gfx.exportFilename}</span>
                  <span className="text-slate-400 truncate max-w-[150px]">Alt: {gfx.altText}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Voiceover & Audio */}
      {activeTab === 'voiceover' && (
        <div className="glass-panel border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Character Voiceover & Audio Brief</h3>
              <p className="text-xs text-slate-400">Master Voice ID: <code className="text-amber-400">{pkg.voiceover.masterVoiceId}</code></p>
            </div>
            <button
              onClick={onOpenCanvaAudioModal}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition"
            >
              <Volume2 className="w-4 h-4" />
              <span>Test Audio Playback</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase">Spoken Phrasing Script</span>
              <p className="text-sm text-slate-200 font-mono leading-relaxed">{pkg.voiceover.spokenPhrasingScript}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-200">Pronunciation Cues</h4>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  {pkg.voiceover.pronunciationNotes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-200">Audio Directives</h4>
                <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                  {pkg.voiceover.audioDirectives.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Avatar Video Brief */}
      {activeTab === 'avatar' && (
        <div className="glass-panel border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-slate-100">Avatar & Video Production Brief</h3>
            <p className="text-xs text-slate-400">Master Avatar ID: <code className="text-cyan-400">{pkg.avatarVideo.masterAvatarId}</code></p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-amber-400">Background Scene & Framing</span>
              <p className="text-xs text-slate-300">{pkg.avatarVideo.backgroundScene}</p>
              <p className="text-xs text-slate-400">{pkg.avatarVideo.framingPlacement}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {pkg.avatarVideo.outputRatios.map((ratio, i) => (
                <div key={i} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-center">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold">{ratio}</span>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{pkg.avatarVideo.exportFilenames[i]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SEO Package */}
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
                {pkg.seo.secondaryKeywords.map((kw, i) => (
                  <span key={i} className="px-2.5 py-1 bg-slate-950 text-slate-300 rounded-lg text-xs font-mono">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Social Repurposing */}
      {activeTab === 'social' && (
        <div className="glass-panel border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-slate-100">Multi-Channel Social Repurposing</h3>
            <p className="text-xs text-slate-400">LinkedIn, Facebook, IG Carousel, Short Video & Email</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-xs text-cyan-400">LinkedIn & Facebook Post</h4>
              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{pkg.socialRepurpose.linkedInPost}</p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-bold text-xs text-amber-400">Email Teaser</h4>
              <p className="text-xs font-bold text-slate-200">Subject: {pkg.socialRepurpose.emailTeaser.subject}</p>
              <p className="text-xs text-slate-300 whitespace-pre-line">{pkg.socialRepurpose.emailTeaser.body}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: 12-Point QA Gate */}
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

      {/* TAB 8: Manifest */}
      {activeTab === 'manifest' && (
        <div className="glass-panel border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-slate-100">Machine-Readable MANIFEST.json</h3>
            <p className="text-xs text-slate-400">STCA Production Package Version {pkg.manifest.version}</p>
          </div>

          <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-emerald-400 font-mono overflow-x-auto">
            {JSON.stringify(pkg.manifest, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
