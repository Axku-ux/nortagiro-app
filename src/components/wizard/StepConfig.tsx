import React, { useState } from 'react';
import { Settings, Calendar, Layers, Plus, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StepConfigProps {
  title: string;
  description: string;
  periodLabel: string;
  programName: string;
  startsAt: string;
  endsAt: string;
  existingPrograms?: string[];
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onPeriodLabelChange: (v: string) => void;
  onProgramNameChange: (v: string) => void;
  onStartsAtChange: (v: string) => void;
  onEndsAtChange: (v: string) => void;
}

export function StepConfig({
  title, 
  description, 
  periodLabel, 
  programName,
  startsAt, 
  endsAt,
  existingPrograms = [],
  onTitleChange, 
  onDescriptionChange, 
  onPeriodLabelChange,
  onProgramNameChange,
  onStartsAtChange, 
  onEndsAtChange,
}: StepConfigProps) {
  const [isCreatingNewProgram, setIsCreatingNewProgram] = useState(
    existingPrograms.length === 0 || !existingPrograms.includes(programName)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-28">
      {/* 1. Program Selection Card */}
      <div className="card p-6 border-primary/20 bg-gradient-to-b from-primary/5 via-surface to-surface shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2 text-on-background">
              <Layers className="w-5 h-5 text-primary" />
              Programa de Medición
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Un Programa agrupa todas las campañas que evalúan los mismos aspectos a lo largo del tiempo (ej: <em>Clima Trimestral, Pulso de Liderazgo, Onboarding</em>) para comparar su evolución histórica en Reporting.
            </p>
          </div>
        </div>

        <div className="space-y-4 mt-4 pt-4 border-t border-outline-variant/60">
          {existingPrograms.length > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewProgram(false);
                  if (existingPrograms.length > 0 && !existingPrograms.includes(programName)) {
                    onProgramNameChange(existingPrograms[0]);
                  }
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer",
                  !isCreatingNewProgram
                    ? "bg-primary text-on-primary border-primary shadow-sm"
                    : "bg-surface border-outline-variant text-secondary hover:bg-surface-variant"
                )}
              >
                Seleccionar Programa Existente
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNewProgram(true);
                  if (existingPrograms.includes(programName)) {
                    onProgramNameChange('');
                  }
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer",
                  isCreatingNewProgram
                    ? "bg-primary text-on-primary border-primary shadow-sm"
                    : "bg-surface border-outline-variant text-secondary hover:bg-surface-variant"
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                Crear Nuevo Programa
              </button>
            </div>
          )}

          {!isCreatingNewProgram && existingPrograms.length > 0 ? (
            <div>
              <label htmlFor="wiz-program-select" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                Elige el Programa *
              </label>
              <select
                id="wiz-program-select"
                value={programName}
                onChange={(e) => onProgramNameChange(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-base text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all cursor-pointer font-medium"
              >
                {existingPrograms.map((prog) => (
                  <option key={prog} value={prog}>
                    🏷️ {prog}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="wiz-program-input" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
                Nombre del Programa *
              </label>
              <input
                id="wiz-program-input"
                type="text"
                required
                value={programName}
                onChange={(e) => onProgramNameChange(e.target.value)}
                placeholder="Ej: Clima Organizacional 360, Pulso Trimestral de Bienestar..."
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-base text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all font-medium"
              />
              <p className="text-xs text-secondary mt-1.5">
                Todas las campañas que crees o repitas bajo este programa compartirán el mismo análisis comparativo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Campaign Config Card */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-1 flex items-center gap-2 text-on-background">
          <Settings className="w-5 h-5 text-primary" />
          Detalles de esta Campaña / Edición
        </h2>
        <p className="text-sm text-on-surface-variant mb-6">Define el nombre de la edición, fechas y descripción.</p>

        <div className="space-y-5">
          <div>
            <label htmlFor="wiz-title" className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">
              Título de la Campaña / Edición *
            </label>
            <input
              id="wiz-title"
              type="text"
              required
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Ej: Encuesta de Clima Laboral Q1 2026"
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
