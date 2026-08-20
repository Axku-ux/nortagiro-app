import React from 'react';
import { Settings, Calendar } from 'lucide-react';

interface StepConfigProps {
  title: string;
  description: string;
  periodLabel: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onPeriodLabelChange: (v: string) => void;
}

const PERIOD_OPTIONS = [
  'Q1 2025 (Ene - Mar)',
  'Q2 2025 (Abr - Jun)',
  'Q3 2025 (Jul - Sep)',
  'Q4 2025 (Oct - Dic)',
  'Anual 2025',
  'Personalizado',
];

export function StepConfig({
  title, description, periodLabel,
  onTitleChange, onDescriptionChange, onPeriodLabelChange,
}: StepConfigProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-1 flex items-center gap-2 text-on-background">
          <Settings className="w-5 h-5 text-primary" />
          Configuración General
        </h2>
        <p className="text-sm text-on-surface-variant mb-6">Define el nombre, descripción y periodo de la campaña.</p>

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
              placeholder="Ej: Encuesta de Clima Q3 2025"
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

          <div>
            <label htmlFor="wiz-period" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              Periodo
            </label>
            <select
              id="wiz-period"
              value={periodLabel}
              onChange={(e) => onPeriodLabelChange(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-base text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all cursor-pointer"
            >
              <option value="">Seleccionar periodo...</option>
              {PERIOD_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
