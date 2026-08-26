import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useCampaigns } from './useCampaigns';
import { generateAIInsights } from '../lib/api';

// ─── Types ──────────────────────────────────────────────

export interface DashboardMetrics {
  globalScore: number;
  globalDelta: number;
  enps: number;
  enpsDelta: number;
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

export interface QuickAlert {
  type: 'critical' | 'warning';
  text: string;
  dimension?: string;
  department?: string;
  score?: number;
}

export interface SparklinePoint {
  label: string;
  value: number;
}

export interface QuestionRanking {
  questionId: string;
  text: string;
  dimension: string;
  avgScore: number;
  totalResponses: number;
  distribution: number[]; // counts for ratings 1-10
}

export interface HistoricalPoint {
  campaignTitle: string;
  globalScore: number;
  enps: number;
  participation: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  heatmap: HeatmapData[];
  departments: string[];
  heatmapLocation: HeatmapData[];
  locations: string[];
  insights: AIInsight[];
  // New fields for restructured views
  alerts: QuickAlert[];
  sparklines: {
    globalScore: SparklinePoint[];
    enps: SparklinePoint[];
    participation: SparklinePoint[];
    burnout: SparklinePoint[];
  };
  questionRanking: QuestionRanking[];
  historicalTrend: HistoricalPoint[];
  activeCampaign: { title: string; responded: number; total: number } | null;
}

// ─── Helpers ────────────────────────────────────────────

/** Compute basic metrics from a raw responses array */
function computeMetricsFromResponses(responses: any[]): {
  globalScore: number;
  enps: number;
  participationCount: number;
  burnoutRisk: number;
} {
  if (!responses || responses.length === 0) {
    return { globalScore: 0, enps: 0, participationCount: 0, burnoutRisk: 0 };
  }

  let totalRating = 0;
  let promoters = 0;
  let neutrals = 0;
  let detractors = 0;
  let wellbeingResponses = 0;
  let burnoutSignals = 0;

  const uniqueQuestionIds = new Set<string>();

  responses.forEach((r: any) => {
    const rating = r.rating;
    totalRating += rating;
    if (r.question_id) uniqueQuestionIds.add(r.question_id);

    if (rating >= 9) promoters++;
    else if (rating >= 7) neutrals++;
    else detractors++;

    if (r.questions?.dimension === 'Bienestar') {
      wellbeingResponses++;
      if (rating <= 5) burnoutSignals++;
    }
  });

  const total = responses.length;
  const globalScore = Number((totalRating / total).toFixed(1));
  const pctPromoters = Math.round((promoters / total) * 100);
  const pctDetractors = Math.round((detractors / total) * 100);
  const enps = pctPromoters - pctDetractors;
  const participationCount = uniqueQuestionIds.size > 0 ? Math.round(total / uniqueQuestionIds.size) : 0;
  const burnoutRisk = wellbeingResponses > 0 ? Math.round((burnoutSignals / wellbeingResponses) * 100) : 0;

  return { globalScore, enps, participationCount, burnoutRisk };
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

      // 2. Fetch responses for this campaign with question text + dimension
      const { data: responses, error: respError } = await supabase
        .from('responses')
        .select(`
          rating,
          department,
          location,
          question_id,
          questions ( text, dimension )
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

      const dimDeptStats: Record<string, Record<string, { sum: number, count: number }>> = {};
      const uniqueDepartments = new Set<string>();
      const dimLocStats: Record<string, Record<string, { sum: number, count: number }>> = {};
      const uniqueLocations = new Set<string>();
      const locationGlobalStats: Record<string, { sum: number, count: number }> = {};

      // Question-level tracking for ranking
      const questionStats: Record<string, { text: string; dimension: string; sum: number; count: number; distribution: number[] }> = {};

      responses.forEach((r: any) => {
        const rating = r.rating;
        const dept = r.department || 'General';
        const loc = r.location || 'Sede Central';
        const dimension = r.questions?.dimension || 'General';
        const questionText = r.questions?.text || '';
        const questionId = r.question_id || '';

        uniqueDepartments.add(dept);
        uniqueLocations.add(loc);
        totalRating += rating;

        if (rating >= 9) promoters++;
        else if (rating >= 7) neutrals++;
        else detractors++;

        // Department heatmap
        if (!dimDeptStats[dimension]) dimDeptStats[dimension] = {};
        if (!dimDeptStats[dimension][dept]) dimDeptStats[dimension][dept] = { sum: 0, count: 0 };
        dimDeptStats[dimension][dept].sum += rating;
        dimDeptStats[dimension][dept].count += 1;

        // Location heatmap
        if (!dimLocStats[dimension]) dimLocStats[dimension] = {};
        if (!dimLocStats[dimension][loc]) dimLocStats[dimension][loc] = { sum: 0, count: 0 };
        dimLocStats[dimension][loc].sum += rating;
        dimLocStats[dimension][loc].count += 1;

        if (!locationGlobalStats[loc]) locationGlobalStats[loc] = { sum: 0, count: 0 };
        locationGlobalStats[loc].sum += rating;
        locationGlobalStats[loc].count += 1;

        // Question ranking
        if (questionId) {
          if (!questionStats[questionId]) {
            questionStats[questionId] = { text: questionText, dimension, sum: 0, count: 0, distribution: new Array(10).fill(0) };
          }
          questionStats[questionId].sum += rating;
          questionStats[questionId].count += 1;
          if (rating >= 1 && rating <= 10) {
            questionStats[questionId].distribution[rating - 1] += 1;
          }
        }
      });

      const totalResponses = responses.length;
      const globalScore = Number((totalRating / totalResponses).toFixed(1));
      const pctPromoters = Math.round((promoters / totalResponses) * 100);
      const pctNeutrals = Math.round((neutrals / totalResponses) * 100);
      const pctDetractors = Math.round((detractors / totalResponses) * 100);
      const enps = pctPromoters - pctDetractors;

      const uniqueQuestionIds = new Set(responses.map((r: any) => r.question_id));
      const participationCount = uniqueQuestionIds.size > 0 ? Math.round(totalResponses / uniqueQuestionIds.size) : 0;

      let wellbeingResponses = 0;
      let burnoutSignals = 0;
      responses.forEach((r: any) => {
        if (r.questions?.dimension === 'Bienestar') {
          wellbeingResponses++;
          if (r.rating <= 5) burnoutSignals++;
        }
      });
      const burnoutRisk = wellbeingResponses > 0 ? Math.round((burnoutSignals / wellbeingResponses) * 100) : 0;

      // 4. Compute deltas vs previous campaign
      let globalDelta = 0;
      let enpsDelta = 0;
      let participationDelta = 0;
      let burnoutDelta = 0;

      const currentCampaignIndex = campaigns.findIndex(c => c.id === targetId);
      if (currentCampaignIndex >= 0 && currentCampaignIndex < campaigns.length - 1) {
        const prevCampaignId = campaigns[currentCampaignIndex + 1].id;
        const { data: prevResponses } = await supabase
          .from('responses')
          .select(`rating, question_id, questions ( dimension )`)
          .eq('campaign_id', prevCampaignId);

        if (prevResponses && prevResponses.length > 0) {
          const prev = computeMetricsFromResponses(prevResponses);
          globalDelta = Number((globalScore - prev.globalScore).toFixed(1));
          enpsDelta = enps - prev.enps;
          participationDelta = participationCount - prev.participationCount;
          burnoutDelta = burnoutRisk - prev.burnoutRisk;
        }
      }

      const metrics: DashboardMetrics = {
        globalScore,
        globalDelta,
        enps,
        enpsDelta,
        enpsPromoters: pctPromoters,
        enpsNeutral: pctNeutrals,
        enpsDetractors: pctDetractors,
        participationCount,
        participationDelta,
        burnoutRisk,
        burnoutDelta,
      };

      // 5. Construct Heatmaps
      const heatmap: HeatmapData[] = [];
      for (const [dimension, depts] of Object.entries(dimDeptStats)) {
        const scores: Record<string, number> = {};
        for (const [dept, stats] of Object.entries(depts)) {
          scores[dept] = Number((stats.sum / stats.count).toFixed(1));
        }
        heatmap.push({ dimension, scores });
      }

      let allLocations = Array.from(uniqueLocations);
      if (allLocations.length > 6) {
        allLocations.sort((a, b) => {
          const avgA = locationGlobalStats[a].sum / locationGlobalStats[a].count;
          const avgB = locationGlobalStats[b].sum / locationGlobalStats[b].count;
          return avgB - avgA;
        });
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

      // 6. Quick Alerts — worst dimensions and departments
      const alerts: QuickAlert[] = [];
      const dimensionAvgs = heatmap.map(h => {
        const vals = Object.values(h.scores);
        return { dimension: h.dimension, avg: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
      }).sort((a, b) => a.avg - b.avg);

      // Worst 2 dimensions
      dimensionAvgs.slice(0, 2).forEach(d => {
        if (d.avg < 8) {
          alerts.push({
            type: d.avg < 6 ? 'critical' : 'warning',
            text: `${d.dimension} tiene una puntuación promedio de ${d.avg.toFixed(1)}/10`,
            dimension: d.dimension,
            score: Number(d.avg.toFixed(1)),
          });
        }
      });

      // Worst department (by global avg across all dimensions)
      const deptAvgs: Record<string, { sum: number; count: number }> = {};
      heatmap.forEach(h => {
        for (const [dept, score] of Object.entries(h.scores)) {
          if (!deptAvgs[dept]) deptAvgs[dept] = { sum: 0, count: 0 };
          deptAvgs[dept].sum += score;
          deptAvgs[dept].count += 1;
        }
      });
      const worstDept = Object.entries(deptAvgs)
        .map(([dept, s]) => ({ dept, avg: s.sum / s.count }))
        .sort((a, b) => a.avg - b.avg)[0];

      if (worstDept && worstDept.avg < 8) {
        alerts.push({
          type: worstDept.avg < 6 ? 'critical' : 'warning',
          text: `${worstDept.dept} es el área con menor satisfacción global (${worstDept.avg.toFixed(1)}/10)`,
          department: worstDept.dept,
          score: Number(worstDept.avg.toFixed(1)),
        });
      }

      // 7. Sparklines — historical data from all campaigns
      const sparkGlobal: SparklinePoint[] = [];
      const sparkEnps: SparklinePoint[] = [];
      const sparkParticipation: SparklinePoint[] = [];
      const sparkBurnout: SparklinePoint[] = [];
      const historicalTrend: HistoricalPoint[] = [];

      // Iterate campaigns from oldest to newest (campaigns are desc by created_at)
      const orderedCampaigns = [...campaigns].reverse();
      for (const camp of orderedCampaigns) {
        if (camp.id === targetId) {
          // Use already-computed values for current campaign
          sparkGlobal.push({ label: camp.title, value: globalScore });
          sparkEnps.push({ label: camp.title, value: enps });
          sparkParticipation.push({ label: camp.title, value: participationCount });
          sparkBurnout.push({ label: camp.title, value: burnoutRisk });
          historicalTrend.push({ campaignTitle: camp.title, globalScore, enps, participation: participationCount });
        } else {
          // Fetch from DB for other campaigns
          const { data: campResp } = await supabase
            .from('responses')
            .select(`rating, question_id, questions ( dimension )`)
            .eq('campaign_id', camp.id);

          if (campResp && campResp.length > 0) {
            const m = computeMetricsFromResponses(campResp);
            sparkGlobal.push({ label: camp.title, value: m.globalScore });
            sparkEnps.push({ label: camp.title, value: m.enps });
            sparkParticipation.push({ label: camp.title, value: m.participationCount });
            sparkBurnout.push({ label: camp.title, value: m.burnoutRisk });
            historicalTrend.push({ campaignTitle: camp.title, globalScore: m.globalScore, enps: m.enps, participation: m.participationCount });
          }
        }
      }

      // 8. Question ranking
      const questionRanking: QuestionRanking[] = Object.entries(questionStats)
        .map(([qId, stats]) => ({
          questionId: qId,
          text: stats.text,
          dimension: stats.dimension,
          avgScore: Number((stats.sum / stats.count).toFixed(1)),
          totalResponses: stats.count,
          distribution: stats.distribution,
        }))
        .sort((a, b) => a.avgScore - b.avgScore); // Worst first for attention

      // 9. Active campaign info
      const activeCampaign = campaigns.find(c => c.status === 'active');
      let activeCampaignInfo: DashboardData['activeCampaign'] = null;
      if (activeCampaign) {
        const { count } = await supabase
          .from('responses')
          .select('question_id', { count: 'exact', head: true })
          .eq('campaign_id', activeCampaign.id);

        const { data: qData } = await supabase
          .from('questions')
          .select('id')
          .eq('campaign_id', activeCampaign.id);

        const numQuestions = qData?.length || 8;
        const responded = count ? Math.round(count / numQuestions) : 0;

        activeCampaignInfo = {
          title: activeCampaign.title,
          responded,
          total: 0, // We don't know the expected total without employee list
        };
      }

      // 10. Generate AI Insights
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
        alerts,
        sparklines: {
          globalScore: sparkGlobal,
          enps: sparkEnps,
          participation: sparkParticipation,
          burnout: sparkBurnout,
        },
        questionRanking,
        historicalTrend,
        activeCampaign: activeCampaignInfo,
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
