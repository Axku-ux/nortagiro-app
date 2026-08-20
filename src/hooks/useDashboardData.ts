import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCampaigns } from './useCampaigns';
import { generateAIInsights } from '../lib/api';

// ─── Types ──────────────────────────────────────────────

export interface DashboardMetrics {
  globalScore: number;
  globalDelta: number;
  enps: number;
  enpsPromoters: number;
  enpsNeutral: number;
  enpsDetractors: number;
  participationRate: number;
  participationDelta: number;
  burnoutRisk: number;
  burnoutDelta: number;
}

export interface HeatmapData {
  dimension: string;
  scores: Record<string, number>; // e.g. { 'Tech': 8.5, 'Sales': 7.2 }
}

export interface AIInsight {
  id: string;
  type: 'alert' | 'opportunity' | 'praise';
  title: string;
  description: string;
  metric?: string;
  department?: string;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  heatmap: HeatmapData[];
  departments: string[];
  insights: AIInsight[];
}

// ─── Mock Data (Premium Design fallback) ────────────────

const MOCK_DATA: DashboardData = {
  metrics: {
    globalScore: 8.4,
    globalDelta: 0.3,
    enps: 42,
    enpsPromoters: 55,
    enpsNeutral: 32,
    enpsDetractors: 13,
    participationRate: 87,
    participationDelta: 2,
    burnoutRisk: 14,
    burnoutDelta: -2,
  },
  departments: ['Tech', 'Sales', 'Ops', 'Marketing'],
  heatmap: [
    { dimension: 'Liderazgo', scores: { 'Tech': 8.2, 'Sales': 7.9, 'Ops': 6.5, 'Marketing': 8.8 } },
    { dimension: 'Crecimiento', scores: { 'Tech': 7.5, 'Sales': 8.1, 'Ops': 5.8, 'Marketing': 7.2 } },
    { dimension: 'Reconocimiento', scores: { 'Tech': 8.8, 'Sales': 9.2, 'Ops': 7.1, 'Marketing': 8.5 } },
    { dimension: 'Bienestar', scores: { 'Tech': 6.4, 'Sales': 7.5, 'Ops': 5.2, 'Marketing': 7.8 } },
  ],
  insights: [
    {
      id: 'ins-1',
      type: 'alert',
      title: 'Riesgo de fuga en Operaciones',
      description: 'Las puntuaciones de Bienestar y Crecimiento en el equipo de Ops han caído por debajo de 6.0.',
      department: 'Ops',
    },
    {
      id: 'ins-2',
      type: 'opportunity',
      title: 'Mejorar el balance en Tech',
      description: 'El equipo de tecnología reporta alta carga de trabajo. Oportunidad para revisar las estimaciones de sprints.',
      department: 'Tech',
    },
    {
      id: 'ins-3',
      type: 'praise',
      title: 'Reconocimiento excepcional en Ventas',
      description: 'Ventas lidera el índice de reconocimiento con un 9.2. El nuevo programa de incentivos está funcionando.',
      department: 'Sales',
    },
  ]
};

// ─── Hook ───────────────────────────────────────────────

export function useDashboardData(campaignId?: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { campaigns } = useCampaigns();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Determine which campaign to load
      // If no ID is passed, pick the most recently closed or active one.
      let targetId = campaignId;
      if (!targetId && campaigns.length > 0) {
        targetId = campaigns[0].id; // using the most recent one since useCampaigns orders by created_at desc
      }

      if (!targetId) {
        // No campaigns exist yet
        setData(null);
        return;
      }

      // 2. Fetch from campaign_stats view
      const { data: statsData, error: statsError } = await supabase
        .from('campaign_stats')
        .select('*')
        .eq('campaign_id', targetId)
        .single();

      if (statsError) {
        // If the view fails or is empty, use mock data for demo purposes
        setData(MOCK_DATA);
        return;
      }

      // In a real implementation with real responses, we would map `statsData` here.
      // For this MVP, we use MOCK_DATA as the base, but we dynamically generate
      // the AI Insights using the real Gemini integration!
      
      let dynamicData = { ...MOCK_DATA };
      
      try {
        const aiResponse = await generateAIInsights(MOCK_DATA.heatmap, MOCK_DATA.metrics);
        if (aiResponse.success && aiResponse.insights) {
          dynamicData.insights = aiResponse.insights;
        }
      } catch (aiError) {
        console.error('Failed to generate dynamic AI insights, falling back to static:', aiError);
      }
      
      setData(dynamicData);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setData(MOCK_DATA); // Always fallback to mock in demo
    } finally {
      setLoading(false);
    }
  }, [campaignId, campaigns]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}
