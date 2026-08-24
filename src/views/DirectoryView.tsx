import React, { useState } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { 
  Building2, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  Tag, 
  Layers, 
  Info,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';

export function DirectoryView() {
  const { segmentFields, addOptionToField, removeOptionFromField, updateOptionsInField } = useEmployees();

  // Find department & location fields
  const deptField = segmentFields.find(f => f.field_name.toLowerCase().includes('departamento')) || {
    field_name: 'Departamento',
    options: ['Tech', 'Sales', 'Ops', 'Marketing', 'RRHH', 'Finance'],
  };

  const locField = segmentFields.find(f => 
    f.field_name.toLowerCase().includes('ubicación') || 
    f.field_name.toLowerCase().includes('location') ||
    f.field_name.toLowerCase().includes('zona') ||
    f.field_name.toLowerCase().includes('territorio')
  ) || {
    field_name: 'Ubicación / Territorio',
    options: ['Sede Central', 'Madrid', 'Barcelona', 'Remoto', 'Zona Norte'],
  };

  // State for new department/territory input
  const [newDeptInput, setNewDeptInput] = useState('');
  const [newLocInput, setNewLocInput] = useState('');

  // Editing states
  const [editingDeptIndex, setEditingDeptIndex] = useState<number | null>(null);
  const [editingDeptValue, setEditingDeptValue] = useState('');

  const [editingLocIndex, setEditingLocIndex] = useState<number | null>(null);
  const [editingLocValue, setEditingLocValue] = useState('');

  // Handlers for Department
  const handleAddDept = () => {
    if (!newDeptInput.trim()) return;
    addOptionToField('departamento', newDeptInput.trim());
    setNewDeptInput('');
  };

  const handleRemoveDept = (deptName: string) => {
    if (deptField.options.length <= 1) return;
    removeOptionFromField('departamento', deptName);
  };

  const handleSaveEditDept = (index: number) => {
    if (!editingDeptValue.trim()) return;
    const updated = [...deptField.options];
    updated[index] = editingDeptValue.trim();
    updateOptionsInField('departamento', updated);
    setEditingDeptIndex(null);
  };

  // Handlers for Location / Territory
  const handleAddLoc = () => {
    if (!newLocInput.trim()) return;
    addOptionToField('ubicación', newLocInput.trim());
    setNewLocInput('');
  };

  const handleRemoveLoc = (locName: string) => {
    if (locField.options.length <= 1) return;
    removeOptionFromField('ubicación', locName);
  };

  const handleSaveEditLoc = (index: number) => {
    if (!editingLocValue.trim()) return;
    const updated = [...locField.options];
    updated[index] = editingLocValue.trim();
    updateOptionsInField('ubicación', updated);
    setEditingLocIndex(null);
  };

  const totalCombinations = deptField.options.length * locField.options.length;

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-[1440px] mx-auto animate-in fade-in duration-500 pb-32">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Estructura de la Organización
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-on-background tracking-tight">Departamentos y Zonas</h2>
          <p className="text-lg text-on-surface-variant mt-1">
            Gestiona los segmentos organizativos para personalizar los enlaces anónimos de tus encuestas.
          </p>
        </div>
      </header>

      {/* Info Banner */}
      <div className="card p-6 bg-emerald-50/50 border-emerald-200 flex items-start gap-4">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-base font-bold text-emerald-950 mb-1">Distribución Anónima por Grupos</h3>
          <p className="text-sm text-emerald-800 leading-relaxed">
            No necesitas dar de alta empleados de forma individual. Cada departamento y territorio que configures aquí generará automáticamente un enlace único de encuesta en el Wizard de creación de campañas.
          </p>
          <p className="text-xs font-semibold text-emerald-700 mt-2">
            Combinaciones actuales: <span className="font-bold">{deptField.options.length}</span> departamentos × <span className="font-bold">{locField.options.length}</span> zonas = <span className="font-extrabold underline">{totalCombinations} enlaces posibles</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Card */}
        <div className="card p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-background">Departamentos / Secciones</h3>
                  <p className="text-xs text-secondary">{deptField.options.length} registrados</p>
                </div>
              </div>
            </div>

            {/* List of departments */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {deptField.options.map((dept, index) => {
                const isEditing = editingDeptIndex === index;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest hover:border-primary/40 transition-all group"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editingDeptValue}
                          onChange={(e) => setEditingDeptValue(e.target.value)}
                          className="flex-1 bg-surface border border-primary rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none"
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEditDept(index)}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEditDept(index)}
                          className="p-1.5 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingDeptIndex(null)}
                          className="p-1.5 bg-surface-variant text-secondary rounded-lg hover:bg-surface-container transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold text-on-background">{dept}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingDeptIndex(index);
                              setEditingDeptValue(dept);
                            }}
                            className="p-1.5 text-secondary hover:text-primary hover:bg-surface-variant rounded-lg transition-colors"
                            title="Editar nombre"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveDept(dept)}
                            disabled={deptField.options.length <= 1}
                            className="p-1.5 text-secondary hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Eliminar departamento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add new department input */}
          <div className="pt-4 border-t border-outline-variant/50">
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">
              Añadir Nuevo Departamento / Sección
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: Operaciones, Comisaría, RRHH..."
                value={newDeptInput}
                onChange={(e) => setNewDeptInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDept()}
                className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
              />
              <button
                onClick={handleAddDept}
                disabled={!newDeptInput.trim()}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all",
                  newDeptInput.trim()
                    ? "bg-primary text-on-primary hover:bg-primary-container shadow-sm cursor-pointer"
                    : "bg-surface-variant text-outline cursor-not-allowed"
                )}
              >
                <Plus className="w-4 h-4" />
                Añadir
              </button>
            </div>
          </div>
        </div>

        {/* Location / Territory Card */}
        <div className="card p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-outline-variant/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-on-background">Territorios / Zonas / Ubicaciones</h3>
                  <p className="text-xs text-secondary">{locField.options.length} registradas</p>
                </div>
              </div>
            </div>

            {/* List of locations */}
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {locField.options.map((loc, index) => {
                const isEditing = editingLocIndex === index;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest hover:border-primary/40 transition-all group"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={editingLocValue}
                          onChange={(e) => setEditingLocValue(e.target.value)}
                          className="flex-1 bg-surface border border-primary rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none"
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEditLoc(index)}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEditLoc(index)}
                          className="p-1.5 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingLocIndex(null)}
                          className="p-1.5 bg-surface-variant text-secondary rounded-lg hover:bg-surface-container transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-semibold text-on-background">{loc}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingLocIndex(index);
                              setEditingLocValue(loc);
                            }}
                            className="p-1.5 text-secondary hover:text-primary hover:bg-surface-variant rounded-lg transition-colors"
                            title="Editar nombre"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveLoc(loc)}
                            disabled={locField.options.length <= 1}
                            className="p-1.5 text-secondary hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Eliminar territorio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add new location input */}
          <div className="pt-4 border-t border-outline-variant/50">
            <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-2">
              Añadir Nuevo Territorio / Zona
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: Bilbao, Vitoria, San Sebastián, Zona Sur..."
                value={newLocInput}
                onChange={(e) => setNewLocInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLoc()}
                className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
              />
              <button
                onClick={handleAddLoc}
                disabled={!newLocInput.trim()}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all",
                  newLocInput.trim()
                    ? "bg-primary text-on-primary hover:bg-primary-container shadow-sm cursor-pointer"
                    : "bg-surface-variant text-outline cursor-not-allowed"
                )}
              >
                <Plus className="w-4 h-4" />
                Añadir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
