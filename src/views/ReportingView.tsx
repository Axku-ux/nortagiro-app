import React, { useState, useMemo } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpDown,
  BarChart3,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ShieldCheck,
  Flame,
  Users,
  Activity,
  History,
  GitCompare,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart,
  Line,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell 
} from 'recharts';
import { cn } from '../lib/utils';
import { useCampaigns } from '../hooks/useCampaigns';
import { useDashboardData } from '../hooks/useDashboardData';
import { Heatmap } from '../components/dashboard/Heatmap';

const DIMENSION_COLORS: Record<string, string> = {
  'Liderazgo': '#3b82f6',
  'Bienestar': '#10b981',
  'Crecimiento': '#8b5cf6',
  'Reconocimiento': '#f59e0b',
  'Comunicación': '#06b6d4',
  'Cultura': '#ec4899',
  'General': '#64748b',
};

export function ReportingView() {
  const { campaigns } = useCampaigns();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [compareCampaignId, setCompareCampaignId] = useState<string>('auto');
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const effectiveCompareId = compareCampaignId === 'auto' ? undefined : compareCampaignId;
  const { data, loading } = useDashboardData(selectedCampaignId || undefined, effectiveCompareId);

  // Active series campaigns
  const currentSeriesGroup = useMemo(() => {
    if (!data || !data.allSeries) return null;
    return data.allSeries.find(s => s.seriesId === data.currentSeriesId) || data.allSeries[0] || null;
  }, [data]);

  const seriesCampaigns = currentSeriesGroup ? currentSeriesGroup.campaigns : [];

  // Possible comparison candidates (other campaigns in the same series or all campaigns)
  const comparisonOptions = useMemo(() => {
    const currentId = selectedCampaignId || (campaigns[0]?.id ?? '');
    return seriesCampaigns.filter(c => c.id !== currentId);
  }, [seriesCampaigns, selectedCampaignId, campaigns]);

  // Dimension scores for vertical bar chart
  const dimensionScores = data?.heatmap.map(h => {
    const vals = Object.values(h.scores);
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const score = Number(avg.toFixed(1));
    return { 
      name: h.dimension, 
      score, 
      color: score >= 8 ? '#10b981' : score >= 6 ? '#fbbf24' : '#f43f5e' 
    };
  }) || [];

  // Multi-line evolution data across waves for this series
  const lineChartData = useMemo(() => {
    if (!data || !data.historicalTrend) return [];
    return data.historicalTrend.map(point => {
      const row: Record<string, any> = {
        name: point.periodLabel || point.campaignTitle,
        'Índice Global': point.globalScore,
      };
      // Add each dimension as a line
      if (point.dimensions) {
        Object.entries(point.dimensions).forEach(([dim, score]) => {
          row[dim] = score;
        });
      }
      return row;
    });
  }, [data]);

  // Unique dimensions found across all historical trend points
  const allTrendDimensions = useMemo(() => {
    const set = new Set<string>();
    data?.historicalTrend.forEach(p => {
      if (p.dimensions) {
        Object.keys(p.dimensions).forEach(d => set.add(d));
      }
    });
    return Array.from(set);
  }, [data]);

  // Export CSV with comparison data
  const handleExportCSV = () => {
    if (!data) return;
    
    // 1. Question comparison rows
    const qHeaders = ['Pregunta', 'Dimensión', 'Puntuación Anterior', 'Puntuación Actual', 'Variación', 'Estado'];
    const qRows = data.questionComparisons.map(q => [
      `"${q.text.replace(/"/g, '""')}"`,
      q.dimension,
      q.previousScore !== null ? q.previousScore : 'N/A',
      q.currentScore,
      q.delta !== null ? (q.delta > 0 ? `+${q.delta}` : q.delta) : 'N/A',
      q.status === 'improved' ? 'Mejora' : q.status === 'declined' ? 'Retroceso' : 'Estable'
    ].join(','));

    // 2. Department heatmap rows
    const dimensions = data.heatmap.map(h => h.dimension);
    const deptHeaders = ['Departamento', ...dimensions];
    const deptRows = data.departments.map(dept => {
      const values = dimensions.map(dim => {
        const hData = data.heatmap.find(h => h.dimension === dim);
        return hData?.scores[dept] || 0;
      });
      return [dept, ...values].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + "=== COMPARATIVA DE PREGUNTAS Y REPERCUSION ===\n"
      + qHeaders.join(',') + "\n" + qRows.join("\n") + "\n\n"
      + "=== MAPA DE CALOR POR DEPARTAMENTO ===\n"
      + deptHeaders.join(',') + "\n" + deptRows.join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `reporte_comparativo_${(data.comparisonCampaignTitle || 'clima').replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportMessage("Reporte CSV descargado con éxito");
    setTimeout(() => setExportMessage(null), 3000);
  };

  const handleExportPDF = () => {
    setExportMessage("Generando PDF ejecutivo...");
    setTimeout(() => {
      window.print();
      setExportMessage(null);
    }, 1000);
  };

  const getRatingBg = (score: number | null) => {
    if (score === null) return 'bg-surface-variant text-secondary';
    if (score >= 8) return 'bg-emerald-500/15 text-emerald-700';
    if (score >= 6) return 'bg-amber-500/15 text-amber-700';
    return 'bg-rose-500/15 text-rose-700';
  };

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-[1440px] mx-auto animate-in fade-in duration-500 pb-32">
      {/* Toast alert */}
      {exportMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 border border-slate-700 animate-in slide-in-from-top">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{exportMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
              <GitCompare className="w-3.5 h-3.5" />
              Análisis Evolutivo y Repercusión
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-on-background tracking-tight">Analítica y Reporting</h2>
          <p className="text-base text-on-surface-variant mt-1">
            Compara ediciones de la misma encuesta para evaluar la repercusión de las medidas organizacionales.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="bg-surface border border-outline-variant text-on-surface hover:bg-surface-variant px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV</span>
          </button>
          <button onClick={handleExportPDF} className="bg-primary text-on-primary hover:bg-primary-container px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow cursor-pointer">
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </header>

      {/* Series & Comparison Filters Bar */}
      <div className="card p-4 flex flex-wrap gap-4 items-center justify-between bg-surface-container-lowest border-primary/20 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Series selector */}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Programa:</span>
            <div className="px-3 py-1.5 bg-primary/10 text-primary font-bold text-sm rounded-lg border border-primary/20">
              {currentSeriesGroup?.seriesName || 'Encuesta de Clima'} ({seriesCampaigns.length} ediciones)
            </div>
          </div>

          {/* Primary Edition selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Edición Actual:</span>
            <select
              value={selectedCampaignId || (campaigns[0]?.id ?? '')}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-sm font-bold text-on-surface focus:outline-none focus:border-primary shadow-sm"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.period_label || 'Sin periodo'})
                </option>
              ))}
            </select>
          </div>

          {/* Comparison Baseline selector */}
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Comparar con:</span>
            <select
              value={compareCampaignId}
              onChange={(e) => setCompareCampaignId(e.target.value)}
              className="bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary shadow-sm"
            >
              <option value="auto">
                {data?.comparisonCampaignTitle ? `Edición Anterior (${data.comparisonCampaignTitle})` : 'Edición Anterior (Automática)'}
              </option>
              {comparisonOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.periodLabel})
                </option>
              ))}
            </select>
          </div>
        </div>

        {data?.comparisonCampaignTitle && (
          <div className="text-xs text-secondary font-medium flex items-center gap-1.5 bg-surface-variant px-3 py-1.5 rounded-lg">
            <span>Comparando:</span>
            <span className="font-bold text-on-background">{data.comparisonCampaignTitle}</span>
            <ArrowRight className="w-3 h-3 text-primary" />
            <span className="font-bold text-primary">{campaigns.find(c => c.id === (selectedCampaignId || campaigns[0]?.id))?.title}</span>
          </div>
        )}
      </div>

      {!data ? (
        <div className="card p-12 text-center">
          <BarChart3 className="w-12 h-12 text-outline mx-auto mb-4" />
          <h3 className="text-lg font-bold text-on-background mb-2">Sin datos para analizar</h3>
          <p className="text-sm text-secondary">Selecciona una campaña con respuestas para ver la comparativa.</p>
        </div>
      ) : (
        <>
          {/* Action Impact Summary Banner */}
          <div className="card p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl -z-0" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Repercusión e Impacto de Medidas
                  </h3>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {data.actionImpactSummary.diagnosisText}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-center min-w-[90px]">
                  <p className="text-2xl font-extrabold text-emerald-400">+{data.actionImpactSummary.improvedDimensionsCount}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Mejoraron</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-center min-w-[90px]">
                  <p className="text-2xl font-extrabold text-amber-300">{data.actionImpactSummary.stableDimensionsCount}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Estables</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-center min-w-[90px]">
                  <p className="text-2xl font-extrabold text-rose-400">-{data.actionImpactSummary.declinedDimensionsCount}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">Atención</p>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Comparative KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Global Score Card */}
            <div className="card p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Índice Global</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-on-background">{data.metrics.globalScore}</span>
                <span className="text-sm text-secondary font-medium">/ 10</span>
              </div>
              <div className="mt-3 pt-3 border-t border-outline-variant/50 flex items-center justify-between text-xs">
                <span className="text-secondary">Variación ola:</span>
                <span className={cn(
                  "font-bold flex items-center gap-1 px-2 py-0.5 rounded-md",
                  data.metrics.globalDelta > 0 ? "bg-emerald-50 text-emerald-700" : data.metrics.globalDelta < 0 ? "bg-rose-50 text-rose-700" : "bg-surface-variant text-secondary"
                )}>
                  {data.metrics.globalDelta > 0 ? <TrendingUp className="w-3 h-3" /> : data.metrics.globalDelta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {data.metrics.globalDelta > 0 ? `+${data.metrics.globalDelta}` : data.metrics.globalDelta} pts
                </span>
              </div>
            </div>

            {/* eNPS Card */}
            <div className="card p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">eNPS</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-on-background">
                  {data.metrics.enps > 0 ? `+${data.metrics.enps}` : data.metrics.enps}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-outline-variant/50 flex items-center justify-between text-xs">
                <span className="text-secondary">Variación ola:</span>
                <span className={cn(
                  "font-bold flex items-center gap-1 px-2 py-0.5 rounded-md",
                  data.metrics.enpsDelta > 0 ? "bg-emerald-50 text-emerald-700" : data.metrics.enpsDelta < 0 ? "bg-rose-50 text-rose-700" : "bg-surface-variant text-secondary"
                )}>
                  {data.metrics.enpsDelta > 0 ? <TrendingUp className="w-3 h-3" /> : data.metrics.enpsDelta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {data.metrics.enpsDelta > 0 ? `+${data.metrics.enpsDelta}` : data.metrics.enpsDelta} pts
                </span>
              </div>
            </div>

            {/* Participación Card */}
            <div className="card p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Participación</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-on-background">{data.metrics.participationCount}</span>
                <span className="text-sm text-secondary font-medium">respuestas</span>
              </div>
              <div className="mt-3 pt-3 border-t border-outline-variant/50 flex items-center justify-between text-xs">
                <span className="text-secondary">Variación ola:</span>
                <span className={cn(
                  "font-bold flex items-center gap-1 px-2 py-0.5 rounded-md",
                  data.metrics.participationDelta > 0 ? "bg-emerald-50 text-emerald-700" : data.metrics.participationDelta < 0 ? "bg-rose-50 text-rose-700" : "bg-surface-variant text-secondary"
                )}>
                  {data.metrics.participationDelta > 0 ? <TrendingUp className="w-3 h-3" /> : data.metrics.participationDelta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {data.metrics.participationDelta > 0 ? `+${data.metrics.participationDelta}` : data.metrics.participationDelta} resp.
                </span>
              </div>
            </div>

            {/* Burnout Risk Card */}
            <div className="card p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Riesgo Burnout</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-on-background">{data.metrics.burnoutRisk}%</span>
              </div>
              <div className="mt-3 pt-3 border-t border-outline-variant/50 flex items-center justify-between text-xs">
                <span className="text-secondary">Variación ola:</span>
                <span className={cn(
                  "font-bold flex items-center gap-1 px-2 py-0.5 rounded-md",
                  data.metrics.burnoutDelta < 0 ? "bg-emerald-50 text-emerald-700" : data.metrics.burnoutDelta > 0 ? "bg-rose-50 text-rose-700" : "bg-surface-variant text-secondary"
                )}>
                  {data.metrics.burnoutDelta < 0 ? <TrendingDown className="w-3 h-3" /> : data.metrics.burnoutDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {data.metrics.burnoutDelta > 0 ? `+${data.metrics.burnoutDelta}` : data.metrics.burnoutDelta}%
                </span>
              </div>
            </div>
          </div>

          {/* Multi-wave Longitudinal Evolution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Dimension Trends over Waves */}
            <div className="lg:col-span-8 card p-6">
              <div className="mb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-base font-bold text-on-background">Evolución de Dimensiones en el Tiempo</h3>
                  <p className="text-xs text-secondary mt-0.5">Seguimiento longitudinal de cada dimensión ola tras ola</p>
                </div>
              </div>
              <div className="h-72 w-full">
                {lineChartData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis domain={[0, 10]} stroke="#64748b" fontSize={11} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="Índice Global" 
                        stroke="#0f172a" 
                        strokeWidth={3} 
                        dot={{ r: 4 }} 
                      />
                      {allTrendDimensions.map(dim => (
                        <Line
                          key={dim}
                          type="monotone"
                          dataKey={dim}
                          stroke={DIMENSION_COLORS[dim] || '#64748b'}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-sm text-secondary gap-2">
                    <History className="w-8 h-8 text-outline" />
                    <span>Se necesitan al menos 2 ediciones de esta campaña para graficar la evolución.</span>
                    <span className="text-xs text-outline">Usa el botón "Repetir" en Automatización para lanzar la siguiente edición.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Current Dimension Breakdown */}
            <div className="lg:col-span-4 card p-6">
              <div className="mb-5">
                <h3 className="text-base font-bold text-on-background">Puntuación por Dimensión</h3>
                <p className="text-xs text-secondary mt-0.5">Estado actual en la edición activa</p>
              </div>
              <div className="h-72 w-full">
                {dimensionScores.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dimensionScores} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" domain={[0, 10]} stroke="#64748b" fontSize={11} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={95} />
                      <Tooltip />
                      <Bar dataKey="score" name="Puntuación" radius={[0, 8, 8, 0]}>
                        {dimensionScores.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-secondary">Sin dimensiones</div>
                )}
              </div>
            </div>
          </div>

          {/* Question-by-Question Comparison Table */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-outline-variant/50 bg-surface-container-lowest flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-on-background flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-primary" />
                  Repercusión Pregunta a Pregunta (Edición Actual vs Anterior)
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  Evalúa con precisión el impacto directo de las medidas en cada ítem de la encuesta.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                  <TrendingUp className="w-3 h-3" /> Mejora (&gt;+0.2)
                </span>
                <span className="flex items-center gap-1 text-secondary bg-surface-variant px-2 py-1 rounded">
                  <Minus className="w-3 h-3" /> Estable
                </span>
                <span className="flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-1 rounded">
                  <TrendingDown className="w-3 h-3" /> Atención (&lt;-0.2)
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/50 bg-surface-container-lowest text-xs font-bold text-secondary uppercase">
                    <th className="px-5 py-3.5 w-8">#</th>
                    <th className="px-3 py-3.5">Pregunta</th>
                    <th className="px-3 py-3.5 text-center w-28">Dimensión</th>
                    <th className="px-3 py-3.5 text-center w-24">Edición Anterior</th>
                    <th className="px-3 py-3.5 text-center w-24">Edición Actual</th>
                    <th className="px-3 py-3.5 text-center w-28">Variación</th>
                    <th className="px-3 py-3.5 text-center w-36">Impacto Medidas</th>
                    <th className="px-3 py-3.5 text-center w-28">Distribución</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-sm">
                  {data.questionComparisons.map((q, i) => {
                    const isPositive = (q.delta ?? 0) >= 0.3;
                    const isNegative = (q.delta ?? 0) <= -0.3;
                    return (
                      <tr key={q.questionId || i} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-5 py-3.5 font-bold text-outline text-xs">{i + 1}</td>
                        <td className="px-3 py-3.5 font-medium text-on-background leading-snug max-w-md">
                          {q.text}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="text-xs font-semibold text-secondary bg-surface-variant px-2.5 py-1 rounded-full">
                            {q.dimension}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          {q.previousScore !== null ? (
                            <span className="text-xs font-bold text-secondary">
                              {q.previousScore.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-xs text-outline italic">Nueva</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className={cn("inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold", getRatingBg(q.currentScore))}>
                            {q.currentScore.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          {q.delta !== null ? (
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-extrabold",
                              isPositive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                              isNegative ? "bg-rose-50 text-rose-700 border border-rose-200" :
                              "bg-surface-variant text-secondary"
                            )}>
                              {isPositive && <TrendingUp className="w-3 h-3" />}
                              {isNegative && <TrendingDown className="w-3 h-3" />}
                              {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
                              {q.delta > 0 ? `+${q.delta.toFixed(1)}` : q.delta.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-xs text-outline">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          {q.status === 'improved' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              🟢 Mejora notable
                            </span>
                          )}
                          {q.status === 'declined' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                              🔴 Requiere atención
                            </span>
                          )}
                          {q.status === 'stable' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                              ⚪ Estable
                            </span>
                          )}
                          {q.status === 'new' && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                              🆕 Línea base
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3.5">
                          {/* Mini distribution histogram */}
                          <div className="flex items-end gap-[2px] h-5 justify-center">
                            {q.currentDistribution.map((count, idx) => {
                              const maxCount = Math.max(...q.currentDistribution, 1);
                              const heightPct = (count / maxCount) * 100;
                              const color = idx < 4 ? 'bg-rose-400' : idx < 6 ? 'bg-amber-400' : 'bg-emerald-400';
                              return (
                                <div 
                                  key={idx} 
                                  className={cn("w-[7px] rounded-t-sm transition-all", color)}
                                  style={{ height: `${Math.max(heightPct, 4)}%` }}
                                  title={`Nota ${idx + 1}: ${count} respuestas`}
                                />
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Heatmaps */}
          <div className="space-y-6">
            <Heatmap 
              data={data.heatmap} 
              columns={data.departments} 
              title="Mapa de Calor por Área (Edición Activa)"
              subtitle="Puntuaciones agregadas por dimensión y departamento."
            />
            
            <Heatmap 
              data={data.heatmapLocation} 
              columns={data.locations} 
              title="Mapa de Calor por Ubicación (Edición Activa)"
              subtitle="Mejores y peores sucursales (Top 3 y Bottom 3)."
            />
          </div>
        </>
      )}
    </div>
  );
}
