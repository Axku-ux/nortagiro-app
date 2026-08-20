import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  FileEdit,
  Send,
  ChevronRight,
  Filter 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useCampaigns } from '../hooks/useCampaigns';
import type { CampaignStatus } from '../lib/database.types';

interface CampaignsViewProps {
  onCreateNew: () => void;
  onEdit: (campaignId: string) => void;
}

const STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: FileEdit },
  scheduled: { label: 'Programada', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: Clock },
  active: { label: 'Activa', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: Send },
  closed: { label: 'Cerrada', color: 'bg-purple-50 text-purple-600 border-purple-200', icon: CheckCircle2 },
};

export function CampaignsView({ onCreateNew, onEdit }: CampaignsViewProps) {
  const { campaigns, loading } = useCampaigns();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');

  const filtered = campaigns.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: campaigns.length,
    draft: campaigns.filter((c) => c.status === 'draft').length,
    active: campaigns.filter((c) => c.status === 'active').length,
    scheduled: campaigns.filter((c) => c.status === 'scheduled').length,
    closed: campaigns.filter((c) => c.status === 'closed').length,
  };

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-[1440px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-on-background tracking-tight">Campañas</h2>
          <p className="text-lg text-on-surface-variant mt-1">Gestiona tus encuestas de clima organizacional.</p>
        </div>
        <button 
          onClick={onCreateNew}
          className="bg-primary text-on-primary font-medium px-5 py-2.5 rounded-xl hover:bg-primary-container transition-all flex items-center gap-2 text-sm shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Nueva Campaña
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            placeholder="Buscar campañas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'draft', 'scheduled', 'closed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border",
                statusFilter === status
                  ? "bg-primary text-on-primary border-primary shadow-sm"
                  : "bg-surface border-outline-variant text-secondary hover:bg-surface-variant"
              )}
            >
              {status === 'all' ? 'Todas' : STATUS_CONFIG[status].label}
              <span className="ml-1.5 opacity-70">({statusCounts[status]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Campaign List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-surface-variant rounded w-3/4 mb-4" />
              <div className="h-3 bg-surface-variant rounded w-1/2 mb-6" />
              <div className="h-8 bg-surface-variant rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Filter className="w-12 h-12 text-outline mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-on-background mb-2">Sin resultados</h3>
          <p className="text-sm text-secondary">No se encontraron campañas con esos filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((campaign) => {
            const config = STATUS_CONFIG[campaign.status];
            const StatusIcon = config.icon;
            return (
              <button
                key={campaign.id}
                onClick={() => onEdit(campaign.id)}
                className="card p-6 text-left group cursor-pointer hover:border-primary/30 transition-all"
              >
                {/* Status badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
                    config.color
                  )}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {config.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-outline opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-on-background mb-1 tracking-tight group-hover:text-primary transition-colors">
                  {campaign.title}
                </h3>
                <p className="text-xs text-secondary font-medium mb-4 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {campaign.period_label}
                </p>

                {/* Description */}
                {campaign.description && (
                  <p className="text-sm text-on-surface-variant mb-4 line-clamp-2 leading-relaxed">
                    {campaign.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 pt-4 border-t border-outline-variant/50 text-xs text-secondary font-medium">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {campaign.totalInvited} invitados
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5" />
                    {campaign.participationRate}% resp.
                  </span>
                </div>

                {/* Progress bar for active campaigns */}
                {campaign.status === 'active' && (
                  <div className="mt-3 w-full h-1.5 rounded-full bg-surface-variant overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${campaign.participationRate}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
