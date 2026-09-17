import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Radio,
} from 'lucide-react';
import type { JobInputs, STCABlogPackage } from '../types/blog';
import { APPROVED_PRESENTERS } from '../data/presenters';
import { runSTCAOrchestrator } from '../services/stcaOrchestrator';

interface GeneratorWizardProps {
  onPackageGenerated: (pkg: STCABlogPackage) => void;
}

const PRESET_TOPICS = [
  'Heavy Equipment Maintenance & Field Safety SOPs',
  'Automating Canva Visual Briefs for STCA Content',
  'AI-Powered Construction Workflow Optimization',
  'Standardizing On-Site Quality Control & QA Gates',
  'Field Operations: Reducing Equipment Downtime',
];

export const GeneratorWizard: React.FC<GeneratorWizardProps> = ({ onPackageGenerated }) => {
  const [topic, setTopic] = useState('');
  const [selectedPresenterId, setSelectedPresenterId] = useState('tool-cowboy');
  const [targetLength, setTargetLength] = useState<JobInputs['targetLength']>('Standard (1500-2000w)');
  const [funnelStage, setFunnelStage] = useState<JobInputs['funnelStage']>('TOFU (Awareness)');
  const [market, setMarket] = useState('North America / Global');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(-1);
  const [currentPhaseText, setCurrentPhaseText] = useState<string>('');

  const selectedPresenter = APPROVED_PRESENTERS.find((p) => p.id === selectedPresenterId) || APPROVED_PRESENTERS[0];

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsGenerating(true);
    setCurrentPhaseIndex(0);

    const initialJob: JobInputs = {
      id: `STCA-JOB-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      topic: topic.trim(),
      audience: 'STCA Operations Leads, Site Managers, and Content Strategists',
      searchIntent: 'Informational & Tactical SOP Guidance',
      ctaOffer: 'Free Downloadable STCA Canva Template & Voice Brief Toolkit',
      destination: 'STCA Blog Portal / CMS',
      presenterId: selectedPresenterId,
      targetLength,
      market,
      funnelStage,
      canvaTemplateId: 'STCA-CANVA-MASTER-BLOG-2026',
      voiceId: selectedPresenter.masterVoiceId,
      status: 'PROCESSING',
    };

    try {
      const generatedPackage = await runSTCAOrchestrator(initialJob, (phaseIdx, phaseText) => {
        setCurrentPhaseIndex(phaseIdx);
        setCurrentPhaseText(phaseText);
      });

      setIsGenerating(false);
      onPackageGenerated(generatedPackage);
    } catch (err) {
      console.error('Orchestrator Error:', err);
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
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
              Researches content, assigns approved avatars & voices, specs Canva graphics, synthesizes voiceovers, builds social repurposing, and runs 12-point QA.
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
        {/* Topic Input */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-200">
            1. Enter Blog Topic or Working Title <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isGenerating}
            placeholder="e.g. Heavy Equipment Maintenance & Field Safety SOPs..."
            className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-base shadow-inner transition"
          />

          {/* Presets */}
          <div className="space-y-1.5 pt-1">
            <span className="text-xs font-semibold text-slate-400">Quick Topic Suggestions:</span>
            <div className="flex flex-wrap gap-2">
              {PRESET_TOPICS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTopic(preset)}
                  disabled={isGenerating}
                  className="px-2.5 py-1 text-xs font-medium bg-slate-800/80 hover:bg-amber-500/20 hover:border-amber-500/40 border border-slate-700 text-slate-300 rounded-lg transition"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Presenter Persona Selector */}
        <div className="space-y-3 pt-2">
          <label className="block text-sm font-bold text-slate-200">
            2. Select Approved STCA Presenter Persona <span className="text-amber-400">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {APPROVED_PRESENTERS.map((p) => {
              const isSelected = p.id === selectedPresenterId;
              return (
                <div
                  key={p.id}
                  onClick={() => !isGenerating && setSelectedPresenterId(p.id)}
                  className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border relative ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 text-amber-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex items-center space-x-3 mb-2">
                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow"
                    />
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{p.name}</h4>
                      <p className="text-[11px] text-amber-400 font-medium">{p.role}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 italic line-clamp-2 mt-2">
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
                Phase {currentPhaseIndex + 1} of 11
              </span>
            </div>

            {/* Progress Bar Track */}
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-amber-500/30">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${Math.max(8, ((currentPhaseIndex + 1) / 11) * 100)}%` }}
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
                <span>Running 11-Phase Production Pipeline...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Complete STCA Blog Package</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
