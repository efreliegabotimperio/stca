import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  ExternalLink,
  Zap,
  CheckCircle2,
  Copy,
  Sparkles,
  Link,
} from 'lucide-react';
import type { STCABlogPackage } from '../types/blog';
import {
  getStoredOpenAIKey,
  getStoredCanvaDesignUrl,
  saveCanvaDesignUrl,
} from '../services/authService';
import OpenAI from 'openai';

interface CanvaAudioModalProps {
  isOpen: boolean;
  pkg: STCABlogPackage;
  onClose: () => void;
}

function getOpenAIVoiceForPresenter(presenterId: string): 'nova' | 'ash' | 'onyx' | 'shimmer' | 'alloy' {
  switch (presenterId) {
    case 'ms-fix-it':
      return 'nova';
    case 'tool-cowboy':
      return 'ash';
    case 'robo-builder':
      return 'onyx';
    case 'stca-neutral':
    default:
      return 'shimmer';
  }
}

export const CanvaAudioModal: React.FC<CanvaAudioModalProps> = ({
  isOpen,
  pkg,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [canvaTriggerSuccess, setCanvaTriggerSuccess] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [copiedDataset, setCopiedDataset] = useState(false);

  // Custom Canva Design URL per presenter
  const [canvaDesignUrl, setCanvaDesignUrl] = useState<string>('');
  const [showCanvaUrlInput, setShowCanvaUrlInput] = useState<boolean>(false);

  // Web Speech Voices
  const [availableWebVoices, setAvailableWebVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedWebVoiceURI, setSelectedWebVoiceURI] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load settings on open
  useEffect(() => {
    if (!isOpen) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    const savedUrl = getStoredCanvaDesignUrl(pkg.presenter.id);
    setCanvaDesignUrl(savedUrl);

    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableWebVoices(voices);

        if (voices.length > 0 && !selectedWebVoiceURI) {
          const isFemale = pkg.presenter.id === 'ms-fix-it' || pkg.presenter.id === 'stca-neutral';
          const match = voices.find((v) => {
            const name = v.name.toLowerCase();
            if (isFemale) {
              return name.includes('zira') || name.includes('samantha') || name.includes('victoria') || name.includes('female') || name.includes('karen');
            } else {
              return name.includes('david') || name.includes('mark') || name.includes('george') || name.includes('derek') || name.includes('male') || name.includes('brian');
            }
          }) || voices.find((v) => v.lang.startsWith('en')) || voices[0];

          if (match) {
            setSelectedWebVoiceURI(match.voiceURI);
          }
        }
      }
    };

    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [isOpen, pkg.presenter.id, selectedWebVoiceURI]);

  if (!isOpen) return null;

  const targetCanvaUrl = canvaDesignUrl.trim() || 'https://canva.com';

  // Automatically trigger Canva Voice AI Workflow
  const handleAutoGenerateCanvaVoice = () => {
    navigator.clipboard.writeText(pkg.voiceover.spokenPhrasingScript);

    setCanvaTriggerSuccess(true);
    setTimeout(() => setCanvaTriggerSuccess(false), 5000);

    window.open(targetCanvaUrl, '_blank');
  };

  // Generate In-App Preview Audio
  const handleGenerateAIVoice = async () => {
    setIsGeneratingAudio(true);

    const apiKey = getStoredOpenAIKey();
    if (!apiKey || !apiKey.trim().startsWith('sk-')) {
      handlePlayBrowserSpeech();
      setIsGeneratingAudio(false);
      return;
    }

    try {
      const openai = new OpenAI({ apiKey: apiKey.trim(), dangerouslyAllowBrowser: true });
      const voice = getOpenAIVoiceForPresenter(pkg.presenter.id);
      const scriptText = pkg.voiceover.spokenPhrasingScript.slice(0, 1000);

      const mp3Response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice,
        input: scriptText,
      });

      const blob = new Blob([await mp3Response.arrayBuffer()], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('AI Voice Generation error:', err);
      handlePlayBrowserSpeech();
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Browser Speech Synthesis fallback
  const handlePlayBrowserSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Browser does not support text-to-speech audio.');
      return;
    }

    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const newUtterance = new SpeechSynthesisUtterance(pkg.voiceover.spokenPhrasingScript);
    newUtterance.rate = 1.0;

    const voice = availableWebVoices.find((v) => v.voiceURI === selectedWebVoiceURI);
    if (voice) {
      newUtterance.voice = voice;
    }

    newUtterance.onend = () => setIsPlaying(false);
    newUtterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(newUtterance);
    setIsPlaying(true);
  };

  const handleCopyCanvaDataset = () => {
    const dataset = {
      template_id: pkg.canvaVisualSpec.templateId,
      blog_title: pkg.blogMaster.h1Title,
      presenter_name: pkg.presenter.name,
      presenter_avatar_id: pkg.presenter.masterAvatarId,
      presenter_voice_id: pkg.presenter.masterVoiceId,
      primary_color: pkg.canvaVisualSpec.colorPalette.primary,
      secondary_color: pkg.canvaVisualSpec.colorPalette.secondary,
      accent_color: pkg.canvaVisualSpec.colorPalette.accent,
      hero_headline: pkg.canvaVisualSpec.graphicsList[0]?.headline || '',
      cta_headline: pkg.canvaVisualSpec.graphicsList[3]?.headline || '',
    };

    navigator.clipboard.writeText(JSON.stringify(dataset, null, 2));
    setCopiedDataset(true);
    setTimeout(() => setCopiedDataset(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl glass-panel border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-amber-500 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">
              Canva & Voiceover Audio Integration
            </h3>
            <p className="text-xs text-slate-400">
              Assigned Presenter: <strong className="text-slate-200">{pkg.presenter.name}</strong> (Canva Voice ID: <span className="text-amber-400 font-mono font-bold">{pkg.presenter.masterVoiceId}</span>)
            </p>
          </div>
        </div>

        {/* Direct Canva Voice AI Generator Banner */}
        <div className="glass-panel border-cyan-500/40 rounded-2xl p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-slate-100 text-sm">Automated Canva Voice AI Generator</h4>
              </div>
              <p className="text-xs text-slate-300">
                Copies script & opens your linked Canva design (<span className="text-amber-400 font-mono font-bold">{pkg.presenter.masterVoiceId}</span>).
              </p>
            </div>

            <button
              type="button"
              onClick={handleAutoGenerateCanvaVoice}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl font-extrabold text-xs bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500 text-slate-950 hover:from-cyan-300 hover:to-blue-400 transition shadow-lg shadow-cyan-500/25 shrink-0 transform active:scale-95"
            >
              <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>Generate in Canva Voice AI</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Linked Canva Design Link:</span>
              <button
                type="button"
                onClick={() => setShowCanvaUrlInput(!showCanvaUrlInput)}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center space-x-1"
              >
                <Link className="w-3 h-3" />
                <span>{canvaDesignUrl ? 'Change Link' : '+ Edit Design Link'}</span>
              </button>
            </div>

            {showCanvaUrlInput ? (
              <div className="bg-slate-950 p-2.5 rounded-xl border border-cyan-500/30 space-y-2 text-xs">
                <input
                  type="url"
                  value={canvaDesignUrl}
                  onChange={(e) => {
                    setCanvaDesignUrl(e.target.value);
                    saveCanvaDesignUrl(pkg.presenter.id, e.target.value);
                  }}
                  placeholder="e.g. https://canva.link/hcf6s3tcxkoexfv"
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-cyan-300 focus:outline-none"
                />
              </div>
            ) : (
              <div className="text-[11px] font-mono text-cyan-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 truncate">
                {targetCanvaUrl}
              </div>
            )}
          </div>

          {canvaTriggerSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Script copied! Canva opened to your design. Press Ctrl+V in Canva AI to generate audio!</span>
            </div>
          )}
        </div>

        {/* Canva Dataset Export */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleAutoGenerateCanvaVoice}
            className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/60 transition group text-left"
          >
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 flex items-center space-x-1">
                <span>Open Canva Studio</span>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </span>
              <p className="text-[11px] text-slate-400">Voice ID: {pkg.presenter.masterVoiceId}</p>
            </div>
            <Zap className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
          </button>

          <button
            onClick={handleCopyCanvaDataset}
            className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500/60 transition text-left group"
          >
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">
                {copiedDataset ? 'Copied Dataset JSON!' : 'Copy Canva Dataset JSON'}
              </span>
              <p className="text-[11px] text-slate-400">Map fields to Canva bulk create</p>
            </div>
            {copiedDataset ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Copy className="w-5 h-5 text-amber-400 group-hover:scale-110 transition" />
            )}
          </button>
        </div>

        {/* Audio Script Preview Box */}
        <div className="glass-panel-amber rounded-2xl p-4 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Generated Voice Script for {pkg.presenter.name}</span>
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleGenerateAIVoice}
                disabled={isGeneratingAudio}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Play In-App Draft</span>
              </button>
            </div>
          </div>

          {audioUrl && (
            <div className="bg-slate-950 p-2.5 rounded-xl border border-amber-500/40 flex items-center justify-between">
              <audio
                ref={audioRef}
                controls
                src={audioUrl}
                className="w-full h-8"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
            </div>
          )}

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed max-h-24 overflow-y-auto">
            {pkg.voiceover.spokenPhrasingScript}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
