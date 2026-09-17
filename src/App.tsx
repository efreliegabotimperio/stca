import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { GeneratorWizard } from './components/GeneratorWizard';
import { PackageViewer } from './components/PackageViewer';
import { LoginModal } from './components/LoginModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { CanvaAudioModal } from './components/CanvaAudioModal';
import {
  getStoredUserSession,
  saveUserSession,
  getStoredPackageHistory,
  savePackageToHistory,
  deletePackageFromHistory,
  loadAllSettingsFromSupabase,
} from './services/authService';
import { runSTCAOrchestrator } from './services/stcaOrchestrator';
import type { STCABlogPackage, UserSession } from './types/blog';

export function App() {
  const [user, setUser] = useState<UserSession>(getStoredUserSession());
  const [history, setHistory] = useState<STCABlogPackage[]>([]);
  const [activePackage, setActivePackage] = useState<STCABlogPackage | null>(null);

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCanvaAudioOpen, setIsCanvaAudioOpen] = useState(false);

  // Load history & Supabase settings on mount & generate initial demo package if history is empty
  useEffect(() => {
    loadAllSettingsFromSupabase().catch((err) =>
      console.warn('Could not load Supabase settings on startup:', err)
    );

    const loaded = getStoredPackageHistory();
    setHistory(loaded);

    if (loaded.length > 0) {
      setActivePackage(loaded[0]);
    } else {
      // Create a default initial package to wow the user immediately
      runSTCAOrchestrator({
        id: 'STCA-DEMO-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        topic: 'Heavy Equipment Maintenance & Field Safety SOPs',
        audience: 'Site Supervisors & Operations Managers',
        searchIntent: 'Tactical Field SOP Guidance',
        ctaOffer: 'Free STCA Maintenance Checklist Template',
        destination: 'STCA Blog Portal',
        presenterId: 'tool-cowboy',
        targetLength: 'Standard (1500-2000w)',
        market: 'North America',
        funnelStage: 'TOFU (Awareness)',
        canvaTemplateId: 'STCA-CANVA-MASTER-BLOG-2026',
        voiceId: 'STCA-VOICE-DEREK-MULTILINGUAL',
        status: 'READY_FOR_PUBLISH',
      }).then((demoPkg) => {
        const updated = savePackageToHistory(demoPkg);
        setHistory(updated);
        setActivePackage(demoPkg);
      });
    }
  }, []);

  const handleSaveUser = (updatedSession: UserSession) => {
    setUser(updatedSession);
    saveUserSession(updatedSession);
  };

  const handlePackageGenerated = (pkg: STCABlogPackage) => {
    const updatedHistory = savePackageToHistory(pkg);
    setHistory(updatedHistory);
    setActivePackage(pkg);
  };

  const handleDeletePackage = (jobId: string) => {
    const updatedHistory = deletePackageFromHistory(jobId);
    setHistory(updatedHistory);
    if (activePackage?.job.id === jobId) {
      setActivePackage(updatedHistory[0] || null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header Navigation */}
      <Navbar
        user={user}
        historyCount={history.length}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewGenerator={() => setActivePackage(null)}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activePackage ? (
          <PackageViewer
            pkg={activePackage}
            onOpenCanvaAudioModal={() => setIsCanvaAudioOpen(true)}
          />
        ) : (
          <GeneratorWizard onPackageGenerated={handlePackageGenerated} />
        )}
      </main>

      {/* Modals & Drawers */}
      <LoginModal
        isOpen={isLoginOpen}
        currentUser={user}
        onClose={() => setIsLoginOpen(false)}
        onSaveUser={handleSaveUser}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        history={history}
        onClose={() => setIsHistoryOpen(false)}
        onSelectPackage={(pkg) => setActivePackage(pkg)}
        onDeletePackage={handleDeletePackage}
      />

      {activePackage && (
        <CanvaAudioModal
          isOpen={isCanvaAudioOpen}
          pkg={activePackage}
          onClose={() => setIsCanvaAudioOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-400">
            STCA STUDIOS — Ultimate Blog Production Orchestrator (v2.0.0)
          </p>
          <p>
            Standalone SOP Web Application • Researched & Built to Spec from Google Doc Requirements
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
