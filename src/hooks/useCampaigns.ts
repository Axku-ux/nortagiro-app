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

// ─── Mock Data ──────────────────────────────────────────

const MOCK_CAMPAIGNS: CampaignWithStats[] = [
  {
    id: 'mock-campaign-1',
    organization_id: 'mock-org',
    title: 'Encuesta de Clima Q3 2024',
    description: 'Encuesta trimestral de clima organizacional para el tercer trimestre.',
    status: 'active',
    period_label: 'Q3 2024 (Jul - Sep)',
    starts_at: '2024-07-01T09:00:00Z',
    ends_at: '2024-09-30T23:59:00Z',
    reminder_config: { enabled: true, first_reminder_days: 3, final_reminder_hours: 24 },
    created_by: 'mock-user',
    created_at: '2024-06-15T10:00:00Z',
    closed_at: null,
    totalInvited: 520,
    totalResponded: 452,
    participationRate: 87,
    questionCount: 8,
  },
  {
    id: 'mock-campaign-2',
    organization_id: 'mock-org',
    title: 'Encuesta de Clima Q2 2024',
    description: 'Encuesta trimestral completada.',
    status: 'closed',
    period_label: 'Q2 2024 (Apr - Jun)',
    starts_at: '2024-04-01T09:00:00Z',
    ends_at: '2024-06-30T23:59:00Z',
    reminder_config: { enabled: true, first_reminder_days: 3, final_reminder_hours: 24 },
    created_by: 'mock-user',
    created_at: '2024-03-15T10:00:00Z',
    closed_at: '2024-07-01T00:00:00Z',
    totalInvited: 510,
    totalResponded: 478,
    participationRate: 94,
    questionCount: 8,
  },
  {
    id: 'mock-campaign-3',
    organization_id: 'mock-org',
    title: 'Encuesta de Bienestar Tech',
    description: 'Encuesta especial para el departamento de tecnología.',
    status: 'draft',
    period_label: 'Q4 2024',
    starts_at: null,
    ends_at: null,
    reminder_config: { enabled: true, first_reminder_days: 3, final_reminder_hours: 24 },
    created_by: 'mock-user',
    created_at: '2024-09-01T10:00:00Z',
    closed_at: null,
    totalInvited: 0,
    totalResponded: 0,
    participationRate: 0,
    questionCount: 5,
  },
];

const MOCK_QUESTIONS: QuestionDraft[] = [
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
    if (!user) {
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

      if (data && data.length > 0) {
        // Real data from Supabase — map to CampaignWithStats
        const mapped: CampaignWithStats[] = (data as unknown as Campaign[]).map((c) => ({
          ...c,
          totalInvited: 0,
          totalResponded: 0,
          participationRate: 0,
          questionCount: 0,
        }));
        setCampaigns(mapped);
      } else {
        // Empty state - show mock or empty list safely
        setCampaigns(MOCK_CAMPAIGNS);
      }
    } catch {
      // Fallback to mock data only if DB fails entirely
      setCampaigns(MOCK_CAMPAIGNS);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = useCallback(async (draft: CampaignDraft): Promise<string> => {
    try {
      // Create campaign
      if (!user) throw new Error("No user authenticated");
      
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
    } catch {
      // Mock creation
      const mockId = `mock-${Date.now()}`;
      const newCampaign: CampaignWithStats = {
        id: mockId,
        organization_id: 'mock-org',
        title: draft.title,
        description: draft.description,
        status: 'draft',
        period_label: draft.periodLabel,
        starts_at: draft.startsAt || null,
        ends_at: draft.endsAt || null,
        reminder_config: draft.reminderConfig,
        created_by: 'mock-user',
        created_at: new Date().toISOString(),
        closed_at: null,
        totalInvited: draft.audienceEmployeeIds.length,
        totalResponded: 0,
        participationRate: 0,
        questionCount: draft.questions.length,
      };
      setCampaigns((prev) => [newCampaign, ...prev]);
      return mockId;
    }
  }, [fetchCampaigns, user]);

  const updateCampaignStatus = useCallback(async (id: string, status: CampaignStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ status, ...(status === 'closed' ? { closed_at: new Date().toISOString() } : {}) } as unknown as never)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchCampaigns();
    } catch {
      // Mock update
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
    }
  }, [fetchCampaigns]);

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    createCampaign,
    updateCampaignStatus,
    mockQuestions: MOCK_QUESTIONS,
  };
}
