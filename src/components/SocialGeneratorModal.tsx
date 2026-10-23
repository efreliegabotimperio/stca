import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Sparkles,
  Download,
  Copy,
  Check,
  Share2,
  MessageCircle,
  MessageSquare,
  FileText,
  Send,
  Video,
  RefreshCw,
} from 'lucide-react';
import { APPROVED_PRESENTERS } from '../data/presenters';
import { STCA_BUILDER_AUDIENCES } from '../data/stcaAudience';
import {
  generateSocialPack,
  type GeneratedSocialPack,
} from '../services/socialGeneratorService';

interface SocialGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  initialPresenterId?: string;
  initialAudienceId?: string;
}

type AspectRatio = '1:1' | '9:16' | '16:9';
type Platform = 'instagram' | 'facebook' | 'linkedIn' | 'twitter' | 'shortVideo';

export const SocialGeneratorModal: React.FC<SocialGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialTopic = 'How to Review Contractor Estimates & Spot Hidden Markups',
  initialPresenterId = 'tool-cowboy',
  initialAudienceId = 'homeowners',
}) => {
  const [topic, setTopic] = useState(initialTopic);
  const [presenterId, setPresenterId] = useState(initialPresenterId);
  const [audienceId, setAudienceId] = useState(initialAudienceId);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [accentColor, setAccentColor] = useState<'#f59e0b' | '#10b981' | '#06b6d4' | '#f97316'>('#f59e0b');
  const [activePlatform, setActivePlatform] = useState<Platform>('instagram');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [pack, setPack] = useState<GeneratedSocialPack | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync initial props
  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
    if (initialPresenterId) setPresenterId(initialPresenterId);
    if (initialAudienceId) setAudienceId(initialAudienceId);
  }, [initialTopic, initialPresenterId, initialAudienceId]);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      handleGenerate();
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const generated = await generateSocialPack(topic, presenterId, audienceId);
      setPack(generated);
    } catch (e) {
      console.error('Error generating social pack:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Render high-res graphic on Canvas
  const drawGraphic = useCallback(() => {
    if (!canvasRef.current || !pack) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 1080;
    let height = 1080;
    if (aspectRatio === '9:16') {
      width = 1080;
      height = 1920;
    } else if (aspectRatio === '16:9') {
      width = 1200;
      height = 675;
    }

    canvas.width = width;
    canvas.height = height;

    // 1. Dark Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Accent Radial Glow
    const glow = ctx.createRadialGradient(width * 0.8, height * 0.2, 50, width * 0.8, height * 0.2, width * 0.6);
    glow.addColorStop(0, `${accentColor}26`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Subtle Grid Overlay Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const step = 80;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Outer Border Frame
    ctx.strokeStyle = `${accentColor}40`;
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    const padX = width * 0.08;
    let curY = height * 0.09;

    // 2. STCA Academy Header
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillText('SMART TOOLS CONSTRUCTION ACADEMY', padX, curY);

    curY += 35;

    // Audience Tag Badge
    const badgeText = pack.graphicData.badge.toUpperCase();
    ctx.font = 'bold 18px Inter, sans-serif';
    const badgeWidth = ctx.measureText(badgeText).width + 30;
    ctx.fillStyle = `${accentColor}22`;
    ctx.strokeStyle = `${accentColor}88`;
    ctx.lineWidth = 1.5;
    roundRect(ctx, padX, curY - 22, badgeWidth, 34, 17, true, true);
    ctx.fillStyle = accentColor;
    ctx.fillText(badgeText, padX + 15, curY);

    curY += aspectRatio === '9:16' ? 90 : 60;

    // 3. Presenter Row
    const presenterAvatar = new Image();
    presenterAvatar.crossOrigin = 'anonymous';
    presenterAvatar.src = pack.presenter.avatarUrl;
    presenterAvatar.onload = () => {
      // Re-trigger draw once avatar loads if needed
      ctx.save();
      ctx.beginPath();
      ctx.arc(padX + 36, curY + 10, 36, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(presenterAvatar, padX, curY - 26, 72, 72);
      ctx.restore();

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(padX + 36, curY + 10, 37, 0, Math.PI * 2);
      ctx.stroke();
    };

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText(pack.presenter.name, padX + 90, curY + 2);

    ctx.fillStyle = accentColor;
    ctx.font = '500 19px Inter, sans-serif';
    ctx.fillText(`${pack.presenter.primaryRole || 'Authority'} • "${pack.presenter.buyerAnchor || 'Trust me.'}"`, padX + 90, curY + 28);

    curY += aspectRatio === '9:16' ? 140 : 100;

    // 4. Main Headline
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${aspectRatio === '9:16' ? 56 : 46}px Inter, sans-serif`;
    const headlineLines = wrapText(ctx, pack.graphicData.headline, width - padX * 2);
    headlineLines.forEach((line) => {
      ctx.fillText(line, padX, curY);
      curY += aspectRatio === '9:16' ? 70 : 58;
    });

    curY += 25;

    // 5. Bullet Takeaways Card Box
    const boxY = curY;
    const boxHeight = aspectRatio === '9:16' ? 440 : aspectRatio === '16:9' ? 190 : 280;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, padX, boxY, width - padX * 2, boxHeight, 20, true, true);

    let bulletY = boxY + (aspectRatio === '16:9' ? 45 : 55);
    const bullets = pack.graphicData.bulletPoints.slice(0, 3);
    bullets.forEach((bullet) => {
      // Checkmark Circle Icon
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(padX + 30, bulletY - 8, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('✓', padX + 25, bulletY - 3);

      // Bullet Text
      ctx.fillStyle = '#e2e8f0';
      ctx.font = `${aspectRatio === '16:9' ? 20 : 23}px Inter, sans-serif`;
      const wrapped = wrapText(ctx, `${bullet}`, width - padX * 2 - 70);
      wrapped.forEach((line, lineIdx) => {
        ctx.fillText(line, padX + 55, bulletY + lineIdx * 28);
      });

      bulletY += aspectRatio === '9:16' ? 115 : aspectRatio === '16:9' ? 55 : 75;
    });

    // 6. Footer Call-to-Action & URL
    const footerY = height - (aspectRatio === '9:16' ? 110 : 65);
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText('⚡ ' + pack.graphicData.ctaText, padX, footerY);

    ctx.fillStyle = '#64748b';
    ctx.font = '18px Inter, sans-serif';
    ctx.fillText('smarttoolsconstructionacademy.com', padX, footerY + 28);
  }, [pack, aspectRatio, accentColor]);

  // Redraw when state updates
  useEffect(() => {
    if (pack) {
      drawGraphic();
    }
  }, [pack, aspectRatio, accentColor, drawGraphic]);

  const handleDownloadImage = () => {
    if (!canvasRef.current || !pack) return;
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    const safeTopic = (pack.topic || 'stca-graphic')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 40);
    link.download = `STCA-${safeTopic}-${aspectRatio.replace(':', 'x')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20">
              <Share2 className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-black text-slate-100">
                  STCA Social Media Studio: Captions & Graphic
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  Residential Builders
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Generate high-impact social captions and branded graphics for Homeowners, DIYers, and Aspiring Handypeople.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Controls Header */}
        <div className="px-6 py-3.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter topic..."
              className="flex-1 min-w-[200px] px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />

            {/* Presenter Picker */}
            <select
              value={presenterId}
              onChange={(e) => setPresenterId(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              {APPROVED_PRESENTERS.filter((p) => ['tool-cowboy', 'ms-fix-it', 'robo-builder'].includes(p.id)).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Audience Picker */}
            <select
              value={audienceId}
              onChange={(e) => setAudienceId(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              {STCA_BUILDER_AUDIENCES.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.tierTag})
                </option>
              ))}
            </select>
          </div>

          {/* Regenerate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-400/20 transition inline-flex items-center space-x-1.5 shrink-0"
          >
            {isGenerating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            )}
            <span>{isGenerating ? 'Generating...' : 'Auto-Generate Content'}</span>
          </button>
        </div>

        {/* Modal Main Body (2 Columns) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Column 1: Captions (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Platform Selector Tabs */}
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-800 overflow-x-auto">
              <button
                onClick={() => setActivePlatform('instagram')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 shrink-0 ${
                  activePlatform === 'instagram'
                    ? 'bg-gradient-to-r from-pink-500/20 to-amber-500/20 text-pink-300 border border-pink-500/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5 text-pink-400" />
                <span>Instagram / Threads</span>
              </button>

              <button
                onClick={() => setActivePlatform('facebook')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 shrink-0 ${
                  activePlatform === 'facebook'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>Facebook</span>
              </button>

              <button
                onClick={() => setActivePlatform('linkedIn')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 shrink-0 ${
                  activePlatform === 'linkedIn'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>LinkedIn</span>
              </button>

              <button
                onClick={() => setActivePlatform('twitter')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 shrink-0 ${
                  activePlatform === 'twitter'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Send className="w-3.5 h-3.5 text-sky-400" />
                <span>X / Twitter</span>
              </button>

              <button
                onClick={() => setActivePlatform('shortVideo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1.5 shrink-0 ${
                  activePlatform === 'shortVideo'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-rose-400" />
                <span>Reel / TikTok Script</span>
              </button>
            </div>

            {/* Caption View Container */}
            {pack ? (
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                
                {/* Instagram Tab */}
                {activePlatform === 'instagram' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-pink-400 tracking-wider">
                        Instagram & Threads Caption
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `${pack.captions.instagram.hook}\n\n${pack.captions.instagram.body}\n\n${pack.captions.instagram.cta}\n\n${pack.captions.instagram.hashtags.join(' ')}`,
                            'ig'
                          )
                        }
                        className="px-2.5 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg inline-flex items-center space-x-1 transition"
                      >
                        {copiedKey === 'ig' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'ig' ? 'Copied!' : 'Copy Caption'}</span>
                      </button>
                    </div>

                    <p className="text-xs font-bold text-slate-100 bg-slate-900 p-3 rounded-xl border border-slate-800">
                      {pack.captions.instagram.hook}
                    </p>

                    <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                      {pack.captions.instagram.body}
                    </p>

                    <p className="text-xs font-semibold text-amber-400">
                      {pack.captions.instagram.cta}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                      {pack.captions.instagram.hashtags.map((h, i) => (
                        <span key={i} className="text-[11px] font-mono text-cyan-400">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Facebook Tab */}
                {activePlatform === 'facebook' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-blue-400 tracking-wider">
                        Facebook Community Post
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `${pack.captions.facebook.hook}\n\n${pack.captions.facebook.body}\n\n${pack.captions.facebook.discussionQuestion}\n\n${pack.captions.facebook.hashtags.join(' ')}`,
                            'fb'
                          )
                        }
                        className="px-2.5 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg inline-flex items-center space-x-1 transition"
                      >
                        {copiedKey === 'fb' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'fb' ? 'Copied!' : 'Copy Post'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-200 font-semibold leading-relaxed">
                      {pack.captions.facebook.hook}
                    </p>

                    <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                      {pack.captions.facebook.body}
                    </p>

                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300">
                      <strong>Engagement Question:</strong> {pack.captions.facebook.discussionQuestion}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                      {pack.captions.facebook.hashtags.map((h, i) => (
                        <span key={i} className="text-[11px] font-mono text-blue-400">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* LinkedIn Tab */}
                {activePlatform === 'linkedIn' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-cyan-400 tracking-wider">
                        LinkedIn Authority Post
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `${pack.captions.linkedIn.hook}\n\n${pack.captions.linkedIn.body}\n\n${pack.captions.linkedIn.hashtags.join(' ')}`,
                            'li'
                          )
                        }
                        className="px-2.5 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg inline-flex items-center space-x-1 transition"
                      >
                        {copiedKey === 'li' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'li' ? 'Copied!' : 'Copy Article'}</span>
                      </button>
                    </div>

                    <p className="text-xs font-bold text-slate-100">
                      {pack.captions.linkedIn.hook}
                    </p>

                    <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                      {pack.captions.linkedIn.body}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                      {pack.captions.linkedIn.hashtags.map((h, i) => (
                        <span key={i} className="text-[11px] font-mono text-cyan-400">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Twitter Tab */}
                {activePlatform === 'twitter' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-sky-400 tracking-wider">
                        X / Twitter Thread
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `${pack.captions.twitter.tweet}\n\n---\n\n${pack.captions.twitter.threadFollowUp || ''}`,
                            'tw'
                          )
                        }
                        className="px-2.5 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg inline-flex items-center space-x-1 transition"
                      >
                        {copiedKey === 'tw' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'tw' ? 'Copied!' : 'Copy Tweet'}</span>
                      </button>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-200 whitespace-pre-line">
                      {pack.captions.twitter.tweet}
                    </div>

                    {pack.captions.twitter.threadFollowUp && (
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 whitespace-pre-line">
                        <span className="text-[10px] text-slate-500 font-bold block mb-1">Thread Reply:</span>
                        {pack.captions.twitter.threadFollowUp}
                      </div>
                    )}
                  </div>
                )}

                {/* Short Video Script Tab */}
                {activePlatform === 'shortVideo' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-rose-400 tracking-wider">
                        TikTok / Reel 30s Script
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `HOOK (0-3s): ${pack.captions.shortVideoScript.hook3s}\n\nVOICEOVER: ${pack.captions.shortVideoScript.voiceover}\n\nON-SCREEN: ${pack.captions.shortVideoScript.onScreenText}\n\nCAPTION: ${pack.captions.shortVideoScript.caption}`,
                            'video'
                          )
                        }
                        className="px-2.5 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg inline-flex items-center space-x-1 transition"
                      >
                        {copiedKey === 'video' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'video' ? 'Copied!' : 'Copy Script'}</span>
                      </button>
                    </div>

                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                      <strong>Hook (First 3 Seconds):</strong> "{pack.captions.shortVideoScript.hook3s}"
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Voiceover Narrative:</span>
                      <p className="text-xs text-slate-200 leading-relaxed">{pack.captions.shortVideoScript.voiceover}</p>
                    </div>

                    <div className="text-xs text-slate-400">
                      <strong>On-Screen Text:</strong> {pack.captions.shortVideoScript.onScreenText}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
                Click "Auto-Generate Content" to build captions...
              </div>
            )}
          </div>

          {/* Column 2: Graphic Preview & Canvas Studio (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            
            {/* Graphic Tools Toolbar */}
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
              
              {/* Aspect Ratio Buttons */}
              <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['1:1', '9:16', '16:9'] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      aspectRatio === ratio
                        ? 'bg-amber-400 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ratio === '1:1' ? '1:1 Post' : ratio === '9:16' ? '9:16 Reel' : '16:9 Card'}
                  </button>
                ))}
              </div>

              {/* Accent Color Chooser */}
              <div className="flex items-center space-x-1.5">
                {[
                  { color: '#f59e0b', label: 'Gold' },
                  { color: '#10b981', label: 'Emerald' },
                  { color: '#06b6d4', label: 'Cyan' },
                  { color: '#f97316', label: 'Orange' },
                ].map((c) => (
                  <button
                    key={c.color}
                    onClick={() => setAccentColor(c.color as any)}
                    style={{ backgroundColor: c.color }}
                    className={`w-5 h-5 rounded-full transition transform hover:scale-110 ${
                      accentColor === c.color ? 'ring-2 ring-white scale-110' : 'opacity-70'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Canvas Preview Container */}
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-center min-h-[320px] max-h-[460px] overflow-hidden">
              <canvas
                ref={canvasRef}
                className="max-h-[420px] max-w-full rounded-xl shadow-2xl object-contain border border-slate-700/50"
              />
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownloadImage}
              disabled={!pack}
              className="w-full py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-400/20 transition flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Branded Graphic (.PNG)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper: Canvas Rounded Rectangle
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: boolean,
  stroke: boolean
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// Helper: Canvas Text Wrapping
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}
