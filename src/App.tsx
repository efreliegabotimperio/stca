import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { GeneratorWizard } from './components/GeneratorWizard';
import { PackageViewer } from './components/PackageViewer';
import { LoginModal } from './components/LoginModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { CanvaAudioModal } from './components/CanvaAudioModal';
import { UserManagementModal } from './components/UserManagementModal';
import { AuthScreen } from './components/AuthScreen';
import {
  getStoredUserSession,
  saveUserSession,
  clearUserSession,
  getStoredPackageHistory,
  savePackageToHistory,
  deletePackageFromHistory,
  loadAllSettingsFromSupabase,
} from './services/authService';
import { signOutSupabase } from './services/supabaseService';
import { getStoredTheme, saveTheme, type AppTheme } from './services/themeService';
import type { STCABlogPackage, UserSession } from './types/blog';

export function App() {
  const [user, setUser] = useState<UserSession | null>(getStoredUserSession());
  const [theme, setTheme] = useState<AppTheme>(getStoredTheme);
  const [history, setHistory] = useState<STCABlogPackage[]>([]);
  const [activePackage, setActivePackage] = useState<STCABlogPackage | null>(null);

  const handleToggleTheme = () => {
    const nextTheme: AppTheme = theme === 'dark' ? 'light' : 'dark';
    saveTheme(nextTheme);
    setTheme(nextTheme);
  };

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCanvaAudioOpen, setIsCanvaAudioOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Load history & Supabase settings on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        await loadAllSettingsFromSupabase();
      } catch (err) {
        console.warn('Could not load Supabase settings on startup:', err);
      }

      // Purge any legacy auto-generated demo packages so they do not pollute user history
      const raw = getStoredPackageHistory();
      const hasDemo = raw.some(
        (pkg) => pkg.job?.id === 'STCA-DEMO-001' || pkg.userId === 'demo-user'
      );

      let currentHistory = raw;
      if (hasDemo) {
        currentHistory = deletePackageFromHistory('STCA-DEMO-001').filter(
          (pkg) => pkg.job?.id !== 'STCA-DEMO-001' && pkg.userId !== 'demo-user'
        );
      }

      setHistory(currentHistory);
      if (currentHistory.length > 0) {
        setActivePackage(currentHistory[0]);
      } else {
        setActivePackage(null);
      }
    };

    initApp();
  }, []);

  const handleSaveUser = (updatedSession: UserSession) => {
    setUser(updatedSession);
    saveUserSession(updatedSession);
  };

  const handleLogout = async () => {
    await signOutSupabase();
    clearUserSession();
    setUser(null);
    setIsLoginOpen(false);
    setIsUserManagementOpen(false);
  };

  const handlePackageGenerated = (pkg: STCABlogPackage) => {
    const stampedPkg: STCABlogPackage = {
      ...pkg,
      userEmail: pkg.userEmail || user?.email || 'user@stcastudios.com',
      userRole: pkg.userRole || user?.role || 'standard user',
      userName: pkg.userName || user?.username || 'Studio User',
      userId: pkg.userId || user?.id,
      job: {
        ...pkg.job,
        userEmail: pkg.job.userEmail || user?.email || 'user@stcastudios.com',
        userRole: pkg.job.userRole || user?.role || 'standard user',
        userName: pkg.job.userName || user?.username || 'Studio User',
        userId: pkg.job.userId || user?.id,
      },
    };
    const updatedHistory = savePackageToHistory(stampedPkg);
    setHistory(updatedHistory);
    setActivePackage(stampedPkg);
  };

  const handleDeletePackage = (jobId: string) => {
    const updatedHistory = deletePackageFromHistory(jobId);
    setHistory(updatedHistory);
    if (activePackage?.job.id === jobId) {
      setActivePackage(updatedHistory[0] || null);
    }
  };

  // If not logged in, enforce authentication before accessing the studio
  if (!user || !user.isLoggedIn) {
    return <AuthScreen onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  // RBAC Activity/History Filter:
  // - Superadmin: all histories for all users including own
  // - Admin: only standard users + own history
  // - Standard user: only own history
  const isSuperadmin = user.role === 'superadmin';
  const isAdmin = user.role === 'admin';

  const accessibleHistory = history.filter((item) => {
    const itemEmail = item.userEmail || item.job.userEmail;
    const itemRole = item.userRole || item.job.userRole || 'standard user';

    if (isSuperadmin) return true;
    if (isAdmin) {
      return itemEmail === user.email || itemRole === 'standard user';
    }
    return itemEmail === user.email;
  });

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header Navigation */}
      <Navbar
        user={user}
        historyCount={accessibleHistory.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onNewGenerator={() => setActivePackage(null)}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activePackage ? (
          <PackageViewer
            pkg={activePackage}
            onOpenCanvaAudioModal={() => setIsCanvaAudioOpen(true)}
          />
        ) : (
          <GeneratorWizard currentUser={user} onPackageGenerated={handlePackageGenerated} />
        )}
      </main>

      {/* Modals & Drawers */}
      <LoginModal
        isOpen={isLoginOpen}
        currentUser={user}
        currentTheme={theme}
        onThemeChange={(newTheme) => setTheme(newTheme)}
        onClose={() => setIsLoginOpen(false)}
        onSaveUser={handleSaveUser}
        onLogout={handleLogout}
      />

      <UserManagementModal
        isOpen={isUserManagementOpen}
        currentUser={user}
        onClose={() => setIsUserManagementOpen(false)}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        history={accessibleHistory}
        currentUser={user}
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
        <div className="max-w-[1720px] mx-auto px-4 text-center text-xs text-slate-500 space-y-1">
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
