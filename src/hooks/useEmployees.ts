import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Employee, SegmentField } from '../lib/database.types';

// ─── Types ──────────────────────────────────────────────

export interface EmployeeWithSegments extends Employee {
  segments: Record<string, string>; // field_name -> value
}

export interface SegmentFieldWithOptions extends SegmentField {}

// ─── Helpers ────────────────────────────────────────────

export function getDepartmentOptions(segmentFields: SegmentFieldWithOptions[]): string[] {
  const safeFields = Array.isArray(segmentFields) ? segmentFields : [];
  const field = safeFields.find(f => 
    f?.field_name && (
      f.field_name.toLowerCase().includes('departamento') ||
      f.field_name.toLowerCase().includes('sección') ||
      f.field_name.toLowerCase().includes('area') ||
      f.field_name.toLowerCase().includes('equipo')
    )
  );
  if (field && Array.isArray(field.options) && field.options.length > 0) {
    return field.options;
  }
  return [];
}

export function getLocationOptions(segmentFields: SegmentFieldWithOptions[]): string[] {
  const safeFields = Array.isArray(segmentFields) ? segmentFields : [];
  const field = safeFields.find(f => 
    f?.field_name && (
      f.field_name.toLowerCase().includes('ubicación') ||
      f.field_name.toLowerCase().includes('location') ||
      f.field_name.toLowerCase().includes('zona') ||
      f.field_name.toLowerCase().includes('territorio') ||
      f.field_name.toLowerCase().includes('sede')
    )
  );
  if (field && Array.isArray(field.options) && field.options.length > 0) {
    return field.options;
  }
  return [];
}

import { useAuth } from '../contexts/AuthContext';

// ─── Hook ───────────────────────────────────────────────

export function useEmployees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<EmployeeWithSegments[]>([]);
  const [segmentFields, setSegmentFields] = useState<SegmentFieldWithOptions[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    if (!user?.organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;

      if (data) {
        const mapped: EmployeeWithSegments[] = (data as unknown as Employee[]).map((e) => ({
          ...e,
          segments: {},
        }));
        setEmployees(mapped);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.organizationId]);

  const fetchSegmentFields = useCallback(async () => {
    if (!user?.organizationId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('segment_fields')
        .select('*')
        .order('field_name', { ascending: true });

      if (error) throw error;

      if (data) {
        const validFields = (data as unknown as SegmentFieldWithOptions[]).map(f => ({
          ...f,
          options: Array.isArray(f.options) ? f.options : []
        }));
        setSegmentFields(validFields);
      }
    } catch (error) {
      console.error('Error fetching segment fields:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.organizationId]);

  useEffect(() => {
    fetchEmployees();
    fetchSegmentFields();
  }, [fetchEmployees, fetchSegmentFields]);

  const addEmployee = useCallback(async (employee: { email: string; fullName: string; segments: Record<string, string> }) => {
    if (!user?.organizationId) return;
    try {
      const { error } = await supabase
        .from('employees')
        .insert([{
          email: employee.email,
          full_name: employee.fullName,
          organization_id: user.organizationId,
          is_active: true,
        }] as unknown as never[]);

      if (error) throw error;
      await fetchEmployees();
    } catch (error) {
      console.error('Error adding employee:', error);
      throw error;
    }
  }, [fetchEmployees, user?.organizationId]);

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
    } catch (error) {
      console.error('Error toggling employee status:', error);
      throw error;
    }
  }, [employees, fetchEmployees]);

  const updateOptionsInField = useCallback(async (fieldName: string, newOptions: string[]) => {
    try {
      const field = segmentFields.find(f => f?.field_name && f.field_name.toLowerCase().includes(fieldName.toLowerCase()));
      if (field && field.id) {
        const { error } = await supabase
          .from('segment_fields')
          .update({ options: newOptions } as unknown as never)
          .eq('id', field.id);
        if (error) throw error;
        await fetchSegmentFields();
      } else {
        if (!user?.organizationId) return;
        const { error } = await supabase
          .from('segment_fields')
          .insert([{
            field_name: fieldName,
            field_type: 'select',
            options: newOptions,
            organization_id: user.organizationId,
          }] as unknown as never[]);
        if (error) throw error;
        await fetchSegmentFields();
      }
    } catch (error) {
      console.error('Error updating segment field options:', error);
      throw error;
    }
  }, [segmentFields, fetchSegmentFields, user?.organizationId]);

  const addOptionToField = useCallback(async (fieldName: string, option: string) => {
    const field = segmentFields.find(f => f?.field_name && f.field_name.toLowerCase().includes(fieldName.toLowerCase()));
    const currentOptions = field?.options || [];
    if (!currentOptions.includes(option)) {
      await updateOptionsInField(fieldName, [...currentOptions, option]);
    }
  }, [segmentFields, updateOptionsInField]);

  const addSegmentField = useCallback(async (fieldName: string, options: string[]) => {
    if (!user?.organizationId) return;
    try {
      const { error } = await supabase
        .from('segment_fields')
        .insert([{
          field_name: fieldName,
          field_type: 'select',
          options,
          organization_id: user.organizationId,
        }] as unknown as never[]);

      if (error) throw error;
      await fetchSegmentFields();
    } catch (error) {
      console.error('Error adding segment field:', error);
      throw error;
    }
  }, [fetchSegmentFields, user?.organizationId]);

  const removeOptionFromField = useCallback(async (fieldName: string, option: string) => {
    const field = segmentFields.find(f => f?.field_name && f.field_name.toLowerCase().includes(fieldName.toLowerCase()));
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
