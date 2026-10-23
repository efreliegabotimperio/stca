import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Radio,
  Wand2,
  Lock,
  Unlock,
  Shuffle,
  Home,
  Hammer,
  Wrench,
  Share2,
} from 'lucide-react';
import type { JobInputs, STCABlogPackage } from '../types/blog';
import { APPROVED_PRESENTERS } from '../data/presenters';
import { runSTCAOrchestrator } from '../services/stcaOrchestrator';
import { decidePersonaForTopic } from '../services/personaDecisionService';
import {
  STCA_BUILDER_AUDIENCES,
  getRandomSuggestedTopic,
} from '../data/stcaAudience';
import { SocialGeneratorModal } from './SocialGeneratorModal';

interface GeneratorWizardProps {
  currentUser?: import('../types/blog').UserSession | null;
  onPackageGenerated: (pkg: STCABlogPackage) => void;
}

// The Official STCA Trio
const STCA_TRIO = APPROVED_PRESENTERS.filter((p) =>
  ['tool-cowboy', 'ms-fix-it', 'robo-builder'].includes(p.id)
);

export const GeneratorWizard: React.FC<GeneratorWizardProps> = ({ currentUser, onPackageGenerated }) => {
  const [topic, setTopic] = useState('');
  const [selectedAudienceId, setSelectedAudienceId] = useState<'all' | 'homeowners' | 'diy-remodelers' | 'aspiring-handypeople'>('all');
  const [autoDecidePersona, setAutoDecidePersona] = useState(true);
  const [selectedPresenterId, setSelectedPresenterId] = useState('tool-cowboy');
  const [targetLength, setTargetLength] = useState<JobInputs['targetLength']>('Standard (1500-2000w)');
  const [funnelStage, setFunnelStage] = useState<JobInputs['funnelStage']>('TOFU (Awareness)');
  const [market, setMarket] = useState('North America / Global');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(-1);
  const [currentPhaseText, setCurrentPhaseText] = useState<string>('');

  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);

  // Dynamically evaluate optimal persona according to the STCA Trio specification
  const autoDecision = useMemo(
    () => decidePersonaForTopic(topic, undefined, funnelStage),
    [topic, funnelStage]
  );

  const effectivePresenter = autoDecidePersona
    ? autoDecision.persona
    : APPROVED_PRESENTERS.find((p) => p.id === selectedPresenterId) || APPROVED_PRESENTERS[0];

  const handleAutoGenerateTopic = (targetAudId?: string) => {
    const res = getRandomSuggestedTopic(targetAudId || selectedAudienceId);
    setTopic(res.topic);
    if (selectedAudienceId === 'all') {
      setSelectedAudienceId(res.audience.id);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setCurrentPhaseIndex(0);

    const activeAudienceObj = STCA_BUILDER_AUDIENCES.find((a) => a.id === selectedAudienceId);
    const audienceText = activeAudienceObj
      ? `${activeAudienceObj.name} (${activeAudienceObj.tierTag}: ${activeAudienceObj.tagline})`
      : 'STCA Builders: Homeowners, DIY Remodelers & Aspiring Handypeople';
    const ctaOfferText = activeAudienceObj
      ? activeAudienceObj.defaultOffer
      : 'Free STCA Builder Toolkit & Project Checklists';

    const initialJob: JobInputs = {
      id: `STCA-JOB-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      topic: topic.trim(),
      audience: audienceText,
      searchIntent: 'Informational & Tactical Residential Remodel Guidance',
      ctaOffer: ctaOfferText,
      destination: 'STCA Blog Portal / CMS',
      presenterId: autoDecidePersona ? 'auto' : effectivePresenter.id,
      targetLength,
      market,
      funnelStage,
      canvaTemplateId: 'STCA-CANVA-MASTER-BLOG-2026',
      voiceId: effectivePresenter.masterVoiceId,
      status: 'PROCESSING',
      userId: currentUser?.id,
      userEmail: currentUser?.email,
      userName: currentUser?.username,
      userRole: currentUser?.role || 'standard user',
    };

    try {
      const generatedPackage = await runSTCAOrchestrator(initialJob, (phaseIdx, phaseText) => {
        setCurrentPhaseIndex(phaseIdx);
        setCurrentPhaseText(phaseText);
      });

      generatedPackage.userEmail = currentUser?.email;
      generatedPackage.userRole = currentUser?.role || 'standard user';
      generatedPackage.userName = currentUser?.username;
      generatedPackage.userId = currentUser?.id;
      generatedPackage.job.userEmail = currentUser?.email;
      generatedPackage.job.userRole = currentUser?.role || 'standard user';
      generatedPackage.job.userName = currentUser?.username;
      generatedPackage.job.userId = currentUser?.id;

      setIsGenerating(false);
      onPackageGenerated(generatedPackage);
    } catch (err) {
      console.error('Orchestrator Error:', err);
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      {/* Header Banner */}
      <div className="glass-panel border-amber-500/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>STCA Ultimate Blog Skill v2.0.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Create STCA Production Blog Package
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Researches content, automatically matches official STCA Trio personas, builds social repurposing, and runs 12-point QA.
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <div className="text-xs">
              <span className="text-slate-400 block font-medium">Orchestrator Status</span>
              <span className="text-emerald-400 font-bold">READY TO EXECUTE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Generator Form */}
      <div className="glass-panel border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">

        {/* STCA Audience: Built for Three Kinds of Builders */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                WHO WE SERVE (smarttoolsconstructionacademy.com)
              </span>
              <h3 className="text-sm font-bold text-slate-200">
                Built for Three Kinds of Builders
              </h3>
              <p className="text-xs text-slate-400">
                STCA is designed for residential builders and homeowners — not big commercial construction companies.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Auto-Generate Suggested Topic Button */}
              <button
                type="button"
                onClick={() => handleAutoGenerateTopic()}
                disabled={isGenerating}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md shadow-amber-400/20 transition-all transform active:scale-95 shrink-0"
              >
                <Shuffle className="w-3.5 h-3.5 fill-slate-950" />
                <span>Auto-Generate Topic</span>
              </button>

              {/* Generate Social Captions & Graphic Button */}
              <button
                type="button"
                onClick={() => setIsSocialModalOpen(true)}
                disabled={isGenerating}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-black bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 shadow-sm transition-all transform active:scale-95 shrink-0"
                title="Generate Social Media Captions & Graphic"
              >
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Social Captions & Graphic</span>
              </button>
            </div>
          </div>

          {/* Builder Category Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {STCA_BUILDER_AUDIENCES.map((b) => {
              const isAudSelected = selectedAudienceId === b.id;
              const IconComponent =
                b.id === 'homeowners' ? Home : b.id === 'diy-remodelers' ? Hammer : Wrench;

              return (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedAudienceId(isAudSelected ? 'all' : b.id);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 relative ${
                    isAudSelected
                      ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black tracking-wider uppercase text-amber-400/90">
                      {b.tierTag}
                    </span>
                    <IconComponent className="w-4 h-4 text-amber-400/80" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">{b.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {b.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Topic Input */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-bold text-slate-200">
              1. Enter Blog Topic or Working Title <span className="text-amber-400">*</span>
            </label>
            {selectedAudienceId !== 'all' && (
              <span className="text-[11px] text-amber-400 font-semibold">
                Filtering for: {STCA_BUILDER_AUDIENCES.find((a) => a.id === selectedAudienceId)?.name}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
              placeholder="e.g. How to Review Contractor Estimates & Spot Hidden Markups..."
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-base shadow-inner transition pr-28"
            />
            <button
              type="button"
              onClick={() => handleAutoGenerateTopic()}
              className="absolute right-2 top-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition inline-flex items-center space-x-1.5"
            >
              <Shuffle className="w-3 h-3 text-amber-400" />
              <span>Shuffle</span>
            </button>
          </div>

          {/* Builder Curated Topic Suggestions */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">
                Suggested Topics based on STCA 3 Builders:
              </span>
              {selectedAudienceId !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedAudienceId('all')}
                  className="text-[11px] text-slate-400 hover:text-amber-300 underline"
                >
                  Show all topics
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {STCA_BUILDER_AUDIENCES
                .filter((a) => selectedAudienceId === 'all' || a.id === selectedAudienceId)
                .flatMap((a) => a.presetTopics.map((t) => ({ topic: t, audience: a })))
                .map((item) => (
                  <button
                    key={item.topic}
                    type="button"
                    onClick={() => {
                      setTopic(item.topic);
                      setSelectedAudienceId(item.audience.id);
                    }}
                    disabled={isGenerating}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl transition border text-left flex items-center space-x-2 ${
                      topic === item.topic
                        ? 'bg-amber-400 text-slate-950 font-bold border-amber-300 shadow-sm'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        topic === item.topic
                          ? 'bg-slate-950/20 text-slate-950'
                          : 'bg-slate-800 text-amber-400/90'
                      }`}
                    >
                      {item.audience.tierTag.replace('FOR ', '')}
                    </span>
                    <span>{item.topic}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>

          {/* Presenter Persona Selector with Auto-Decide Support */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-sm font-bold text-slate-200">
                2. STCA Trio Presenter Persona <span className="text-amber-400">*</span>
              </label>
              <p className="text-xs text-slate-400">
                Balanced authority system: Authority + Vision, Translator + Relatability, Systems + Proof.
              </p>
            </div>

            {/* Auto-Decide Toggle Button */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setAutoDecidePersona(!autoDecidePersona)}
                className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  autoDecidePersona
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm shadow-amber-400/20'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-slate-100 hover:border-slate-600'
                }`}
              >
                <Wand2 className={`w-3.5 h-3.5 ${autoDecidePersona ? 'text-slate-950' : 'text-amber-400'}`} />
                <span>Auto-Decide Persona:</span>
                <span className="uppercase font-black">
                  {autoDecidePersona ? 'ON (AI Matched)' : 'Manual'}
                </span>
                {autoDecidePersona ? <Unlock className="w-3.5 h-3.5 text-slate-950" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Real-time Auto-Decision Banner */}
          {autoDecidePersona ? (
            <div className="p-4 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-slate-900 border border-amber-500/40 rounded-2xl flex items-center justify-between gap-4 shadow-lg shadow-amber-500/5 animate-in fade-in duration-200">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/30">
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                      Auto-Matched
                    </span>
                    <span className="text-sm font-black text-slate-100">
                      {autoDecision.persona.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                      {autoDecision.persona.primaryRole || 'Authority + Vision'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {autoDecision.reason}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center justify-between text-xs text-slate-400">
              <span>Manual override active. Presenter manually locked.</span>
              <button
                type="button"
                onClick={() => setAutoDecidePersona(true)}
                className="text-amber-400 hover:text-amber-300 font-bold inline-flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Re-enable Auto Match</span>
              </button>
            </div>
          )}

          {/* The 3 Official STCA Trio Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {STCA_TRIO.map((p) => {
              const isSelected = effectivePresenter.id === p.id;
              const isAiMatch = autoDecision.persona.id === p.id;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    if (isGenerating) return;
                    setSelectedPresenterId(p.id);
                    setAutoDecidePersona(false);
                  }}
                  className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border flex flex-col justify-between relative ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500 shadow-xl shadow-amber-500/15 ring-2 ring-amber-500/40'
                      : isAiMatch
                      ? 'bg-slate-900/80 border-amber-500/40 hover:border-amber-500/60'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  {/* Top Header Row with High-Contrast Badge and Selection Indicator */}
                  <div className="flex items-center justify-between gap-2 mb-3 min-h-[26px]">
                    <div>
                      {isAiMatch ? (
                        autoDecidePersona ? (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 shadow-md shadow-amber-400/25">
                            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                            <span>Auto-Matched</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/60">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>AI Recommended</span>
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                          {p.primaryRole || 'STCA Trio'}
                        </span>
                      )}
                    </div>

                    {isSelected ? (
                      <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Selected</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-600 font-medium">Click to pick</span>
                    )}
                  </div>

                  {/* Presenter Info */}
                  <div className="flex items-start space-x-3 mb-2">
                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-100 text-sm leading-snug">{p.name}</h4>
                      <p className="text-[11px] text-amber-400 font-medium leading-tight mt-0.5">{p.role}</p>
                      {p.buyerAnchor && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-1">
                          {p.buyerAnchor}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 italic line-clamp-2 mt-1">
                    "{p.catchphrase}"
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Voice: {p.masterVoiceId}</span>
                    <span className="text-emerald-400 font-semibold">Approved</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advanced Settings Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Article Length
            </label>
            <select
              value={targetLength}
              onChange={(e) => setTargetLength(e.target.value as any)}
              disabled={isGenerating}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="Short (800-1200w)">Short (800-1200 words)</option>
              <option value="Standard (1500-2000w)">Standard (1500-2000 words)</option>
              <option value="Ultimate Guide (2500w+)">Ultimate Guide (2500+ words)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Marketing Funnel Stage
            </label>
            <select
              value={funnelStage}
              onChange={(e) => setFunnelStage(e.target.value as any)}
              disabled={isGenerating}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="TOFU (Awareness)">TOFU — Awareness & General SOP</option>
              <option value="MOFU (Consideration)">MOFU — Consideration & Workflows</option>
              <option value="BOFU (Decision)">BOFU — Decision & Tooling SOPs</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Market / Region
            </label>
            <input
              type="text"
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              disabled={isGenerating}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Live Progress Bar during execution */}
        {isGenerating && (
          <div className="glass-panel-amber rounded-2xl p-6 space-y-4 border border-amber-500/40 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
                <div>
                  <h4 className="font-bold text-amber-300 text-sm">
                    STCA Orchestrator Executing...
                  </h4>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    {currentPhaseText}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-400 font-mono">
                Phase {currentPhaseIndex + 1} of 7
              </span>
            </div>

            {/* Progress Bar Track */}
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-amber-500/30">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${Math.max(12, ((currentPhaseIndex + 1) / 7) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className={`w-full py-4 rounded-xl font-extrabold text-base tracking-wide flex items-center justify-center space-x-3 shadow-xl transition-all duration-200 transform ${
              isGenerating || !topic.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-amber-500/20 active:scale-[0.99]'
            }`}
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>Running STCA Production Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate STCA Blog Article</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Social Media Studio Modal */}
      <SocialGeneratorModal
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        initialTopic={topic}
        initialPresenterId={effectivePresenter.id}
        initialAudienceId={selectedAudienceId !== 'all' ? selectedAudienceId : 'homeowners'}
      />
    </div>
  );
};
