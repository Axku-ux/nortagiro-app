import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  AlertTriangle, 
  Award, 
  RefreshCw, 
  Zap, 
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Target,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useCampaigns } from '../hooks/useCampaigns';
import { useDashboardData } from '../hooks/useDashboardData';

export function InsightsView() {
  const { campaigns } = useCampaigns();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [recalculating, setRecalculating] = useState(false);

  const { data, loading, refetch } = useDashboardData(selectedCampaignId || undefined);

  const insights = data?.insights || [];
  const executiveSummary = data?.executiveSummary || 'El modelo de IA analiza las dimensiones de clima, riesgo de burnout y disparidad por departamento para diagnosticar el estado de la organización.';
  const confidence = data?.aiConfidence || 94;

  const handleRegenerate = async () => {
    setRecalculating(true);
    await refetch();
    setTimeout(() => setRecalculating(false), 600);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-[1440px] mx-auto animate-in fade-in duration-500 pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Impulsado por Gemini AI & Motor de Diagnóstico HR
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-on-background tracking-tight">AI Insights</h2>
          <p className="text-base text-on-surface-variant mt-1">
            Diagnóstico predictivo, alertas críticas y planes de acción recomendados por Inteligencia Artificial.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Campaign Selector */}
          <div className="flex items-center gap-2 bg-surface border border-outline-variant rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-secondary shrink-0" />
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="bg-transparent text-xs font-bold text-on-surface focus:outline-none cursor-pointer"
            >
              {campaigns.length === 0 && <option value="">Sin campañas</option>}
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.period_label || 'Sin periodo'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRegenerate}
            disabled={recalculating}
            className="bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl hover:bg-primary-container transition-all flex items-center gap-2 text-sm shadow-sm hover:shadow cursor-pointer"
          >
            <RefreshCw className={cn("w-4 h-4", recalculating && "animate-spin")} />
            <span>{recalculating ? 'Analizando...' : 'Regenerar Insights'}</span>
          </button>
        </div>
      </header>

      {/* Hero Card AI: Resumen Ejecutivo Dinámico */}
      <div className="card p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden shadow-lg border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-0" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Resumen Ejecutivo de IA
              </h3>
            </div>
            <p className="text-slate-200 text-sm md:text-base leading-relaxed font-normal">
              {executiveSummary}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-center min-w-[90px]">
              <p className="text-2xl font-extrabold text-emerald-400">{insights.length}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Insights Clave</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-center min-w-[90px]">
              <p className="text-2xl font-extrabold text-blue-400">{confidence}%</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Confianza IA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Cards List */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-background">
            Planes de Acción e Insights Detectados ({insights.length})
          </h3>
        </div>

        {insights.length === 0 ? (
          <div className="card p-12 text-center">
            <BrainCircuit className="w-12 h-12 text-outline mx-auto mb-3" />
            <h4 className="text-base font-bold text-on-background">Sin datos para diagnosticar</h4>
            <p className="text-sm text-secondary mt-1">Lanza una campaña o selecciona una campaña con respuestas para ver los insights.</p>
          </div>
        ) : (
          insights.map((item) => {
            const isAlert = item.type === 'alert';
            const isPraise = item.type === 'praise';

            return (
              <div
                key={item.id}
                className={cn(
                  "card p-6 border-l-4 transition-all hover:shadow-md",
                  isAlert ? "border-l-rose-500 bg-rose-50/20" :
                  isPraise ? "border-l-emerald-500 bg-emerald-50/20" :
                  "border-l-amber-500 bg-amber-50/20"
                )}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isAlert ? "bg-rose-100 text-rose-700" :
                      isPraise ? "bg-emerald-100 text-emerald-700" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {isAlert && <AlertTriangle className="w-4 h-4" />}
                      {isPraise && <Award className="w-4 h-4" />}
                      {!isAlert && !isPraise && <Zap className="w-4 h-4" />}
                    </div>

                    <div>
                      <span className={cn(
                        "text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded mr-2",
                        isAlert ? "bg-rose-100 text-rose-800" :
                        isPraise ? "bg-emerald-100 text-emerald-800" :
                        "bg-amber-100 text-amber-800"
                      )}>
                        {isAlert ? 'Alerta Crítica' : isPraise ? 'Fortaleza Modelo' : 'Oportunidad Estratégica'}
                      </span>
                      <h4 className="text-base font-bold text-on-background inline">{item.title}</h4>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-surface border border-outline-variant text-secondary">
                    Área: <strong className="text-on-background">{item.department}</strong>
                  </span>
                </div>

                <p className="text-sm text-on-surface-variant mb-4 leading-relaxed pl-10">
                  {item.description}
                </p>

                {item.actionRecommendation && (
                  <div className="ml-10 p-3.5 bg-surface rounded-xl border border-outline-variant/70 flex items-start gap-2.5">
                    <Target className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-on-background">Acción Recomendada:</p>
                      <p className="text-xs text-secondary mt-0.5 leading-relaxed">{item.actionRecommendation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
