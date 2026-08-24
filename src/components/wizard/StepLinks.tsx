import React, { useState } from 'react';
import { Copy, CheckCircle2, Link as LinkIcon, Share2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getDepartmentOptions, getLocationOptions } from '../../hooks/useEmployees';

interface StepLinksProps {
  campaignId: string;
  segmentFields: any[];
  selectedDepartments?: string[];
  selectedLocations?: string[];
  onFinish: () => void;
}

export function StepLinks({ campaignId, segmentFields, selectedDepartments, selectedLocations, onFinish }: StepLinksProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const defaultDepts = getDepartmentOptions(segmentFields);
  const defaultLocs = getLocationOptions(segmentFields);

  const departments = selectedDepartments && selectedDepartments.length > 0 ? selectedDepartments : defaultDepts;
  const locations = selectedLocations && selectedLocations.length > 0 ? selectedLocations : defaultLocs;

  // Generamos todas las combinaciones posibles
  const combinations = departments.flatMap(dept => 
    locations.map(loc => ({ dept, loc }))
  );

  const handleCopy = (dept: string, loc: string) => {
    // Codificamos los parámetros para URL
    const url = `${window.location.origin}/survey/${campaignId}?dept=${encodeURIComponent(dept)}&loc=${encodeURIComponent(loc)}`;
    navigator.clipboard.writeText(url);
    const key = `${dept}-${loc}`;
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-on-background mb-2">¡Campaña Lanzada!</h2>
        <p className="text-secondary text-lg">
          La encuesta está activa. Copia y distribuye los siguientes enlaces a los responsables de cada área.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-outline-variant/50 bg-surface-container-lowest flex items-center gap-3">
          <Share2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Enlaces de Distribución</h3>
        </div>
        
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-surface-container-lowest shadow-sm">
              <tr>
                <th className="px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Departamento</th>
                <th className="px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider">Ubicación</th>
                <th className="px-5 py-3 text-xs font-bold text-secondary uppercase tracking-wider text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {combinations.map(({ dept, loc }) => {
                const key = `${dept}-${loc}`;
                const isCopied = copiedLink === key;
                return (
                  <tr key={key} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-5 py-4 font-medium text-sm text-on-background">
                      {dept}
                    </td>
                    <td className="px-5 py-4 text-sm text-secondary">
                      {loc}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button 
                        onClick={() => handleCopy(dept, loc)}
                        className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                          isCopied 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-surface text-primary border border-outline-variant hover:bg-surface-variant group-hover:border-primary/30"
                        )}
                      >
                        {isCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                        {isCopied ? 'Copiado' : 'Copiar Enlace'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button 
          onClick={onFinish}
          className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold shadow-sm hover:shadow hover:bg-primary-container transition-all"
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
}
