import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Campaign, CampaignStatus, Question, ReminderConfig } from '../lib/database.types';

// ─── Types ──────────────────────────────────────────────

export interface CampaignWithStats extends Campaign {
  programName: string;
  cleanDesc: string;
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  questionCount: number;
}

export interface CampaignDraft {
  title: string;
  description: string;
  programName?: string;
  periodLabel: string;
  startsAt: string;
  endsAt: string;
  reminderConfig: ReminderConfig;
  questions: QuestionDraft[];
  audienceEmployeeIds: string[];
}

export interface QuestionDraft {
  id?: string;
  text: string;
  dimension: string;
  orderIndex: number;
  isRequired: boolean;
}

// ─── Helpers ────────────────────────────────────────────

export function extractProgramName(description: string | null | undefined, title: string): string {
  if (description) {
    const match = description.match(/\[Programa:\s*([^\]]+)\]/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  // Fallback from title (e.g. "Clima 360 - Q1 2025" -> "Clima 360")
  const fallback = title.replace(/\s*-\s*q\d.*|\s*q\d.*|\s*\(\d{4}\).*/i, '').trim();
  return fallback || 'Programa General';
}

export function cleanDescription(description: string | null | undefined): string {
  if (!description) return '';
  return description.replace(/\[Programa:\s*[^\]]+\]\n?/gi, '').trim();
}

// ─── Templates ──────────────────────────────────────────

const TEMPLATE_QUESTIONS: QuestionDraft[] = [
  { text: '¿Sientes que tus aportaciones y logros son reconocidos de forma justa en tu equipo?', dimension: 'Reconocimiento', orderIndex: 0, isRequired: true },
  { text: '¿Tu líder directo te brinda retroalimentación útil y oportuna?', dimension: 'Liderazgo', orderIndex: 1, isRequired: true },
  { text: '¿Consideras que tienes oportunidades reales de crecimiento profesional?', dimension: 'Crecimiento', orderIndex: 2, isRequired: true },
  { text: '¿Tu carga de trabajo te permite mantener un equilibrio con tu vida personal?', dimension: 'Bienestar', orderIndex: 3, isRequired: true },
  { text: '¿Sientes que la comunicación en tu equipo es abierta y transparente?', dimension: 'Liderazgo', orderIndex: 4, isRequired: true },
  { text: '¿Te sientes valorado/a como profesional en esta organización?', dimension: 'Reconocimiento', orderIndex: 5, isRequired: true },
  { text: '¿Los recursos y herramientas que tienes son adecuados para hacer bien tu trabajo?', dimension: 'Bienestar', orderIndex: 6, isRequired: true },
  { text: '¿Recomendarías esta empresa como un excelente lugar para trabajar?', dimension: 'General', orderIndex: 7, isRequired: true },
];

// ─── Hook ───────────────────────────────────────────────

export function useCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    if (!user?.organizationId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (data) {
        const mapped: CampaignWithStats[] = (data as unknown as Campaign[]).map((c) => ({
          ...c,
          programName: extractProgramName(c.description, c.title),
          cleanDesc: cleanDescription(c.description),
          totalInvited: 0,
          totalResponded: 0,
          participationRate: 0,
          questionCount: 0,
        }));
        setCampaigns(mapped);
      }
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.organizationId]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // List of unique program names across all campaigns
  const existingPrograms = useMemo(() => {
    const set = new Set<string>();
    campaigns.forEach(c => {
      if (c.programName) set.add(c.programName);
    });
    if (set.size === 0) {
      set.add('Clima Organizacional 360');
    }
    return Array.from(set);
  }, [campaigns]);

  const createCampaign = useCallback(async (draft: CampaignDraft): Promise<string> => {
    if (!user?.organizationId) throw new Error("No user authenticated");
    try {
      // Embed program name in description if provided
      let finalDescription = draft.description || '';
      if (draft.programName && draft.programName.trim().length > 0) {
        const progTag = `[Programa: ${draft.programName.trim()}]`;
        const rawClean = cleanDescription(finalDescription);
        finalDescription = rawClean ? `${progTag}\n${rawClean}` : progTag;
      }

      const { data, error: insertError } = await supabase
        .from('campaigns')
        .insert([{
          title: draft.title,
          description: finalDescription || null,
          period_label: draft.periodLabel,
          status: 'active' as CampaignStatus,
          starts_at: draft.startsAt || new Date().toISOString(),
          ends_at: draft.endsAt || null,
          reminder_config: draft.reminderConfig,
          created_by: user.id, 
          organization_id: user.organizationId, 
        }] as unknown as never[])
        .select()
        .single();

      if (insertError) throw insertError;
      const campaignData = data as unknown as Campaign;

      // Insert questions
      if (draft.questions.length > 0) {
        const questionsInsert = draft.questions.map((q, i) => ({
          campaign_id: campaignData.id,
          text: q.text,
          dimension: q.dimension,
          order_index: i,
          is_required: q.isRequired,
        }));

        const { error: qError } = await supabase
          .from('questions')
          .insert(questionsInsert as unknown as never[]);

        if (qError) throw qError;
      }

      await fetchCampaigns();
      return campaignData.id;
    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }, [fetchCampaigns, user?.id, user?.organizationId]);

  const updateCampaignStatus = useCallback(async (id: string, status: CampaignStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ status, ...(status === 'closed' ? { closed_at: new Date().toISOString() } : {}) } as unknown as never)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign status:', error);
      throw error;
    }
  }, [fetchCampaigns]);

  const getCampaignWithQuestions = useCallback(async (id: string) => {
    try {
      const { data: campaign, error: cError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (cError) throw cError;

      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('*')
        .eq('campaign_id', id)
        .order('order_index', { ascending: true });

      if (qError) throw qError;

      const c = campaign as Campaign;
      return {
        campaign: c,
        programName: extractProgramName(c.description, c.title),
        cleanDesc: cleanDescription(c.description),
        questions: (questions || []) as Question[],
      };
    } catch (err) {
      console.error('Error fetching campaign with questions:', err);
      return null;
    }
  }, []);

  return {
    campaigns,
    existingPrograms,
    loading,
    error,
    fetchCampaigns,
    createCampaign,
    updateCampaignStatus,
    getCampaignWithQuestions,
    mockQuestions: TEMPLATE_QUESTIONS,
  };
}
