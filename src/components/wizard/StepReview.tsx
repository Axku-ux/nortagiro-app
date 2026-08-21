import React, { useState } from 'react';
import { 
  CalendarClock, 
  Users, 
  MessageSquareText, 
  Bot, 
  AlertTriangle,
  Monitor,
  Smartphone,
  Lock,
  CheckCircle2,
  Rocket
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { QuestionDraft } from '../../hooks/useCampaigns';
import type { ReminderConfig } from '../../lib/database.types';

interface StepReviewProps {
  title: string;
  description: string;
  periodLabel: string;
  questions: QuestionDraft[];
  audienceCount: number;
  startsAt: string;
  endsAt: string;
  reminderConfig: ReminderConfig;
  onStartsAtChange: (v: string) => void;
  onEndsAtChange: (v: string) => void;
  onReminderConfigChange: (v: ReminderConfig) => void;
  onLaunch: () => void;
  launching: boolean;
}

export function StepReview({
  title, description, periodLabel, questions, audienceCount,
  startsAt, endsAt, reminderConfig,
  onStartsAtChange, onEndsAtChange, onReminderConfigChange,
  onLaunch, launching,
}: StepReviewProps) {
  const [deviceView, setDeviceView] = useState<'mobile' | 'desktop'>('mobile');

  const dimensionCounts = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.dimension] = (acc[q.dimension] || 0) + 1;
    return acc;
  }, {});

  const isValid = title.trim().length > 0 && questions.length > 0;

  return (
    <div className="animate-in fade-in duration-300 pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Review + Schedule */}
        <div className="lg:col-span-7 space-y-6">
          {/* Campaign summary */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-on-background">
              <CheckCircle2 className="w-5 h-5 text-tertiary" />
              Resumen de Campaña
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low rounded-xl p-4">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Título</p>
                  <p className="text-sm font-semibold text-on-background">{title || '—'}</p>
                </div>
                <div className="bg-surface-container-low rounded-xl p-4">
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Periodo</p>
                  <p className="text-sm font-semibold text-on-background">{periodLabel || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-3">
                  <MessageSquareText className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-on-background">{questions.length}</p>
                    <p className="text-xs text-secondary">Preguntas</p>
                  </div>
                </div>
                <div className="bg-surface-container-low rounded-xl p-4 flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-on-background">{audienceCount}</p>
                    <p className="text-xs text-secondary">Empleados</p>
                  </div>
                </div>
              </div>

              {/* Dimensions breakdown */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(dimensionCounts).map(([dim, count]) => (
                  <span key={dim} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                    {dim} ({count})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              Programación
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="wiz-start" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">Fecha de Inicio</label>
                <input
                  id="wiz-start"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => onStartsAtChange(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                />
              </div>
              <div>
                <label htmlFor="wiz-end" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">Fecha de Cierre</label>
                <input
                  id="wiz-end"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => onEndsAtChange(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
                />
              </div>
            </div>
          </div>

          {/* Reminders */}
          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-tertiary" />
                  Recordatorios Inteligentes
                </h2>
                <p className="text-sm text-on-surface-variant max-w-md">
                  Envía correos automáticos a quienes no han completado la encuesta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onReminderConfigChange({ ...reminderConfig, enabled: !reminderConfig.enabled })}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  reminderConfig.enabled ? "bg-primary" : "bg-outline-variant"
                )}
              >
                <span className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  reminderConfig.enabled ? "translate-x-5" : "translate-x-0"
                )} />
              </button>
            </div>

            <div className={cn(
              "mt-4 bg-surface-container-low rounded-xl p-4 border transition-all duration-300",
              reminderConfig.enabled ? "border-outline-variant/50 opacity-100" : "opacity-50 pointer-events-none"
            )}>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-on-surface">
                  <CalendarClock className="w-[18px] h-[18px] text-tertiary shrink-0" />
                  <strong>Recordatorio 1:</strong> {reminderConfig.first_reminder_days} días después del lanzamiento.
                </li>
                <li className="flex items-center gap-2 text-sm text-on-surface">
                  <AlertTriangle className="w-[18px] h-[18px] text-error shrink-0" />
                  <strong>Recordatorio Final:</strong> {reminderConfig.final_reminder_hours} horas antes del cierre.
                </li>
              </ul>
            </div>
          </div>

          {/* Launch button */}
          <button
            onClick={onLaunch}
            disabled={!isValid || launching}
            className={cn(
              "w-full h-14 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 text-base group",
              isValid && !launching
                ? "bg-primary text-on-primary hover:bg-primary-container shadow-md hover:shadow-lg"
                : "bg-surface-variant text-outline cursor-not-allowed"
            )}
          >
            {launching ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Rocket className="w-5 h-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                Lanzar Campaña
              </>
            )}
          </button>
        </div>

        {/* Right: Email Preview */}
        <div className="lg:col-span-5">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col overflow-hidden shadow-sm sticky top-[100px]">
            <div className="bg-surface-variant p-2 flex items-center justify-between border-b border-outline-variant">
              <span className="text-xs font-semibold text-on-surface-variant px-2 uppercase tracking-wider">Vista Previa Email</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setDeviceView('desktop')}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    deviceView === 'desktop' ? "bg-surface-container-highest text-primary" : "hover:bg-surface-container-highest text-on-surface-variant"
                  )}
                >
                  <Monitor className="w-[18px] h-[18px]" />
                </button>
                <button
                  onClick={() => setDeviceView('mobile')}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    deviceView === 'mobile' ? "bg-surface-container-highest text-primary" : "hover:bg-surface-container-highest text-on-surface-variant"
                  )}
                >
                  <Smartphone className="w-[18px] h-[18px]" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-surface-container flex-grow flex items-center justify-center min-h-[400px]">
              <div className={cn(
                "bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm flex flex-col transition-all duration-300 ease-in-out",
                deviceView === 'mobile' ? "w-[320px]" : "w-[480px]"
              )}>
                <div className="p-4 bg-primary-container text-on-primary-container text-center">
                  <div className="text-xl font-bold tracking-tight">Acme Corp</div>
                </div>
                <div className="p-5 text-on-surface flex-grow space-y-4 bg-surface-container-lowest">
                  <p className="text-sm font-medium">Hola, <strong>[Nombre]</strong></p>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Te invitamos a participar en nuestra encuesta <strong>{title || 'de clima'}</strong>. 
                    Solo tomará unos minutos y tu opinión es fundamental.
                  </p>
                  <p className="text-xs text-secondary">
                    {questions.length} preguntas · ~{Math.max(2, Math.ceil(questions.length * 0.6))} minutos
                  </p>
                  <div className="pt-2 pb-2 flex justify-center">
                    <button className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-sm font-medium shadow-sm w-full text-center">
                      Comenzar encuesta anónima
                    </button>
                  </div>
                  <div className="mt-4 p-2 bg-surface-container-low rounded border border-outline-variant/30 flex items-start gap-1">
                    <Lock className="w-[14px] h-[14px] text-secondary mt-[2px] shrink-0" />
                    <p className="text-[10px] leading-tight text-secondary font-medium">
                      Tus respuestas son 100% confidenciales y anónimas.
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-surface-variant text-center border-t border-outline-variant/50">
                  <p className="text-[10px] text-on-surface-variant font-medium">© 2025 Acme Corp. Talento & Cultura.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
