import React, { useState } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  MapPin,
  ArrowUpDown,
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell 
} from 'recharts';
import { cn } from '../lib/utils';
import { useCampaigns } from '../hooks/useCampaigns';
import { useDashboardData } from '../hooks/useDashboardData';
import { Heatmap } from '../components/dashboard/Heatmap';

export function ReportingView() {
  const { campaigns } = useCampaigns();
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const { data, loading } = useDashboardData(selectedCampaign || undefined);

  // Compute dimension scores for bar chart
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

  // Build CSV from heatmap data
  const handleExportCSV = () => {
    if (!data) return;
    const dimensions = data.heatmap.map(h => h.dimension);
    const cols = ['Departamento', ...dimensions];
    const rows = data.departments.map(dept => {
      const values = dimensions.map(dim => {
        const hData = data.heatmap.find(h => h.dimension === dim);
        return hData?.scores[dept] || 0;
      });
      return [dept, ...values].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + cols.join(',') + "\n" + rows.join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "reporte_clima_nortagiro.csv");
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

  const getRatingBg = (score: number) => {
    if (score >= 8) return 'bg-emerald-500/15 text-emerald-700';
    if (score >= 6) return 'bg-amber-500/15 text-amber-700';
    return 'bg-rose-500/15 text-rose-700';
  };

  return (
    <div className="p-4 md:p-8 space-y-6 w-full max-w-[1440px] mx-auto animate-in fade-in duration-500 pb-32">
      {/* Toast */}
      {exportMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 border border-slate-700 animate-in slide-in-from-top">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{exportMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-on-background tracking-tight">Analítica y Reporting</h2>
          <p className="text-base text-on-surface-variant mt-1">
            Drill-down detallado por dimensión, departamento y ubicación.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="bg-surface border border-outline-variant text-on-surface hover:bg-surface-variant px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>CSV</span>
          </button>
          <button onClick={handleExportPDF} className="bg-primary text-on-primary hover:bg-primary-container px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow cursor-pointer">
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </header>

      {/* Filters Bar */}
      <div className="card p-4 flex flex-wrap gap-4 items-center bg-surface-container-lowest">
        <div className="flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-wider mr-2">
          <Filter className="w-4 h-4 text-primary" />
          Filtros:
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-secondary" />
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary"
          >
            {campaigns.length === 0 && <option value="">Sin campañas</option>}
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {!data ? (
        <div className="card p-12 text-center">
          <BarChart3 className="w-12 h-12 text-outline mx-auto mb-4" />
          <h3 className="text-lg font-bold text-on-background mb-2">Sin datos para analizar</h3>
          <p className="text-sm text-secondary">Selecciona una campaña con respuestas para ver los gráficos.</p>
        </div>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Trend Area Chart */}
            <div className="lg:col-span-7 card p-6">
              <div className="mb-5">
                <h3 className="text-base font-bold text-on-background">Evolución Histórica</h3>
                <p className="text-xs text-secondary mt-0.5">Tendencia del índice global entre campañas</p>
              </div>
              <div className="h-64 w-full">
                {data.historicalTrend.length >= 2 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.historicalTrend}>
                      <defs>
                        <linearGradient id="colorIndice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="campaignTitle" stroke="#64748b" fontSize={11} />
                      <YAxis domain={[0, 10]} stroke="#64748b" fontSize={11} />
                      <Tooltip />
                      <Area type="monotone" dataKey="globalScore" name="Índice Clima" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIndice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-secondary">
                    <HelpCircle className="w-5 h-5 mr-2 text-outline" />
                    Se necesitan al menos 2 campañas para ver la tendencia.
                  </div>
                )}
              </div>
            </div>

            {/* Dimension Bar Chart */}
            <div className="lg:col-span-5 card p-6">
              <div className="mb-5">
                <h3 className="text-base font-bold text-on-background">Puntuación por Dimensión</h3>
                <p className="text-xs text-secondary mt-0.5">Promedio global de cada dimensión evaluada</p>
              </div>
              <div className="h-64 w-full">
                {dimensionScores.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dimensionScores} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" domain={[0, 10]} stroke="#64748b" fontSize={11} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={100} />
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

          {/* Heatmaps */}
          <Heatmap 
            data={data.heatmap} 
            columns={data.departments} 
            title="Mapa de Calor por Área"
            subtitle="Puntuaciones agregadas por dimensión y departamento."
          />
          
          <Heatmap 
            data={data.heatmapLocation} 
            columns={data.locations} 
            title="Mapa de Calor por Ubicación"
            subtitle="Mejores y peores sucursales (Top 3 y Bottom 3)."
          />

          {/* Question Ranking Table */}
          <div className="card overflow-hidden">
            <div className="p-5 border-b border-outline-variant/50 bg-surface-container-lowest flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-on-background">Ranking de Preguntas</h3>
                <p className="text-xs text-secondary mt-0.5">Ordenadas de menor a mayor puntuación para priorizar mejoras</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-secondary">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Peor → Mejor
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/50">
                    <th className="px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider w-8">#</th>
                    <th className="px-3 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Pregunta</th>
                    <th className="px-3 py-3 text-xs font-bold text-secondary uppercase tracking-wider text-center w-24">Dimensión</th>
                    <th className="px-3 py-3 text-xs font-bold text-secondary uppercase tracking-wider text-center w-20">Promedio</th>
                    <th className="px-3 py-3 text-xs font-bold text-secondary uppercase tracking-wider text-center w-32">Distribución</th>
                    <th className="px-3 py-3 text-xs font-bold text-secondary uppercase tracking-wider text-center w-20">Resp.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {data.questionRanking.map((q, i) => (
                    <tr key={q.questionId} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-5 py-3 text-sm font-bold text-outline">{i + 1}</td>
                      <td className="px-3 py-3 text-sm text-on-background leading-snug max-w-md">{q.text}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs font-semibold text-secondary bg-surface-variant px-2 py-0.5 rounded-full">{q.dimension}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={cn("inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold", getRatingBg(q.avgScore))}>
                          {q.avgScore}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {/* Mini distribution bar */}
                        <div className="flex items-end gap-[2px] h-5 justify-center">
                          {q.distribution.map((count, idx) => {
                            const maxCount = Math.max(...q.distribution, 1);
                            const heightPct = (count / maxCount) * 100;
                            const color = idx < 4 ? 'bg-rose-400' : idx < 6 ? 'bg-amber-400' : 'bg-emerald-400';
                            return (
                              <div 
                                key={idx} 
                                className={cn("w-[8px] rounded-t-sm transition-all", color)}
                                style={{ height: `${Math.max(heightPct, 4)}%` }}
                                title={`Rating ${idx + 1}: ${count} respuestas`}
                              />
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center text-xs font-bold text-secondary">{q.totalResponses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
