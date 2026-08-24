import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { DashboardView } from './views/DashboardView';
import { WizardView } from './views/WizardView';
import { SurveyView } from './views/SurveyView';
import { CampaignsView } from './views/CampaignsView';
import { DirectoryView } from './views/DirectoryView';
import { ReportingView } from './views/ReportingView';
import { InsightsView } from './views/InsightsView';

import { Home, Send, Eye, Loader2 } from 'lucide-react';

export type View = 'dashboard' | 'wizard' | 'survey' | 'campaigns' | 'reporting' | 'settings' | 'directory' | 'insights';

// ─── Auth Wrapper ───────────────────────────────────────

function AuthGate() {
  const { user, loading, handleSignIn, handleSignUp, handleSignOut } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');

  // Loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-secondary font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → show login or register
  if (!user) {
    if (authView === 'register') {
      return (
        <RegisterView
          onRegister={handleSignUp}
          onGoToLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <LoginView
        onLogin={handleSignIn}
        onGoToRegister={() => setAuthView('register')}
      />
    );
  }

  // Authenticated → show main app
  return <AppShell user={user} onSignOut={handleSignOut} />;
}

// ─── Error Boundary ──────────────────────────────────────

class ViewErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("View rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 font-bold">
            !
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Ha ocurrido un problema al cargar la vista</h3>
          <p className="text-xs text-slate-500 mb-6">{this.state.error?.message || 'Error inesperado'}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = '/';
            }}
            className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            Volver al Inicio
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── Main App Shell (authenticated) ────────────────────

interface AppShellProps {
  user: { fullName: string; role: string; email: string };
  onSignOut: () => Promise<void>;
}

function AppShell({ user, onSignOut }: AppShellProps) {
  // Read initial view from URL path (e.g., /campaigns -> campaigns, /directory -> directory)
  const getInitialView = (): View => {
    const path = window.location.pathname.replace('/', '').toLowerCase();
    if (['dashboard', 'wizard', 'survey', 'campaigns', 'reporting', 'settings', 'directory', 'insights'].includes(path)) {
      return path as View;
    }
    return 'dashboard';
  };

  const [currentView, setCurrentViewRaw] = useState<View>(getInitialView);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  const setCurrentView = (v: View) => {
    setCurrentViewRaw(v);
    try {
      const targetPath = v === 'dashboard' ? '/' : `/${v}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    } catch {
      // Ignore history API errors
    }
  };

  // Handle browser back/forward buttons
  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentViewRaw(getInitialView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Survey view renders full-screen (no sidebar)
  if (currentView === 'survey') {
    return <SurveyView onBack={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="flex h-screen bg-background font-sans text-on-background overflow-hidden">
      <Sidebar
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v as View)}
        userName={user.fullName || 'Usuario'}
        userRole={user.role || 'admin'}
        userEmail={user.email || ''}
        onSignOut={onSignOut}
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen relative">
        <TopNav />
        <div className="flex-1 overflow-y-auto pb-24 md:pb-0 relative bg-surface-bright">
          <ViewErrorBoundary>
            {currentView === 'dashboard' && <DashboardView />}
            {currentView === 'campaigns' && (
              <CampaignsView 
                onCreateNew={() => setCurrentView('wizard')}
                onEdit={(id) => {
                  setEditingCampaignId(id);
                  setCurrentView('wizard');
                }}
              />
            )}
            {currentView === 'wizard' && (
              <WizardView onBack={() => setCurrentView('campaigns')} />
            )}
            {currentView === 'reporting' && <ReportingView />}
            {currentView === 'insights' && <InsightsView />}
            {currentView === 'directory' && <DirectoryView />}
          </ViewErrorBoundary>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-t-xl">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center justify-center transition-colors ${currentView === 'dashboard' ? 'bg-slate-100 text-blue-600 scale-110 px-5 py-1.5 rounded-full' : 'text-slate-500 hover:text-slate-800 p-2'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Home</span>
          </button>
          <button 
            onClick={() => setCurrentView('wizard')}
            className={`flex flex-col items-center justify-center transition-colors ${currentView === 'wizard' ? 'bg-slate-100 text-blue-600 scale-110 px-5 py-1.5 rounded-full' : 'text-slate-500 hover:text-slate-800 p-2'}`}
          >
            <Send className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Send</span>
          </button>
          <button 
            onClick={() => setCurrentView('survey')}
            className={`flex flex-col items-center justify-center transition-colors ${currentView === 'survey' ? 'bg-slate-100 text-blue-600 scale-110 px-5 py-1.5 rounded-full' : 'text-slate-500 hover:text-slate-800 p-2'}`}
          >
            <Eye className="w-5 h-5" />
            <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">Preview</span>
          </button>
        </nav>
      </main>
    </div>
  );
}

// ─── Root Component ─────────────────────────────────────

export default function App() {
  // If the user lands directly on a survey link, bypass authentication
  if (window.location.pathname.startsWith('/survey')) {
    return (
      <SurveyView 
        onBack={() => {
          // Go back to the main app dashboard
          window.location.href = '/';
        }} 
      />
    );
  }

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
