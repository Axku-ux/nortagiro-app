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
  participationCount: number;
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
  heatmapLocation: HeatmapData[];
  locations: string[];
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
          location,
          question_id,
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

      // Group for heatmap (Departments and Locations)
      const dimDeptStats: Record<string, Record<string, { sum: number, count: number }>> = {};
      const uniqueDepartments = new Set<string>();

      const dimLocStats: Record<string, Record<string, { sum: number, count: number }>> = {};
      const uniqueLocations = new Set<string>();
      
      // Keep track of global scores per location for sorting
      const locationGlobalStats: Record<string, { sum: number, count: number }> = {};

      responses.forEach((r: any) => {
        const rating = r.rating;
        const dept = r.department || 'General';
        const loc = r.location || 'Sede Central';
        const dimension = r.questions?.dimension || 'General';

        uniqueDepartments.add(dept);
        uniqueLocations.add(loc);
        totalRating += rating;

        if (rating >= 9) promoters++;
        else if (rating >= 7) neutrals++;
        else detractors++;

        // Department grouping
        if (!dimDeptStats[dimension]) dimDeptStats[dimension] = {};
        if (!dimDeptStats[dimension][dept]) dimDeptStats[dimension][dept] = { sum: 0, count: 0 };
        dimDeptStats[dimension][dept].sum += rating;
        dimDeptStats[dimension][dept].count += 1;

        // Location grouping
        if (!dimLocStats[dimension]) dimLocStats[dimension] = {};
        if (!dimLocStats[dimension][loc]) dimLocStats[dimension][loc] = { sum: 0, count: 0 };
        dimLocStats[dimension][loc].sum += rating;
        dimLocStats[dimension][loc].count += 1;

        // Location global tracking
        if (!locationGlobalStats[loc]) locationGlobalStats[loc] = { sum: 0, count: 0 };
        locationGlobalStats[loc].sum += rating;
        locationGlobalStats[loc].count += 1;
      });

      const totalResponses = responses.length;
      const globalScore = Number((totalRating / totalResponses).toFixed(1));
      
      const pctPromoters = Math.round((promoters / totalResponses) * 100);
      const pctNeutrals = Math.round((neutrals / totalResponses) * 100);
      const pctDetractors = Math.round((detractors / totalResponses) * 100);
      const enps = pctPromoters - pctDetractors;

      // Calculate participation count (total responses divided by number of unique questions)
      const uniqueQuestionIds = new Set(responses.map((r: any) => r.question_id));
      const participationCount = uniqueQuestionIds.size > 0 ? Math.round(totalResponses / uniqueQuestionIds.size) : 0;

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
        participationCount,
        participationDelta: 0,
        burnoutRisk,
        burnoutDelta: 0,
      };

      // 4. Construct Heatmaps
      const heatmap: HeatmapData[] = [];
      for (const [dimension, depts] of Object.entries(dimDeptStats)) {
        const scores: Record<string, number> = {};
        for (const [dept, stats] of Object.entries(depts)) {
          scores[dept] = Number((stats.sum / stats.count).toFixed(1));
        }
        heatmap.push({ dimension, scores });
      }

      // 4.1 Filter top 3 and bottom 3 locations by global score
      let allLocations = Array.from(uniqueLocations);
      if (allLocations.length > 6) {
        // Sort locations by their average global score descending
        allLocations.sort((a, b) => {
          const avgA = locationGlobalStats[a].sum / locationGlobalStats[a].count;
          const avgB = locationGlobalStats[b].sum / locationGlobalStats[b].count;
          return avgB - avgA;
        });
        
        // Take top 3 and bottom 3
        const top3 = allLocations.slice(0, 3);
        const bottom3 = allLocations.slice(-3);
        allLocations = [...top3, ...bottom3];
      }

      const heatmapLocation: HeatmapData[] = [];
      for (const [dimension, locs] of Object.entries(dimLocStats)) {
        const scores: Record<string, number> = {};
        for (const loc of allLocations) {
          if (locs[loc]) {
            scores[loc] = Number((locs[loc].sum / locs[loc].count).toFixed(1));
          }
        }
        heatmapLocation.push({ dimension, scores });
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
        heatmapLocation,
        locations: allLocations,
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
