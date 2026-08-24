import React, { useState } from 'react';
import { 
  BarChart2, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Filter, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  AlertCircle, 
  BrainCircuit,
  Calendar,
  Building2,
  MapPin,
  CheckCircle2,
  Sparkles
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
  Legend, 
  Cell 
} from 'recharts';
import { cn } from '../lib/utils';
import { useCampaigns } from '../hooks/useCampaigns';

// Mock trend data
const HISTORICAL_TREND = [
  { period: 'Q1 2025', indice: 7.2, eNPS: 28, participacion: 78 },
  { period: 'Q2 2025', indice: 7.6, eNPS: 34, participacion: 82 },
  { period: 'Q3 2025', indice: 8.1, eNPS: 40, participacion: 85 },
  { period: 'Q4 2025', indice: 8.4, eNPS: 42, participacion: 87 },
];

const DIMENSION_SCORES = [
  { name: 'Liderazgo', score: 8.6, target: 8.0, color: '#10b981' },
  { name: 'Crecimiento', score: 7.8, target: 8.0, color: '#3b82f6' },
  { name: 'Reconocimiento', score: 6.9, target: 7.5, color: '#fbbf24' },
  { name: 'Bienestar', score: 8.8, target: 8.0, color: '#10b981' },
  { name: 'Comunicación', score: 7.4, target: 7.5, color: '#fbbf24' },
  { name: 'Cultura', score: 9.1, target: 8.5, color: '#10b981' },
];

const HEATMAP_DATA = [
  { dept: 'Tech', liderazgo: 8.8, crecimiento: 8.2, reconocimiento: 7.1, bienestar: 9.0 },
  { dept: 'Sales', liderazgo: 8.2, crecimiento: 7.5, reconocimiento: 6.2, bienestar: 8.1 },
  { dept: 'Ops', liderazgo: 8.4, crecimiento: 7.1, reconocimiento: 6.8, bienestar: 8.6 },
  { dept: 'Marketing', liderazgo: 9.1, crecimiento: 8.5, reconocimiento: 7.8, bienestar: 9.2 },
];

import { useDashboardData } from '../hooks/useDashboardData';

export function ReportingView() {
  const { campaigns } = useCampaigns();
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const { data, loading } = useDashboardData(selectedCampaign === 'all' ? undefined : selectedCampaign);

  // Compute dynamic heatmap array for the table
  // data.heatmap is { dimension: string, scores: { [dept]: number } }[]
  // We want rows by department, columns by dimension
  const dimensions = data?.heatmap.map(h => h.dimension) || [];
  const departments = data?.departments || [];
  
  const heatmapRows = departments.map(dept => {
    const row: any = { dept };
    dimensions.forEach(dim => {
      const hData = data?.heatmap.find(h => h.dimension === dim);
      row[dim] = hData?.scores[dept] || 0;
    });
    return row;
  });

  const dimensionScores = data?.heatmap.map(h => {
    const vals = Object.values(h.scores);
    const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { name: h.dimension, score: Number(avg.toFixed(1)), color: '#3b82f6' };
  }) || [];

  const handleExportCSV = () => {
    const cols = ['Departamento', ...dimensions];
    const csvContent = "data:text/csv;charset=utf-8," 
      + cols.join(',') + "\n"
      + heatmapRows.map(row => {
          return [row.dept, ...dimensions.map(d => row[d])].join(',');
        }).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
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

  const getRatingColor = (score: number) => {
    if (score >= 8.0) return 'bg-emerald-500/15 text-emerald-700 border-emerald-300 font-bold';
    if (score >= 7.0) return 'bg-amber-500/15 text-amber-700 border-amber-300 font-bold';
    return 'bg-rose-500/15 text-rose-700 border-rose-300 font-bold';
  };

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-[1440px] mx-auto animate-in fade-in duration-500 pb-32">
      {/* Toast alert for export */}
      {exportMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 border border-slate-700 animate-in slide-in-from-top">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{exportMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-on-background tracking-tight">Reporting y Analítica</h2>
          <p className="text-lg text-on-surface-variant mt-1">
            Análisis consolidado del clima organizacional e indicadores clave.
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="bg-surface border border-outline-variant text-on-surface hover:bg-surface-variant px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-primary text-on-primary hover:bg-primary-container px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all shadow-sm hover:shadow cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar PDF</span>
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
            <option value="all">Todas las Campañas (Consolidado)</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-secondary" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">Todos los Departamentos</option>
            <option value="tech">Tech</option>
            <option value="sales">Sales</option>
            <option value="ops">Ops</option>
            <option value="marketing">Marketing</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-secondary" />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-surface border border-outline-variant rounded-lg px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary"
          >
            <option value="all">Todas las Ubicaciones</option>
            <option value="madrid">Sede Central (Madrid)</option>
            <option value="barcelona">Barcelona</option>
            <option value="remoto">Remoto</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Índice Global</span>
            <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-background">{data?.metrics?.globalScore || 0}</span>
          </div>
          <p className="text-xs text-secondary mt-2">Escala de 1 a 10 (Promedio global)</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">eNPS Promedio</span>
            <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-background">{data?.metrics?.enps > 0 ? '+' : ''}{data?.metrics?.enps || 0}</span>
          </div>
          <p className="text-xs text-secondary mt-2">{data?.metrics?.enpsPromoters || 0}% Promotores · {data?.metrics?.enpsNeutral || 0}% Neutros · {data?.metrics?.enpsDetractors || 0}% Detractores</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Participación</span>
            <div className="w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-background">{data?.metrics?.participationRate || 0}%</span>
          </div>
          <p className="text-xs text-secondary mt-2">Anonimato 100% garantizado</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Riesgo Burnout</span>
            <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-background">{data?.metrics?.burnoutRisk || 0}%</span>
          </div>
          <p className="text-xs text-secondary mt-2">Respuestas de bienestar críticas</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-7 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-on-background">Evolución Histórica de Clima</h3>
              <p className="text-xs text-secondary">Tendencia trimestral del índice global y participación</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HISTORICAL_TREND}>
                <defs>
                  <linearGradient id="colorIndice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="period" stroke="#64748b" fontSize={12} />
                <YAxis domain={[5, 10]} stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="indice" name="Índice Clima" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIndice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dimension Bar Chart */}
        <div className="lg:col-span-5 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-on-background">Puntuación por Dimensión</h3>
              <p className="text-xs text-secondary">Desglose de satisfacción por área de experiencia</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dimensionScores} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 10]} stroke="#64748b" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={100} />
                <Tooltip />
                <Bar dataKey="score" name="Puntuación" radius={[0, 8, 8, 0]}>
                  {dimensionScores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Heatmap Table Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-on-background">Mapa de Calor por Área y Dimensión</h3>
            <p className="text-xs text-secondary">Identifica visualmente fortalezas y puntos críticos por departamento</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"/> ≥8.0 Excelente</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"/> 7.0-7.9 Moderado</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block"/> &lt;7.0 Atención</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/60">
                <th className="py-3 px-4 text-xs font-bold text-secondary uppercase tracking-wider">Departamento</th>
                {dimensions.map(dim => (
                  <th key={dim} className="py-3 px-4 text-xs font-bold text-secondary uppercase tracking-wider text-center">{dim}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {heatmapRows.map((row) => (
                <tr key={row.dept} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-4 px-4 font-bold text-sm text-on-background">{row.dept}</td>
                  {dimensions.map(dim => (
                    <td key={dim} className="py-4 px-4 text-center">
                      <span className={cn("inline-block px-3 py-1 rounded-lg text-xs border", getRatingColor(row[dim]))}>
                        {row[dim]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
