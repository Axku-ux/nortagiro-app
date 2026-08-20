import React from 'react';
import { Tag, MapPin, Users } from 'lucide-react';

interface StepAudienceProps {
  segmentFields: { id: string; field_name: string; options: string[] }[];
}

export function StepAudience({ segmentFields }: StepAudienceProps) {
  // Extraemos los departamentos y ubicaciones
  const departments = segmentFields.find(f => f.field_name.toLowerCase().includes('departamento'))?.options || ['General'];
  const locations = segmentFields.find(f => f.field_name.toLowerCase().includes('ubicación') || f.field_name.toLowerCase().includes('location'))?.options || ['Sede Central'];

  const totalCombinations = departments.length * locations.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="card p-8 text-center max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-on-background mb-2">Distribución por Enlaces Públicos</h3>
        <p className="text-secondary mb-8">
          En lugar de enviar correos individuales, generaremos enlaces únicos y anónimos para cada combinación de Departamento y Ubicación. 
          Podrás distribuir estos enlaces libremente.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-secondary" />
              <span className="font-semibold text-sm">Departamentos detectados</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {departments.map(d => (
                <span key={d} className="text-xs bg-surface-variant text-secondary px-2 py-1 rounded-md">{d}</span>
              ))}
            </div>
          </div>
          
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-secondary" />
              <span className="font-semibold text-sm">Ubicaciones detectadas</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {locations.map(l => (
                <span key={l} className="text-xs bg-surface-variant text-secondary px-2 py-1 rounded-md">{l}</span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-outline-variant/50">
          <p className="text-sm font-medium text-on-background">
            Se generarán <span className="text-primary font-bold text-lg">{totalCombinations}</span> enlaces únicos tras lanzar la campaña.
          </p>
        </div>
      </div>
    </div>
  );
}
