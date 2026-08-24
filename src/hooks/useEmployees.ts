import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Employee, SegmentField } from '../lib/database.types';

// ─── Types ──────────────────────────────────────────────

export interface EmployeeWithSegments extends Employee {
  segments: Record<string, string>; // field_name -> value
}

export interface SegmentFieldWithOptions extends SegmentField {}

// ─── Mock Data ──────────────────────────────────────────

const MOCK_SEGMENT_FIELDS: SegmentFieldWithOptions[] = [
  { id: 'sf-1', organization_id: 'mock-org', field_name: 'Departamento', field_type: 'select', options: ['Tech', 'Sales', 'Ops', 'Marketing', 'RRHH', 'Finance'], created_at: '' },
  { id: 'sf-2', organization_id: 'mock-org', field_name: 'Ubicación', field_type: 'select', options: ['Madrid', 'Barcelona', 'Remoto', 'Valencia'], created_at: '' },
  { id: 'sf-3', organization_id: 'mock-org', field_name: 'Antigüedad', field_type: 'select', options: ['< 1 año', '1-3 años', '3-5 años', '> 5 años'], created_at: '' },
];

const MOCK_EMPLOYEES: EmployeeWithSegments[] = [
  { id: 'emp-1', organization_id: 'mock-org', email: 'ana.martinez@acme.com', full_name: 'Ana Martínez', is_active: true, invite_token: 'tok-1', created_at: '', segments: { Departamento: 'Tech', Ubicación: 'Madrid', Antigüedad: '3-5 años' } },
  { id: 'emp-2', organization_id: 'mock-org', email: 'carlos.lopez@acme.com', full_name: 'Carlos López', is_active: true, invite_token: 'tok-2', created_at: '', segments: { Departamento: 'Tech', Ubicación: 'Remoto', Antigüedad: '1-3 años' } },
  { id: 'emp-3', organization_id: 'mock-org', email: 'maria.garcia@acme.com', full_name: 'María García', is_active: true, invite_token: 'tok-3', created_at: '', segments: { Departamento: 'Sales', Ubicación: 'Barcelona', Antigüedad: '> 5 años' } },
  { id: 'emp-4', organization_id: 'mock-org', email: 'david.fernandez@acme.com', full_name: 'David Fernández', is_active: true, invite_token: 'tok-4', created_at: '', segments: { Departamento: 'Sales', Ubicación: 'Madrid', Antigüedad: '1-3 años' } },
  { id: 'emp-5', organization_id: 'mock-org', email: 'laura.sanchez@acme.com', full_name: 'Laura Sánchez', is_active: true, invite_token: 'tok-5', created_at: '', segments: { Departamento: 'Ops', Ubicación: 'Valencia', Antigüedad: '< 1 año' } },
  { id: 'emp-6', organization_id: 'mock-org', email: 'jorge.ruiz@acme.com', full_name: 'Jorge Ruiz', is_active: true, invite_token: 'tok-6', created_at: '', segments: { Departamento: 'Ops', Ubicación: 'Madrid', Antigüedad: '3-5 años' } },
  { id: 'emp-7', organization_id: 'mock-org', email: 'sofia.torres@acme.com', full_name: 'Sofía Torres', is_active: true, invite_token: 'tok-7', created_at: '', segments: { Departamento: 'Marketing', Ubicación: 'Barcelona', Antigüedad: '1-3 años' } },
  { id: 'emp-8', organization_id: 'mock-org', email: 'pedro.navarro@acme.com', full_name: 'Pedro Navarro', is_active: false, invite_token: 'tok-8', created_at: '', segments: { Departamento: 'Marketing', Ubicación: 'Remoto', Antigüedad: '> 5 años' } },
  { id: 'emp-9', organization_id: 'mock-org', email: 'elena.moreno@acme.com', full_name: 'Elena Moreno', is_active: true, invite_token: 'tok-9', created_at: '', segments: { Departamento: 'RRHH', Ubicación: 'Madrid', Antigüedad: '3-5 años' } },
  { id: 'emp-10', organization_id: 'mock-org', email: 'miguel.diaz@acme.com', full_name: 'Miguel Díaz', is_active: true, invite_token: 'tok-10', created_at: '', segments: { Departamento: 'Finance', Ubicación: 'Madrid', Antigüedad: '1-3 años' } },
];

// ─── Hook ───────────────────────────────────────────────

export function useEmployees() {
  const [employees, setEmployees] = useState<EmployeeWithSegments[]>([]);
  const [segmentFields, setSegmentFields] = useState<SegmentFieldWithOptions[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: EmployeeWithSegments[] = (data as unknown as Employee[]).map((e) => ({
          ...e,
          segments: {},
        }));
        setEmployees(mapped);
      } else {
        setEmployees(MOCK_EMPLOYEES);
      }
    } catch {
      setEmployees(MOCK_EMPLOYEES);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSegmentFields = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('segment_fields')
        .select('*')
        .order('field_name', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setSegmentFields(data as unknown as SegmentFieldWithOptions[]);
      } else {
        setSegmentFields(MOCK_SEGMENT_FIELDS);
      }
    } catch {
      setSegmentFields(MOCK_SEGMENT_FIELDS);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchSegmentFields();
  }, [fetchEmployees, fetchSegmentFields]);

  const addEmployee = useCallback(async (employee: { email: string; fullName: string; segments: Record<string, string> }) => {
    try {
      const { error } = await supabase
        .from('employees')
        .insert([{
          email: employee.email,
          full_name: employee.fullName,
          organization_id: 'current-org',
          is_active: true,
        }] as unknown as never[]);

      if (error) throw error;
      await fetchEmployees();
    } catch {
      // Mock add
      const newEmp: EmployeeWithSegments = {
        id: `emp-${Date.now()}`,
        organization_id: 'mock-org',
        email: employee.email,
        full_name: employee.fullName,
        is_active: true,
        invite_token: `tok-${Date.now()}`,
        created_at: new Date().toISOString(),
        segments: employee.segments,
      };
      setEmployees((prev) => [...prev, newEmp]);
    }
  }, [fetchEmployees]);

  const toggleEmployeeActive = useCallback(async (id: string) => {
    const emp = employees.find((e) => e.id === id);
    if (!emp) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({ is_active: !emp.is_active } as unknown as never)
        .eq('id', id);

      if (error) throw error;
      await fetchEmployees();
    } catch {
      setEmployees((prev) =>
        prev.map((e) => (e.id === id ? { ...e, is_active: !e.is_active } : e))
      );
    }
  }, [employees, fetchEmployees]);

  const updateOptionsInField = useCallback(async (fieldName: string, newOptions: string[]) => {
    try {
      const field = segmentFields.find(f => f.field_name.toLowerCase().includes(fieldName.toLowerCase()));
      if (field && field.id && !field.id.startsWith('sf-')) {
        const { error } = await supabase
          .from('segment_fields')
          .update({ options: newOptions } as unknown as never)
          .eq('id', field.id);
        if (error) throw error;
        await fetchSegmentFields();
        return;
      }
    } catch (e) {
      console.warn("Updating segment field in memory:", e);
    }

    setSegmentFields(prev => prev.map(f => {
      if (f.field_name.toLowerCase().includes(fieldName.toLowerCase())) {
        return { ...f, options: newOptions };
      }
      return f;
    }));
  }, [segmentFields, fetchSegmentFields]);

  const addOptionToField = useCallback(async (fieldName: string, option: string) => {
    const field = segmentFields.find(f => f.field_name.toLowerCase().includes(fieldName.toLowerCase()));
    const currentOptions = field?.options || [];
    if (!currentOptions.includes(option)) {
      await updateOptionsInField(fieldName, [...currentOptions, option]);
    }
  }, [segmentFields, updateOptionsInField]);

  const removeOptionFromField = useCallback(async (fieldName: string, option: string) => {
    const field = segmentFields.find(f => f.field_name.toLowerCase().includes(fieldName.toLowerCase()));
    const currentOptions = field?.options || [];
    await updateOptionsInField(fieldName, currentOptions.filter(o => o !== option));
  }, [segmentFields, updateOptionsInField]);

  return {
    employees,
    segmentFields,
    loading,
    fetchEmployees,
    addEmployee,
    toggleEmployeeActive,
    addSegmentField,
    updateOptionsInField,
    addOptionToField,
    removeOptionFromField,
    activeEmployees: employees.filter((e) => e.is_active),
  };
}
