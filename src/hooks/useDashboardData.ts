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

// ─── Hook ───────────────────────────────────────────────

export function useDashboardData(campaignId?: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { campaigns } = useCampaigns();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Determine which campaign to load
      let targetId = campaignId;
      if (!targetId && campaigns.length > 0) {
        targetId = campaigns[0].id;
      }

      if (!targetId) {
        setData(null);
        return;
      }

      // 2. Fetch responses for this campaign with question dimensions
      const { data: responses, error: respError } = await supabase
        .from('responses')
        .select(`
          rating,
          department,
          questions ( dimension )
        `)
        .eq('campaign_id', targetId);

      if (respError) throw respError;

      if (!responses || responses.length === 0) {
        setData(null);
        return;
      }

      // 3. Compute Metrics
      let totalRating = 0;
      let promoters = 0;
      let neutrals = 0;
      let detractors = 0;

      // Group for heatmap
      // Map: dimension -> { department: { sum, count } }
      const dimDeptStats: Record<string, Record<string, { sum: number, count: number }>> = {};
      const uniqueDepartments = new Set<string>();

      responses.forEach((r: any) => {
        const rating = r.rating;
        const dept = r.department || 'General';
        const dimension = r.questions?.dimension || 'General';

        uniqueDepartments.add(dept);
        totalRating += rating;

        if (rating >= 9) promoters++;
        else if (rating >= 7) neutrals++;
        else detractors++;

        if (!dimDeptStats[dimension]) dimDeptStats[dimension] = {};
        if (!dimDeptStats[dimension][dept]) dimDeptStats[dimension][dept] = { sum: 0, count: 0 };
        
        dimDeptStats[dimension][dept].sum += rating;
        dimDeptStats[dimension][dept].count += 1;
      });

      const totalResponses = responses.length;
      const globalScore = Number((totalRating / totalResponses).toFixed(1));
      
      const pctPromoters = Math.round((promoters / totalResponses) * 100);
      const pctNeutrals = Math.round((neutrals / totalResponses) * 100);
      const pctDetractors = Math.round((detractors / totalResponses) * 100);
      const enps = pctPromoters - pctDetractors;

      // Calculate Burnout Risk: percentage of responses in "Bienestar" that are <= 5
      let wellbeingResponses = 0;
      let burnoutSignals = 0;
      responses.forEach((r: any) => {
        if (r.questions?.dimension === 'Bienestar') {
          wellbeingResponses++;
          if (r.rating <= 5) burnoutSignals++;
        }
      });
      const burnoutRisk = wellbeingResponses > 0 ? Math.round((burnoutSignals / wellbeingResponses) * 100) : 0;

      const metrics: DashboardMetrics = {
        globalScore,
        globalDelta: 0, // Mocked delta for now
        enps,
        enpsPromoters: pctPromoters,
        enpsNeutral: pctNeutrals,
        enpsDetractors: pctDetractors,
        participationRate: 100, // Hard to calculate without known denominators
        participationDelta: 0,
        burnoutRisk,
        burnoutDelta: 0,
      };

      // 4. Construct Heatmap
      const heatmap: HeatmapData[] = [];
      for (const [dimension, depts] of Object.entries(dimDeptStats)) {
        const scores: Record<string, number> = {};
        for (const [dept, stats] of Object.entries(depts)) {
          scores[dept] = Number((stats.sum / stats.count).toFixed(1));
        }
        heatmap.push({ dimension, scores });
      }

      // 5. Generate AI Insights
      let insights: AIInsight[] = [];
      try {
        const aiResponse = await generateAIInsights(heatmap, metrics);
        if (aiResponse.success && aiResponse.insights) {
          insights = aiResponse.insights;
        }
      } catch (aiError) {
        console.error('Failed to generate dynamic AI insights:', aiError);
      }

      setData({
        metrics,
        heatmap,
        departments: Array.from(uniqueDepartments),
        insights,
      });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [campaignId, campaigns]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}
