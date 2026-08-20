import React, { useState } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { Heatmap } from '../components/dashboard/Heatmap';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Activity, 
  AlertTriangle,
  Lightbulb,
  Award,
  Filter,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

export function DashboardView() {
  const { data, loading, refetch } = useDashboardData();
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

  const { metrics, heatmap, departments, insights } = data;

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
      value: `${metrics.participationRate}%`,
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
    <div className="p-4 md:p-8 space-y-8 w-full max-w-[1440px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-on-background tracking-tight">Dashboard</h2>
          <p className="text-lg text-on-surface-variant mt-1">Resumen ejecutivo y pulso organizacional.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-surface border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-variant transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary-fixed-dim">
            <option>Q3 2024 (Jul - Sep)</option>
            <option>Q2 2024 (Abr - Jun)</option>
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
                    {Math.abs(kpi.delta!)}{kpi.title === 'Participación' || kpi.title === 'Riesgo Burnout' ? '%' : ''} vs Q anterior
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Heatmap Area (Span 2) */}
        <div className="xl:col-span-2 space-y-6">
          <Heatmap data={heatmap} departments={departments} />
          
          {/* Sentiment / Topics (Placeholder visually consistent) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-sm font-bold text-on-background uppercase tracking-wider mb-6">Análisis de Sentimiento</h3>
              <div className="space-y-4">
                {['Liderazgo', 'Crecimiento', 'Bienestar'].map((dim, i) => (
                  <div key={dim} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{dim}</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden flex bg-surface-variant">
                      <div style={{ width: `${60 - i * 10}%` }} className="bg-emerald-500" />
                      <div style={{ width: `${30 + i * 5}%` }} className="bg-amber-400" />
                      <div style={{ width: `${10 + i * 5}%` }} className="bg-rose-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-6">
              <h3 className="text-sm font-bold text-on-background uppercase tracking-wider mb-6">Temas Mencionados</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm font-medium">Carga de trabajo (42)</span>
                <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium">Horario flexible (38)</span>
                <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm font-medium">Comunicación (25)</span>
                <span className="px-3 py-1.5 bg-surface-variant text-secondary rounded-lg text-sm font-medium">Onboarding (14)</span>
                <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium">Eventos team (12)</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Area (Span 1) */}
        <div className="xl:col-span-1">
          <div className="card h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-blue-500" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="p-6 border-b border-slate-700/50 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center shadow-inner">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-white">AI Insights</h3>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">Generado por Gemini</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6 relative z-10">
              {insights.map((insight) => {
                const isAlert = insight.type === 'alert';
                const isPraise = insight.type === 'praise';
                const Icon = isAlert ? AlertTriangle : isPraise ? Award : TrendingUp;
                
                return (
                  <div key={insight.id} className="group cursor-default">
                    <div className="flex items-start gap-3 mb-2">
                      <div className={cn(
                        "mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                        isAlert ? "bg-rose-500/20 text-rose-400" : isPraise ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                      )}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="font-semibold text-sm leading-tight text-slate-200 group-hover:text-white transition-colors">
                        {insight.title}
                      </h4>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed pl-9">
                      {insight.description}
                    </p>
                  </div>
                );
              })}
            </div>
            
            <div className="absolute bottom-0 left-0 w-full p-6 pt-0 text-center">
              <button className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 mx-auto">
                <Filter className="w-3.5 h-3.5" />
                Explorar todos los insights
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
