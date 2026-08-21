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

// ─── Main App Shell (authenticated) ────────────────────

interface AppShellProps {
  user: { fullName: string; role: string; email: string };
  onSignOut: () => Promise<void>;
}

function AppShell({ user, onSignOut }: AppShellProps) {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  // Survey view renders full-screen (no sidebar)
  if (currentView === 'survey') {
    return <SurveyView onBack={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="flex h-screen bg-background font-sans text-on-background overflow-hidden">
      <Sidebar
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v as View)}
        userName={user.fullName}
        userRole={user.role}
        userEmail={user.email}
        onSignOut={onSignOut}
      />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen relative">
        <TopNav />
        <div className="flex-1 overflow-y-auto pb-24 md:pb-0 relative bg-surface-bright">
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
