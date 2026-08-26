import React, { useState } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useCampaigns } from '../hooks/useCampaigns';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  AlertTriangle,
  RefreshCw,
  Loader2,
  Flame,
  ArrowRight,
  Megaphone,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

// Tiny inline sparkline SVG component
function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return null;
  const h = 28;
  const w = 80;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const coords = points.map((v, i) => ({
    x: (i / (points.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }));

  const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');

  return (
    <svg width={w} height={h} className="inline-block">
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r={3} fill={color} />
    </svg>
  );
}

export function DashboardView({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const { campaigns } = useCampaigns();
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');

  const effectiveCampaignId = selectedCampaign || undefined;
  const { data, loading, refetch } = useDashboardData(effectiveCampaignId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const currentCampaignId = selectedCampaign || data?.currentCampaignId || campaigns[0]?.id || '';

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-secondary font-medium">Cargando métricas...</p>
        </div>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="p-8 text-center min-h-[500px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-secondary" />
        </div>
        <h2 className="text-2xl font-bold text-on-background mb-2">Aún no hay campañas</h2>
        <p className="text-secondary max-w-md mx-auto mb-4">
          Crea tu primera campaña para empezar a medir el clima laboral de tu organización.
        </p>
        {onNavigate && (
          <button
            onClick={() => onNavigate('wizard')}
            className="bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl hover:bg-primary-container transition-all cursor-pointer"
          >
            Crear Campaña
          </button>
        )}
      </div>
    );
  }

  const metrics = data?.metrics || {
    globalScore: 0,
    globalDelta: null,
    enps: 0,
    enpsDelta: null,
    pctPromoters: 0,
    pctNeutrals: 0,
    pctDetractors: 0,
    participationCount: 0,
    participationDelta: null,
    burnoutRisk: 0,
    burnoutDelta: null,
  };

  const alerts = data?.alerts || [];
  const sparklines = data?.sparklines || { globalScore: [], enps: [], participation: [], burnout: [] };
  const activeCampaign = data?.activeCampaign || null;
  const hasResponses = data?.hasResponses ?? false;

  const kpiCards = [
    {
      title: 'Índice Global',
      value: metrics.globalScore.toFixed(1),
      suffix: '/10',
      delta: metrics.globalDelta,
      deltaSuffix: '',
      sparkData: sparklines.globalScore.map(p => p.value),
      icon: Activity,
      sparkColor: '#3b82f6',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'eNPS',
      value: metrics.enps > 0 ? `+${metrics.enps}` : metrics.enps.toString(),
      delta: metrics.enpsDelta,
      deltaSuffix: '',
      sparkData: sparklines.enps.map(p => p.value),
      icon: Users,
      sparkColor: '#10b981',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      customFooter: true,
    },
    {
      title: 'Participación',
      value: metrics.participationCount.toString(),
      suffix: ' resp.',
      delta: metrics.participationDelta,
      deltaSuffix: '',
      sparkData: sparklines.participation.map(p => p.value),
      icon: TrendingUp,
      sparkColor: '#6366f1',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      title: 'Riesgo Burnout',
      value: `${metrics.burnoutRisk}%`,
      delta: metrics.burnoutDelta,
      deltaSuffix: '%',
      sparkData: sparklines.burnout.map(p => p.value),
      icon: Flame,
      sparkColor: '#f43f5e',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
      inverseDelta: true,
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 w-full max-w-[1440px] mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-on-background tracking-tight">Pulso Ejecutivo</h2>
          <p className="text-base text-on-surface-variant mt-1">Vista rápida del estado de tu organización.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={currentCampaignId}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-variant transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary-fixed-dim"
          >
            {campaigns.length === 0 && <option value="">Sin Campañas</option>}
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.title} ({c.period_label || 'Sin periodo'})</option>
            ))}
          </select>
          <button 
            onClick={handleRefresh}
            className="p-2.5 bg-surface border border-outline-variant rounded-xl hover:bg-surface-variant transition-colors text-secondary cursor-pointer"
            title="Actualizar datos"
          >
            <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin text-primary")} />
          </button>
        </div>
      </header>

      {/* Notice if campaign has 0 responses */}
      {!hasResponses && (
        <div className="card p-6 bg-amber-50/50 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-950">Esta edición aún no cuenta con respuestas registradas</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Distribuye los enlaces de encuesta para recopilar respuestas o selecciona otra campaña en el selector superior.
              </p>
            </div>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('campaigns')}
              className="text-xs font-bold bg-amber-700 text-white hover:bg-amber-800 px-3.5 py-2 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Ver Enlaces de Encuesta
            </button>
          )}
        </div>
      )}

      {/* Active Campaign Banner */}
      {activeCampaign && (
        <div className="card p-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/15 rounded-xl flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-on-background">Campaña activa: {activeCampaign.title}</p>
              <p className="text-xs text-secondary mt-0.5">
                {activeCampaign.responded} encuestas completadas hasta ahora
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate?.('campaigns')}
            className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer shrink-0"
          >
            Ver campaña <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((kpi) => {
          const isGoodDelta = kpi.inverseDelta ? (kpi.delta || 0) <= 0 : (kpi.delta || 0) >= 0;
          const hasDelta = kpi.delta !== 0;
          
          return (
            <div key={kpi.title} className="card p-5 flex flex-col justify-between group">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-bold text-secondary uppercase tracking-wider">{kpi.title}</p>
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", kpi.bgColor)}>
                  <kpi.icon className={cn("w-4.5 h-4.5", kpi.iconColor)} />
                </div>
              </div>
              
              <div className="flex items-end justify-between gap-2">
                <h3 className="text-3xl font-bold tracking-tight text-on-background">
                  {kpi.value}
                  {kpi.suffix && <span className="text-base text-outline ml-1 font-medium">{kpi.suffix}</span>}
                </h3>
                <Sparkline points={kpi.sparkData} color={kpi.sparkColor} />
              </div>

              <div className="mt-3 pt-3 border-t border-outline-variant/50 flex items-center justify-between">
                {kpi.customFooter ? (
                  <div className="w-full flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full overflow-hidden flex">
                      <div style={{ width: `${metrics.enpsPromoters}%` }} className="bg-emerald-500" />
                      <div style={{ width: `${metrics.enpsNeutral}%` }} className="bg-amber-400" />
                      <div style={{ width: `${metrics.enpsDetractors}%` }} className="bg-rose-500" />
                    </div>
                  </div>
                ) : hasDelta ? (
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full",
                    isGoodDelta ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  )}>
                    {kpi.delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {kpi.delta > 0 ? '+' : ''}{kpi.delta}{kpi.deltaSuffix} vs anterior
                  </div>
                ) : (
                  <span className="text-xs text-outline">Sin datos previos</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Alerts */}
      {alerts.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-outline-variant/50 bg-surface-container-lowest flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
              <h3 className="text-sm font-bold text-on-background uppercase tracking-wider">Alertas Rápidas</h3>
            </div>
            <button 
              onClick={() => onNavigate?.('reporting')} 
              className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
            >
              Investigar en Analítica <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-outline-variant/30">
            {alerts.map((alert, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  alert.type === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
                )} />
                <p className="text-sm text-on-surface-variant">{alert.text}</p>
                {alert.score !== undefined && (
                  <span className={cn(
                    "ml-auto shrink-0 text-xs font-extrabold px-2.5 py-0.5 rounded-full",
                    alert.score < 6 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {alert.score}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
