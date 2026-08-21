import React from 'react';
import { Tag, MapPin, Users, CheckSquare, Square } from 'lucide-react';

interface StepAudienceProps {
  segmentFields: { id: string; field_name: string; options: string[] }[];
  selectedDepartments: string[];
  selectedLocations: string[];
  onDepartmentsChange: (depts: string[]) => void;
  onLocationsChange: (locs: string[]) => void;
}

export function StepAudience({
  segmentFields,
  selectedDepartments,
  selectedLocations,
  onDepartmentsChange,
  onLocationsChange,
}: StepAudienceProps) {
  const allDepartments = segmentFields.find(f => f.field_name.toLowerCase().includes('departamento'))?.options || ['Tech', 'Sales', 'Ops', 'Marketing', 'General'];
  const allLocations = segmentFields.find(f => f.field_name.toLowerCase().includes('ubicación') || f.field_name.toLowerCase().includes('location'))?.options || ['Sede Central', 'Madrid', 'Barcelona', 'Remoto'];

  const toggleDept = (dept: string) => {
    if (selectedDepartments.includes(dept)) {
      if (selectedDepartments.length === 1) return; // keep at least 1
      onDepartmentsChange(selectedDepartments.filter(d => d !== dept));
    } else {
      onDepartmentsChange([...selectedDepartments, dept]);
    }
  };

  const toggleLoc = (loc: string) => {
    if (selectedLocations.includes(loc)) {
      if (selectedLocations.length === 1) return; // keep at least 1
      onLocationsChange(selectedLocations.filter(l => l !== loc));
    } else {
      onLocationsChange([...selectedLocations, loc]);
    }
  };

  const toggleAllDepts = () => {
    if (selectedDepartments.length === allDepartments.length) {
      onDepartmentsChange([allDepartments[0]]);
    } else {
      onDepartmentsChange([...allDepartments]);
    }
  };

  const toggleAllLocs = () => {
    if (selectedLocations.length === allLocations.length) {
      onLocationsChange([allLocations[0]]);
    } else {
      onLocationsChange([...allLocations]);
    }
  };

  const totalCombinations = selectedDepartments.length * selectedLocations.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-32">
      <div className="card p-8 max-w-4xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-on-background mb-2">Selección de Audiencia Objetivo</h3>
          <p className="text-secondary text-sm">
            Filtra los Departamentos y Ubicaciones destinatarios. Se generará un enlace único y anónimo por cada combinación seleccionada.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Department Filter Card */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm text-on-background">Departamentos</span>
              </div>
              <button
                type="button"
                onClick={toggleAllDepts}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {selectedDepartments.length === allDepartments.length ? 'Deseleccionar todos' : 'Marcar todos'}
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {allDepartments.map((dept) => {
                const isSelected = selectedDepartments.includes(dept);
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => toggleDept(dept)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-surface border-outline-variant/50 text-secondary hover:bg-surface-variant'
                    }`}
                  >
                    <span>{dept}</span>
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-outline shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Location Filter Card */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant">
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant/40 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm text-on-background">Ubicaciones</span>
              </div>
              <button
                type="button"
                onClick={toggleAllLocs}
                className="text-xs font-semibold text-primary hover:underline"
              >
                {selectedLocations.length === allLocations.length ? 'Deseleccionar todos' : 'Marcar todos'}
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {allLocations.map((loc) => {
                const isSelected = selectedLocations.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleLoc(loc)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : 'bg-surface border-outline-variant/50 text-secondary hover:bg-surface-variant'
                    }`}
                  >
                    <span>{loc}</span>
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-outline shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-outline-variant text-center">
          <p className="text-sm font-medium text-on-background">
            Resumen: <span className="text-primary font-bold text-lg">{selectedDepartments.length}</span> departamentos × <span className="text-primary font-bold text-lg">{selectedLocations.length}</span> ubicaciones = <span className="text-primary font-bold text-lg">{totalCombinations}</span> enlaces únicos de encuesta.
          </p>
        </div>
      </div>
    </div>
  );
}
