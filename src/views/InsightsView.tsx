import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  AlertTriangle, 
  Award, 
  TrendingUp, 
  RefreshCw, 
  MessageSquare, 
  ChevronRight,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

const MOCK_AI_INSIGHTS = [
  {
    id: 'ins-1',
    type: 'alert',
    severity: 'critical',
    title: 'Riesgo de desinterés en el Departamento de Sales',
    description: 'La dimensión de Reconocimiento ha caído a 6.2 en el equipo comercial. Se detectan comentarios recurrentes sobre la falta de visibilidad del esfuerzo individual en objetivos trimestrales.',
    department: 'Sales',
    action: 'Implementar programa de reconocimientos mensuales y revisión de comisiones.',
  },
  {
    id: 'ins-2',
    type: 'praise',
    severity: 'info',
    title: 'Excelente liderazgo y clima en el equipo de Marketing',
    description: 'El equipo de Marketing alcanza una satisfacción de 9.1 en Liderazgo y Bienestar. La flexibilidad horaria y la autonomía asignada son los factores mejor valorados.',
    department: 'Marketing',
    action: 'Documentar mejores prácticas del responsable de área para compartirlas con otros líderes.',
  },
  {
    id: 'ins-3',
    type: 'opportunity',
    severity: 'warning',
    title: 'Oportunidad de mejora en Crecimiento Profesional en Ops',
    description: 'El 64% de los empleados en Operaciones señalan que no perciben un plan de carrera claro a 2 años vista, a pesar de valorar positivamente el ambiente laboral.',
    department: 'Ops',
    action: 'Diseñar matriz de competencias y planes de desarrollo individuales.',
  },
];

export function InsightsView() {
  const [loadingAI, setLoadingAI] = useState(false);
  const [insights, setInsights] = useState(MOCK_AI_INSIGHTS);
  const [recalculating, setRecalculating] = useState(false);

  const handleRegenerate = () => {
    setRecalculating(true);
    setTimeout(() => {
      setRecalculating(false);
    }, 1500);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-[1440px] mx-auto animate-in fade-in duration-500 pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Impulsado por Gemini AI
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-on-background tracking-tight">AI Insights</h2>
          <p className="text-lg text-on-surface-variant mt-1">
            Detección automática de patrones, alertas críticas y recomendaciones de mejora.
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={recalculating}
          className="bg-primary text-on-primary font-bold px-5 py-2.5 rounded-xl hover:bg-primary-container transition-all flex items-center gap-2 text-sm shadow-sm cursor-pointer"
        >
          <RefreshCw className={cn("w-4 h-4", recalculating && "animate-spin")} />
          <span>{recalculating ? 'Analizando datos...' : 'Regenerar Insights'}</span>
        </button>
      </header>

      {/* Hero Card AI */}
      <div className="card p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-0" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-emerald-400" />
              Resumen Ejecutivo de IA
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              El análisis semántico de los comentarios y las puntuaciones indica que el clima organizacional global se mantiene saludable (8.4/10), pero requiere atención focalizada en el departamento de **Sales**.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-extrabold text-emerald-400">3</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Insights Clave</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-center">
              <p className="text-2xl font-extrabold text-blue-400">92%</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Confianza IA</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights Cards List */}
      <div className="space-y-4">
        {insights.map((item) => {
          const isAlert = item.type === 'alert';
          const isPraise = item.type === 'praise';

          return (
            <div
              key={item.id}
              className={cn(
                "card p-6 border-l-4 transition-all hover:shadow-md",
                isAlert ? "border-l-rose-500 bg-rose-50/30" :
                isPraise ? "border-l-emerald-500 bg-emerald-50/30" :
                "border-l-amber-500 bg-amber-50/30"
              )}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  {isAlert && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
                  {isPraise && <Award className="w-5 h-5 text-emerald-600 shrink-0" />}
                  {!isAlert && !isPraise && <Zap className="w-5 h-5 text-amber-600 shrink-0" />}

                  <h4 className="text-base font-bold text-on-background">{item.title}</h4>
                </div>

                <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-surface border border-outline-variant text-secondary">
                  Área: {item.department}
                </span>
              </div>

              <p className="text-sm text-on-surface-variant mb-4 leading-relaxed">
                {item.description}
              </p>

              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/60 flex items-start gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-on-background">Acción sugerida:</strong>{' '}
                  <span className="text-secondary">{item.action}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
