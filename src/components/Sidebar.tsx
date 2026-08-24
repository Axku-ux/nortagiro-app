import React from 'react';
import { 
  LayoutDashboard, 
  Send, 
  BarChart2, 
  BrainCircuit, 
  Users,
  HelpCircle,
  LogOut,
  Activity,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  userName: string;
  userRole: string;
  userEmail: string;
  onSignOut: () => Promise<void>;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Manager',
  viewer: 'Visualizador',
};

export function Sidebar({ currentView, onViewChange, userName, userRole, userEmail, onSignOut }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Automatización', icon: Send },
    { id: 'reporting', label: 'Reporting', icon: BarChart2 },
    { id: 'insights', label: 'Insights', icon: BrainCircuit },
    { id: 'directory', label: 'Estructura', icon: Users },
  ];

  // Filter nav items based on role
  const visibleItems = userRole === 'viewer' 
    ? navItems.filter(item => ['dashboard', 'reporting'].includes(item.id))
    : navItems;

  // Get user initials from full name
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <nav className="hidden md:flex flex-col h-screen w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 sticky top-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900 font-bold">
          <Activity className="w-5 h-5" />
        </div>
        <span className="font-bold text-lg tracking-tight">
          <span className="text-white">Norta</span>
          <span className="text-emerald-400">Giro</span>
        </span>
      </div>

      {/* User Profile Section */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-slate-700 group-hover:ring-slate-600 transition-all">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{userName}</p>
            <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">
              {ROLE_LABELS[userRole] ?? userRole}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-2">
          Menú principal
        </p>
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
              currentView === item.id || (item.id === 'campaigns' && currentView === 'wizard')
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "w-[18px] h-[18px] transition-colors",
              currentView === item.id || (item.id === 'campaigns' && currentView === 'wizard')
                ? "text-emerald-400"
                : ""
            )} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {/* Anonymity badge */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-left">
          <p className="text-xs text-emerald-400 font-semibold mb-1">UMBRAL DE ANONIMATO</p>
          <p className="text-[10px] text-emerald-200/60">Activo (Mín. 5 respuestas)</p>
        </div>
        
        {/* Employee view button */}
        <button 
          onClick={() => onViewChange('survey')}
          className="w-full bg-slate-800 text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center text-sm gap-2"
        >
          Vista de Empleado
        </button>
        
        {/* Help & Logout */}
        <div className="pt-1 flex flex-col gap-1">
          <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-colors">
            <HelpCircle className="w-[18px] h-[18px]" />
            Ayuda
          </button>
          <button 
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg text-sm transition-colors"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}
