import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Campaign, CampaignStatus, Question, ReminderConfig } from '../lib/database.types';

// ─── Types ──────────────────────────────────────────────

export interface CampaignWithStats extends Campaign {
  totalInvited: number;
  totalResponded: number;
  participationRate: number;
  questionCount: number;
}

export interface CampaignDraft {
  title: string;
  description: string;
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
        // Real data from Supabase — map to CampaignWithStats
        // In a real app with views, you'd fetch from campaign_stats instead
        const mapped: CampaignWithStats[] = (data as unknown as Campaign[]).map((c) => ({
          ...c,
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

  const createCampaign = useCallback(async (draft: CampaignDraft): Promise<string> => {
    if (!user?.organizationId) throw new Error("No user authenticated");
    try {
      const { data, error: insertError } = await supabase
        .from('campaigns')
        .insert([{
          title: draft.title,
          description: draft.description,
          period_label: draft.periodLabel,
          status: 'active' as CampaignStatus, // Directly active for links
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

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    createCampaign,
    updateCampaignStatus,
    mockQuestions: TEMPLATE_QUESTIONS,
  };
}
