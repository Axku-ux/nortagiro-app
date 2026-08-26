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
  actionRecommendation?: string;
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
  campaignId: string;
  campaignTitle: string;
  periodLabel: string;
  globalScore: number;
  enps: number;
  participation: number;
  burnoutRisk: number;
  dimensions: Record<string, number>;
}

export interface QuestionComparison {
  questionId: string;
  text: string;
  dimension: string;
  currentScore: number;
  previousScore: number | null;
  delta: number | null;
  status: 'improved' | 'declined' | 'stable' | 'new';
  currentDistribution: number[];
  totalResponses: number;
}

export interface DimensionComparison {
  dimension: string;
  currentScore: number;
  previousScore: number | null;
  delta: number | null;
  status: 'improved' | 'declined' | 'stable';
}

export interface ActionImpactSummary {
  improvedDimensionsCount: number;
  declinedDimensionsCount: number;
  stableDimensionsCount: number;
  topPositiveDimension: string | null;
  topPositiveDelta: number;
  topConcernDimension: string | null;
  topConcernDelta: number;
  diagnosisText: string;
}

export interface CampaignSeriesGroup {
  seriesId: string;
  seriesName: string;
  campaigns: { id: string; title: string; periodLabel: string; createdAt: string }[];
}

export interface DashboardData {
  hasResponses: boolean;
  currentCampaignId: string;
  metrics: DashboardMetrics;
  heatmap: HeatmapData[];
  departments: string[];
  heatmapLocation: HeatmapData[];
  locations: string[];
  insights: AIInsight[];
  executiveSummary: string;
  aiConfidence: number;
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
  
  // Longitudinal Series & Comparison
  allSeries: CampaignSeriesGroup[];
  currentSeriesId: string;
  questionComparisons: QuestionComparison[];
  dimensionComparisons: DimensionComparison[];
  actionImpactSummary: ActionImpactSummary;
  comparisonCampaignTitle: string | null;
}

// ─── Helpers ────────────────────────────────────────────

/** Compute basic metrics and question/dimension maps from raw responses */
function analyzeResponses(responses: any[]): {
  globalScore: number;
  enps: number;
  pctPromoters: number;
  pctNeutrals: number;
  pctDetractors: number;
  participationCount: number;
  burnoutRisk: number;
  dimensionAvgs: Record<string, number>;
  questionAvgs: Record<string, { text: string; dimension: string; avg: number; count: number; distribution: number[] }>;
} {
  if (!responses || responses.length === 0) {
    return {
      globalScore: 0,
      enps: 0,
      pctPromoters: 0,
      pctNeutrals: 0,
      pctDetractors: 0,
      participationCount: 0,
      burnoutRisk: 0,
      dimensionAvgs: {},
      questionAvgs: {},
    };
  }

  let totalRating = 0;
  let promoters = 0;
  let neutrals = 0;
  let detractors = 0;
  let wellbeingResponses = 0;
  let burnoutSignals = 0;

  const uniqueQuestionIds = new Set<string>();
  const dimStats: Record<string, { sum: number; count: number }> = {};
  const qStats: Record<string, { text: string; dimension: string; sum: number; count: number; distribution: number[] }> = {};

  responses.forEach((r: any) => {
    const rating = r.rating;
    totalRating += rating;
    if (r.question_id) uniqueQuestionIds.add(r.question_id);

    if (rating >= 9) promoters++;
    else if (rating >= 7) neutrals++;
    else detractors++;

    const dim = r.questions?.dimension || 'General';
    const text = r.questions?.text || '';
    const qId = r.question_id || text;

    if (!dimStats[dim]) dimStats[dim] = { sum: 0, count: 0 };
    dimStats[dim].sum += rating;
    dimStats[dim].count += 1;

    if (qId) {
      if (!qStats[qId]) {
        qStats[qId] = { text, dimension: dim, sum: 0, count: 0, distribution: new Array(10).fill(0) };
      }
      qStats[qId].sum += rating;
      qStats[qId].count += 1;
      if (rating >= 1 && rating <= 10) {
        qStats[qId].distribution[rating - 1] += 1;
      }
    }

    if (dim === 'Bienestar') {
      wellbeingResponses++;
      if (rating <= 5) burnoutSignals++;
    }
  });

  const total = responses.length;
  const globalScore = Number((totalRating / total).toFixed(1));
  const pctPromoters = Math.round((promoters / total) * 100);
  const pctNeutrals = Math.round((neutrals / total) * 100);
  const pctDetractors = Math.round((detractors / total) * 100);
  const enps = pctPromoters - pctDetractors;
  const participationCount = uniqueQuestionIds.size > 0 ? Math.round(total / uniqueQuestionIds.size) : 0;
  const burnoutRisk = wellbeingResponses > 0 ? Math.round((burnoutSignals / wellbeingResponses) * 100) : 0;

  const dimensionAvgs: Record<string, number> = {};
  for (const [d, s] of Object.entries(dimStats)) {
    dimensionAvgs[d] = Number((s.sum / s.count).toFixed(1));
  }

  const questionAvgs: Record<string, { text: string; dimension: string; avg: number; count: number; distribution: number[] }> = {};
  for (const [qId, q] of Object.entries(qStats)) {
    questionAvgs[qId] = {
      text: q.text,
      dimension: q.dimension,
      avg: Number((q.sum / q.count).toFixed(1)),
      count: q.count,
      distribution: q.distribution,
    };
  }

  return {
    globalScore,
    enps,
    pctPromoters,
    pctNeutrals,
    pctDetractors,
    participationCount,
    burnoutRisk,
    dimensionAvgs,
    questionAvgs,
  };
}

// ─── Hook ───────────────────────────────────────────────

export function useDashboardData(campaignId?: string, compareCampaignId?: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { campaigns } = useCampaigns();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (campaigns.length === 0) {
        setData(null);
        return;
      }

      // 1. Check which campaigns have responses to set smart default
      const { data: responseRows } = await supabase
        .from('responses')
        .select('campaign_id');

      const campaignsWithResponses = new Set((responseRows || []).map((r: any) => r.campaign_id));

      let targetId = campaignId;
      if (!targetId || !campaigns.some(c => c.id === targetId)) {
        // Pick the most recent campaign that has responses, or fallback to the first
        const firstWithResponses = campaigns.find(c => campaignsWithResponses.has(c.id));
        targetId = firstWithResponses ? firstWithResponses.id : campaigns[0].id;
      }

      const currentCampaign = campaigns.find(c => c.id === targetId)!;

      // 2. Fetch all campaign questions to group campaigns into Series
      const { data: allQuestionsData } = await supabase
        .from('questions')
        .select('id, campaign_id, text, dimension, order_index')
        .order('order_index', { ascending: true });

      // Group questions by campaign
      const questionsByCampaign: Record<string, { text: string; dimension: string }[]> = {};
      (allQuestionsData || []).forEach((q: any) => {
        if (!questionsByCampaign[q.campaign_id]) questionsByCampaign[q.campaign_id] = [];
        questionsByCampaign[q.campaign_id].push({ text: q.text, dimension: q.dimension });
      });

      // Group campaigns into Programs / Series
      const seriesMap: Record<string, CampaignSeriesGroup> = {};
      campaigns.forEach(c => {
        const progName = c.programName || 'Clima Organizacional 360';
        const seriesKey = progName.toLowerCase().trim();
        if (!seriesMap[seriesKey]) {
          seriesMap[seriesKey] = {
            seriesId: seriesKey,
            seriesName: progName,
            campaigns: [],
          };
        }
        seriesMap[seriesKey].campaigns.push({
          id: c.id,
          title: c.title,
          periodLabel: c.period_label || c.title,
          createdAt: c.created_at,
        });
      });

      const allSeries = Object.values(seriesMap);
      const currentProgramName = (currentCampaign.programName || 'Clima Organizacional 360').toLowerCase().trim();
      const currentSeriesGroup = seriesMap[currentProgramName] || allSeries[0];
      const seriesCampaigns = currentSeriesGroup ? currentSeriesGroup.campaigns : campaigns;

      // 3. Fetch responses for target campaign
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
        setData({
          hasResponses: false,
          currentCampaignId: targetId,
          metrics: {
            globalScore: 0,
            globalDelta: null,
            enps: 0,
            enpsDelta: null,
            pctPromoters: 0,
            pctNeutrals: 0,
            pctDetractors: 0,
            participationCount: 0,
            participationDelta: null,
            burnoutRisk: 0,
            burnoutDelta: null,
          },
          heatmap: [],
          departments: [],
          heatmapLocation: [],
          locations: [],
          insights: [],
          executiveSummary: 'Esta campaña aún no cuenta con respuestas registradas.',
          aiConfidence: 0,
          alerts: [],
          sparklines: {
            globalScore: [],
            enps: [],
            participation: [],
            burnout: [],
          },
          questionRanking: [],
          historicalTrend: [],
          activeCampaign: null,
          allSeries,
          currentSeriesId: currentProgramName,
          questionComparisons: [],
          dimensionComparisons: [],
          actionImpactSummary: {
            improvedDimensionsCount: 0,
            declinedDimensionsCount: 0,
            stableDimensionsCount: 0,
            topPositiveDimension: null,
            topPositiveDelta: 0,
            topConcernDimension: null,
            topConcernDelta: 0,
            diagnosisText: 'Sin datos previos para comparar.',
          },
          comparisonCampaignTitle: null,
        });
        return;
      }

      // 4. Compute current campaign stats
      const currentAnalysis = analyzeResponses(responses);

      // Department & Location heatmaps
      const dimDeptStats: Record<string, Record<string, { sum: number, count: number }>> = {};
      const uniqueDepartments = new Set<string>();
      const dimLocStats: Record<string, Record<string, { sum: number, count: number }>> = {};
      const uniqueLocations = new Set<string>();
      const locationGlobalStats: Record<string, { sum: number, count: number }> = {};

      responses.forEach((r: any) => {
        const rating = r.rating;
        const dept = r.department || 'General';
        const loc = r.location || 'Sede Central';
        const dimension = r.questions?.dimension || 'General';

        uniqueDepartments.add(dept);
        uniqueLocations.add(loc);

        if (!dimDeptStats[dimension]) dimDeptStats[dimension] = {};
        if (!dimDeptStats[dimension][dept]) dimDeptStats[dimension][dept] = { sum: 0, count: 0 };
        dimDeptStats[dimension][dept].sum += rating;
        dimDeptStats[dimension][dept].count += 1;

        if (!dimLocStats[dimension]) dimLocStats[dimension] = {};
        if (!dimLocStats[dimension][loc]) dimLocStats[dimension][loc] = { sum: 0, count: 0 };
        dimLocStats[dimension][loc].sum += rating;
        dimLocStats[dimension][loc].count += 1;

        if (!locationGlobalStats[loc]) locationGlobalStats[loc] = { sum: 0, count: 0 };
        locationGlobalStats[loc].sum += rating;
        locationGlobalStats[loc].count += 1;
      });

      // Construct Heatmaps
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

      // 5. Determine comparison campaign (within same series if possible)
      let compId = compareCampaignId;
      if (!compId) {
        // Find previous campaign in the same series
        const seriesIdx = seriesCampaigns.findIndex(c => c.id === targetId);
        if (seriesIdx >= 0 && seriesIdx < seriesCampaigns.length - 1) {
          compId = seriesCampaigns[seriesIdx + 1].id;
        } else if (campaigns.length > 1) {
          const generalIdx = campaigns.findIndex(c => c.id === targetId);
          if (generalIdx >= 0 && generalIdx < campaigns.length - 1) {
            compId = campaigns[generalIdx + 1].id;
          }
        }
      }

      let compAnalysis: ReturnType<typeof analyzeResponses> | null = null;
      let compCampaignTitle: string | null = null;

      if (compId && compId !== targetId) {
        const compCampObj = campaigns.find(c => c.id === compId);
        if (compCampObj) compCampaignTitle = compCampObj.title;

        const { data: compResponses } = await supabase
          .from('responses')
          .select(`
            rating,
            question_id,
            questions ( text, dimension )
          `)
          .eq('campaign_id', compId);

        if (compResponses && compResponses.length > 0) {
          compAnalysis = analyzeResponses(compResponses);
        }
      }

      // 6. Compute deltas vs comparison campaign
      const globalDelta = compAnalysis ? Number((currentAnalysis.globalScore - compAnalysis.globalScore).toFixed(1)) : 0;
      const enpsDelta = compAnalysis ? currentAnalysis.enps - compAnalysis.enps : 0;
      const participationDelta = compAnalysis ? currentAnalysis.participationCount - compAnalysis.participationCount : 0;
      const burnoutDelta = compAnalysis ? currentAnalysis.burnoutRisk - compAnalysis.burnoutRisk : 0;

      const metrics: DashboardMetrics = {
        globalScore: currentAnalysis.globalScore,
        globalDelta,
        enps: currentAnalysis.enps,
        enpsDelta,
        enpsPromoters: currentAnalysis.pctPromoters,
        enpsNeutral: currentAnalysis.pctNeutrals,
        enpsDetractors: currentAnalysis.pctDetractors,
        participationCount: currentAnalysis.participationCount,
        participationDelta,
        burnoutRisk: currentAnalysis.burnoutRisk,
        burnoutDelta,
      };

      // 7. Question-by-Question Comparison
      const questionComparisons: QuestionComparison[] = [];
      const questionRanking: QuestionRanking[] = [];

      for (const [qId, qInfo] of Object.entries(currentAnalysis.questionAvgs)) {
        // Find in compAnalysis by matching text
        let prevScore: number | null = null;
        if (compAnalysis) {
          const match = Object.values(compAnalysis.questionAvgs).find(
            cq => cq.text.trim().toLowerCase() === qInfo.text.trim().toLowerCase()
          );
          if (match) {
            prevScore = match.avg;
          }
        }

        const delta = prevScore !== null ? Number((qInfo.avg - prevScore).toFixed(1)) : null;
        let status: QuestionComparison['status'] = 'new';
        if (delta !== null) {
          if (delta >= 0.3) status = 'improved';
          else if (delta <= -0.3) status = 'declined';
          else status = 'stable';
        }

        questionComparisons.push({
          questionId: qId,
          text: qInfo.text,
          dimension: qInfo.dimension,
          currentScore: qInfo.avg,
          previousScore: prevScore,
          delta,
          status,
          currentDistribution: qInfo.distribution,
          totalResponses: qInfo.count,
        });

        questionRanking.push({
          questionId: qId,
          text: qInfo.text,
          dimension: qInfo.dimension,
          avgScore: qInfo.avg,
          totalResponses: qInfo.count,
          distribution: qInfo.distribution,
        });
      }

      // Sort question rankings (worst first)
      questionRanking.sort((a, b) => a.avgScore - b.avgScore);
      // Sort question comparisons by delta (worst delta first to see concerns, or best first)
      questionComparisons.sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0));

      // 8. Dimension-by-Dimension Comparison
      const dimensionComparisons: DimensionComparison[] = [];
      let improvedCount = 0;
      let declinedCount = 0;
      let stableCount = 0;
      let topPosDim: string | null = null;
      let topPosDelta = -999;
      let topNegDim: string | null = null;
      let topNegDelta = 999;

      for (const [dim, score] of Object.entries(currentAnalysis.dimensionAvgs)) {
        const prevScore = compAnalysis ? (compAnalysis.dimensionAvgs[dim] ?? null) : null;
        const delta = prevScore !== null ? Number((score - prevScore).toFixed(1)) : null;
        let status: DimensionComparison['status'] = 'stable';

        if (delta !== null) {
          if (delta >= 0.2) {
            status = 'improved';
            improvedCount++;
            if (delta > topPosDelta) {
              topPosDelta = delta;
              topPosDim = dim;
            }
          } else if (delta <= -0.2) {
            status = 'declined';
            declinedCount++;
            if (delta < topNegDelta) {
              topNegDelta = delta;
              topNegDim = dim;
            }
          } else {
            status = 'stable';
            stableCount++;
          }
        }

        dimensionComparisons.push({
          dimension: dim,
          currentScore: score,
          previousScore: prevScore,
          delta,
          status,
        });
      }

      // Action Impact Summary diagnosis text
      let diagnosisText = 'No hay suficientes ediciones previas para evaluar la repercusión de las medidas.';
      if (compAnalysis) {
        if (improvedCount > declinedCount) {
          diagnosisText = `Efecto positivo detectado: ${improvedCount} de ${dimensionComparisons.length} dimensiones muestran una mejora respecto a la edición anterior.`;
          if (topPosDim) {
            diagnosisText += ` La mayor repercusión se observa en ${topPosDim} (+${topPosDelta}).`;
          }
        } else if (declinedCount > improvedCount) {
          diagnosisText = `Alerta de seguimiento: ${declinedCount} dimensiones han retrocedido respecto a la edición anterior.`;
          if (topNegDim) {
            diagnosisText += ` Se recomienda revisar los planes de acción en ${topNegDim} (${topNegDelta}).`;
          }
        } else {
          diagnosisText = `Resultados estables: la percepción general se mantiene alineada con la edición anterior (${stableCount} dimensiones sin cambios significativos).`;
        }
      }

      const actionImpactSummary: ActionImpactSummary = {
        improvedDimensionsCount: improvedCount,
        declinedDimensionsCount: declinedCount,
        stableDimensionsCount: stableCount,
        topPositiveDimension: topPosDim,
        topPositiveDelta: topPosDelta === -999 ? 0 : topPosDelta,
        topConcernDimension: topNegDim,
        topConcernDelta: topNegDelta === 999 ? 0 : topNegDelta,
        diagnosisText,
      };

      // 9. Multi-wave Historical Trend (only for this series)
      const historicalTrend: HistoricalPoint[] = [];
      const orderedSeriesCampaigns = [...seriesCampaigns].reverse();

      for (const sc of orderedSeriesCampaigns) {
        if (sc.id === targetId) {
          historicalTrend.push({
            campaignId: sc.id,
            campaignTitle: sc.title,
            periodLabel: sc.periodLabel,
            globalScore: currentAnalysis.globalScore,
            enps: currentAnalysis.enps,
            participation: currentAnalysis.participationCount,
            burnoutRisk: currentAnalysis.burnoutRisk,
            dimensions: currentAnalysis.dimensionAvgs,
          });
        } else {
          const { data: scResp } = await supabase
            .from('responses')
            .select(`rating, question_id, questions ( text, dimension )`)
            .eq('campaign_id', sc.id);

          if (scResp && scResp.length > 0) {
            const a = analyzeResponses(scResp);
            historicalTrend.push({
              campaignId: sc.id,
              campaignTitle: sc.title,
              periodLabel: sc.periodLabel,
              globalScore: a.globalScore,
              enps: a.enps,
              participation: a.participationCount,
              burnoutRisk: a.burnoutRisk,
              dimensions: a.dimensionAvgs,
            });
          }
        }
      }

      // 10. Quick Alerts for Dashboard
      const alerts: QuickAlert[] = [];
      const dimensionAvgsList = heatmap.map(h => {
        const vals = Object.values(h.scores);
        return { dimension: h.dimension, avg: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
      }).sort((a, b) => a.avg - b.avg);

      dimensionAvgsList.slice(0, 2).forEach(d => {
        if (d.avg < 8) {
          alerts.push({
            type: d.avg < 6 ? 'critical' : 'warning',
            text: `${d.dimension} tiene una puntuación promedio de ${d.avg.toFixed(1)}/10`,
            dimension: d.dimension,
            score: Number(d.avg.toFixed(1)),
          });
        }
      });

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

      // Sparklines across historical points
      const sparkGlobal: SparklinePoint[] = historicalTrend.map(p => ({ label: p.periodLabel, value: p.globalScore }));
      const sparkEnps: SparklinePoint[] = historicalTrend.map(p => ({ label: p.periodLabel, value: p.enps }));
      const sparkParticipation: SparklinePoint[] = historicalTrend.map(p => ({ label: p.periodLabel, value: p.participation }));
      const sparkBurnout: SparklinePoint[] = historicalTrend.map(p => ({ label: p.periodLabel, value: p.burnoutRisk }));

      // 11. Active campaign banner info
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
          total: 0,
        };
      }

      // 12. AI Insights & Executive Summary
      let insights: AIInsight[] = [];
      let executiveSummary = 'Analizando los datos de la encuesta para generar el resumen ejecutivo...';
      let aiConfidence = 92;

      try {
        const aiResponse = await generateAIInsights(heatmap, metrics);
        if (aiResponse.success && aiResponse.insights) {
          insights = aiResponse.insights;
          if (aiResponse.executiveSummary) {
            executiveSummary = aiResponse.executiveSummary;
          }
          if (aiResponse.confidence) {
            aiConfidence = aiResponse.confidence;
          }
        }
      } catch (aiError) {
        console.error('Failed to generate dynamic AI insights:', aiError);
      }

      setData({
        hasResponses: true,
        currentCampaignId: targetId,
        metrics,
        heatmap,
        departments: Array.from(uniqueDepartments),
        heatmapLocation,
        locations: allLocations,
        insights,
        executiveSummary,
        aiConfidence,
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
        allSeries,
        currentSeriesId: currentProgramName,
        questionComparisons,
        dimensionComparisons,
        actionImpactSummary,
        comparisonCampaignTitle: compCampaignTitle,
      });

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [campaignId, compareCampaignId, campaigns]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}
