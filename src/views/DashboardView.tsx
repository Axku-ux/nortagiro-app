import React, { useState } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useCampaigns } from '../hooks/useCampaigns';
import { Heatmap } from '../components/dashboard/Heatmap';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  AlertTriangle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

export function DashboardView() {
  const { campaigns } = useCampaigns();
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');

  // If 'all' is selected but we don't support 'all' easily in useDashboardData without backend changes,
  // we can just pass undefined to get the latest campaign, or we can use the selected one.
  const { data, loading, refetch } = useDashboardData(selectedCampaign === 'all' ? undefined : selectedCampaign);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500); // Visual feedback
  };

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

  if (!data) {
    return (
      <div className="p-8 text-center min-h-[500px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-secondary" />
        </div>
        <h2 className="text-2xl font-bold text-on-background mb-2">Aún no hay datos</h2>
        <p className="text-secondary max-w-md mx-auto">
          No tienes campañas cerradas o activas con suficientes respuestas. Lanza una nueva campaña para empezar a ver insights.
        </p>
      </div>
    );
  }

  const { metrics, heatmap, departments, heatmapLocation, locations } = data;

  const kpiCards = [
    {
      title: 'Índice Global',
      value: metrics.globalScore.toFixed(1),
      suffix: '/10',
      delta: metrics.globalDelta,
      icon: Activity,
      color: 'blue'
    },
    {
      title: 'eNPS',
      value: metrics.enps > 0 ? `+${metrics.enps}` : metrics.enps.toString(),
      delta: null, // Custom eNPS bar rendered below
      icon: Users,
      color: 'emerald'
    },
    {
      title: 'Participación',
      value: metrics.participationCount.toString(),
      suffix: ' resp.',
      delta: metrics.participationDelta,
      icon: TrendingUp,
      color: 'indigo'
    },
    {
      title: 'Riesgo Burnout',
      value: `${metrics.burnoutRisk}%`,
      delta: metrics.burnoutDelta,
      icon: AlertTriangle,
      color: 'rose',
      inverseDelta: true // Lower is better
    }
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-[1440px] mx-auto animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-on-background tracking-tight">Dashboard</h2>
          <p className="text-lg text-on-surface-variant mt-1">Resumen ejecutivo y pulso organizacional.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-variant transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary-fixed-dim"
          >
            {campaigns.length === 0 && <option value="all">Sin Campañas</option>}
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <button 
            onClick={handleRefresh}
            className="p-2.5 bg-surface border border-outline-variant rounded-xl hover:bg-surface-variant transition-colors text-secondary"
            title="Actualizar datos"
          >
            <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin text-primary")} />
          </button>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi) => {
          const isGoodDelta = kpi.inverseDelta ? (kpi.delta || 0) <= 0 : (kpi.delta || 0) >= 0;
          
          return (
            <div key={kpi.title} className="card p-6 flex flex-col justify-between group">
              <div className="flex items-start justify-between mb-4">
                <p className="text-xs font-bold text-secondary uppercase tracking-wider">{kpi.title}</p>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                  `bg-${kpi.color}-50 text-${kpi.color}-600`
                )}>
                  <kpi.icon className="w-5 h-5" />
                </div>
              </div>
              
              <div className="flex items-end gap-2">
                <h3 className="text-4xl font-bold tracking-tight text-on-background">
                  {kpi.value}
                  {kpi.suffix && <span className="text-xl text-outline ml-1 font-medium">{kpi.suffix}</span>}
                </h3>
              </div>

              <div className="mt-4 pt-4 border-t border-outline-variant/50 flex items-center justify-between">
                {/* Custom render for eNPS bar */}
                {kpi.title === 'eNPS' ? (
                  <div className="w-full flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full overflow-hidden flex">
                      <div style={{ width: `${metrics.enpsPromoters}%` }} className="bg-emerald-500" />
                      <div style={{ width: `${metrics.enpsNeutral}%` }} className="bg-amber-400" />
                      <div style={{ width: `${metrics.enpsDetractors}%` }} className="bg-rose-500" />
                    </div>
                  </div>
                ) : kpi.delta !== null ? (
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full",
                    isGoodDelta ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  )}>
                    {kpi.delta! > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {Math.abs(kpi.delta!)}{kpi.title === 'Riesgo Burnout' ? '%' : ''} vs Q anterior
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Heatmap Departamentos */}
        <Heatmap 
          data={heatmap} 
          columns={departments} 
          title="Mapa de Calor por Área"
          subtitle="Puntuaciones agregadas por dimensión y departamento."
        />
        
        {/* Heatmap Ubicaciones */}
        <Heatmap 
          data={heatmapLocation} 
          columns={locations} 
          title="Mapa de Calor por Ubicación"
          subtitle="Mejores y peores sucursales (Top 3 y Bottom 3)."
        />
      </div>
    </div>
  );
}
