import React from 'react';
import { Bell, Settings } from 'lucide-react';

export function TopNav() {
  return (
    <header className="md:hidden sticky top-0 z-50 flex justify-between items-center w-full px-4 h-16 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900 font-bold">
          N
        </div>
        <span className="text-xl font-bold tracking-tight">
          <span className="text-slate-900">Norta</span>
          <span className="text-emerald-600">Giro</span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-slate-500 hover:text-blue-600 transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="text-slate-500 hover:text-blue-600 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-600">
          AD
        </div>
      </div>
    </header>
  );
}
