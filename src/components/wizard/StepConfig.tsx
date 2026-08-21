import React from 'react';
import { Settings, Calendar } from 'lucide-react';

interface StepConfigProps {
  title: string;
  description: string;
  periodLabel: string;
  startsAt: string;
  endsAt: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onPeriodLabelChange: (v: string) => void;
  onStartsAtChange: (v: string) => void;
  onEndsAtChange: (v: string) => void;
}

export function StepConfig({
  title, description, periodLabel, startsAt, endsAt,
  onTitleChange, onDescriptionChange, onPeriodLabelChange,
  onStartsAtChange, onEndsAtChange,
}: StepConfigProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-28">
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-1 flex items-center gap-2 text-on-background">
          <Settings className="w-5 h-5 text-primary" />
          Configuración General
        </h2>
        <p className="text-sm text-on-surface-variant mb-6">Define el nombre, descripción y periodo de vigencia de la campaña.</p>

        <div className="space-y-5">
          <div>
            <label htmlFor="wiz-title" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
              Título de la Campaña *
            </label>
            <input
              id="wiz-title"
              type="text"
              required
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Ej: Encuesta de Clima Laboral 2026"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-base text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
            />
          </div>

          <div>
            <label htmlFor="wiz-desc" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
              Descripción
            </label>
            <textarea
              id="wiz-desc"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Describe brevemente el propósito de esta encuesta..."
              rows={3}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-base text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all resize-none"
            />
          </div>

          {/* Date range pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="wiz-start" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Fecha de Inicio *
              </label>
              <input
                id="wiz-start"
                type="date"
                required
                value={startsAt}
                onChange={(e) => onStartsAtChange(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-base text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
              />
            </div>

            <div>
              <label htmlFor="wiz-end" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Fecha de Cierre *
              </label>
              <input
                id="wiz-end"
                type="date"
                required
                value={endsAt}
                onChange={(e) => onEndsAtChange(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-base text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
              />
            </div>
          </div>

          <div>
            <label htmlFor="wiz-period" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
              Etiqueta de Periodo (Opcional)
            </label>
            <input
              id="wiz-period"
              type="text"
              value={periodLabel}
              onChange={(e) => onPeriodLabelChange(e.target.value)}
              placeholder="Ej: Q1 2026, Semestre 1, Anual..."
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-base text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
