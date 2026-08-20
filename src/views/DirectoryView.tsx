import React, { useState } from 'react';
import { useEmployees } from '../hooks/useEmployees';
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  Filter,
  CheckCircle2,
  XCircle,
  Mail,
  Tag
} from 'lucide-react';
import { cn } from '../lib/utils';

export function DirectoryView() {
  const { employees, segmentFields, loading, toggleEmployeeActive } = useEmployees();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = employees.filter((emp) => {
    const matchesSearch = 
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ? true : 
      statusFilter === 'active' ? emp.is_active : !emp.is_active;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 space-y-8 w-full max-w-[1440px] mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-on-background tracking-tight">Directorio</h2>
          <p className="text-lg text-on-surface-variant mt-1">
            Gestiona los empleados y sus segmentos para las encuestas.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-surface text-on-surface border border-outline-variant font-medium px-5 py-2.5 rounded-xl hover:bg-surface-variant transition-all flex items-center gap-2 text-sm shadow-sm">
            <Tag className="w-4 h-4" />
            Gestionar Segmentos
          </button>
          <button className="bg-primary text-on-primary font-medium px-5 py-2.5 rounded-xl hover:bg-primary-container transition-all flex items-center gap-2 text-sm shadow-sm">
            <Plus className="w-4 h-4" />
            Añadir Empleado
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-on-background">{employees.length}</p>
            <p className="text-sm text-secondary font-medium uppercase tracking-wider">Total Empleados</p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-on-background">{employees.filter(e => e.is_active).length}</p>
            <p className="text-sm text-secondary font-medium uppercase tracking-wider">Activos (Elegibles)</p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-on-background">{segmentFields.length}</p>
            <p className="text-sm text-secondary font-medium uppercase tracking-wider">Campos de Segmento</p>
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-outline-variant/50 flex flex-col md:flex-row gap-4 items-center justify-between bg-surface-container-lowest">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-fixed-dim transition-all"
            />
          </div>
          <div className="flex bg-surface-variant p-1 rounded-lg w-full md:w-auto">
            {(['all', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "flex-1 md:flex-none px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all",
                  statusFilter === status
                    ? "bg-white text-on-background shadow-sm"
                    : "text-secondary hover:text-on-surface"
                )}
              >
                {status === 'all' ? 'Todos' : status === 'active' ? 'Activos' : 'Inactivos'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant/50">
                <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Empleado</th>
                <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider hidden md:table-cell">Segmentos (Top 2)</th>
                <th className="px-6 py-4 text-xs font-bold text-secondary uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-secondary">Cargando directorio...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
                    <Filter className="w-8 h-8 text-outline mx-auto mb-3" />
                    <p className="text-sm text-secondary">No se encontraron empleados.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                          {emp.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-background">{emp.full_name}</p>
                          <p className="text-xs text-secondary flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" /> {emp.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
                        emp.is_active 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-surface-variant text-secondary border-outline-variant"
                      )}>
                        {emp.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        {emp.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(emp.segments).slice(0, 2).map(([key, val]) => (
                          <span key={key} className="text-[10px] font-bold uppercase tracking-wider bg-surface-variant px-2 py-1 rounded text-secondary border border-outline-variant/50">
                            {val}
                          </span>
                        ))}
                        {Object.keys(emp.segments).length > 2 && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary px-1 py-1">
                            +{Object.keys(emp.segments).length - 2}
                          </span>
                        )}
                        {Object.keys(emp.segments).length === 0 && (
                          <span className="text-xs text-outline italic">Sin segmentos</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => toggleEmployeeActive(emp.id)}
                          className="text-xs font-semibold text-primary hover:underline px-2 py-1"
                        >
                          {emp.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button className="p-1.5 text-secondary hover:bg-surface-variant rounded-md transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
