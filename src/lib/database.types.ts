/**
 * Database type definitions for Supabase.
 * 
 * These types mirror the PostgreSQL schema defined in
 * supabase/migrations/001_initial_schema.sql
 * 
 * Update these types whenever the schema changes.
 */

// ─── Enums ──────────────────────────────────────────────

export type UserRole = 'admin' | 'manager' | 'viewer';

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'closed';

export type InsightType = 'critical_alert' | 'opportunity' | 'sentiment' | 'topic';

export type InsightSeverity = 'critical' | 'warning' | 'info';

export type SegmentFieldType = 'select' | 'text';

// ─── Row Types ──────────────────────────────────────────

export interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  auth_uid: string | null;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Employee {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  invite_token: string;
  created_at: string;
}

export interface SegmentField {
  id: string;
  organization_id: string;
  field_name: string;
  field_type: SegmentFieldType;
  options: string[];
  created_at: string;
}

export interface EmployeeSegment {
  id: string;
  employee_id: string;
  segment_field_id: string;
  value: string;
}

export interface Campaign {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  status: CampaignStatus;
  period_label: string;
  starts_at: string | null;
  ends_at: string | null;
  reminder_config: ReminderConfig;
  created_by: string;
  created_at: string;
  closed_at: string | null;
}

export interface ReminderConfig {
  enabled: boolean;
  first_reminder_days: number;
  final_reminder_hours: number;
}

export interface Question {
  id: string;
  campaign_id: string;
  text: string;
  dimension: string;
  order_index: number;
  is_required: boolean;
}

export interface Response {
  id: string;
  question_id: string;
  campaign_id: string;
  department: string | null;
  location: string | null;
  rating: number;
  comment: string | null;
  submitted_at: string;
}

export interface CampaignInsight {
  id: string;
  campaign_id: string;
  insight_type: InsightType;
  severity: InsightSeverity;
  title: string;
  body: string;
  dimension: string | null;
  segment_ref: string | null;
  generated_at: string;
  raw_ai_response: Record<string, unknown> | null;
}

// ─── Insert Types (omit auto-generated fields) ─────────

export type OrganizationInsert = Omit<Organization, 'id' | 'created_at'>;
export type UserInsert = Omit<User, 'id' | 'created_at'>;
export type EmployeeInsert = Omit<Employee, 'id' | 'created_at' | 'invite_token'>;
export type SegmentFieldInsert = Omit<SegmentField, 'id' | 'created_at'>;
export type EmployeeSegmentInsert = Omit<EmployeeSegment, 'id'>;
export type CampaignInsert = Omit<Campaign, 'id' | 'created_at' | 'closed_at'>;
export type QuestionInsert = Omit<Question, 'id'>;
export type ResponseInsert = Omit<Response, 'id' | 'submitted_at'>;
export type CampaignInsightInsert = Omit<CampaignInsight, 'id' | 'generated_at'>;

// ─── Update Types ───────────────────────────────────────

export type OrganizationUpdate = Partial<Omit<Organization, 'id' | 'created_at'>>;
export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>;
export type EmployeeUpdate = Partial<Omit<Employee, 'id' | 'created_at'>>;
export type CampaignUpdate = Partial<Omit<Campaign, 'id' | 'created_at' | 'organization_id'>>;
export type QuestionUpdate = Partial<Omit<Question, 'id' | 'campaign_id'>>;

// ─── Supabase Database Type ─────────────────────────────

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: OrganizationInsert;
        Update: OrganizationUpdate;
      };
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      employees: {
        Row: Employee;
        Insert: EmployeeInsert;
        Update: EmployeeUpdate;
      };
      segment_fields: {
        Row: SegmentField;
        Insert: SegmentFieldInsert;
        Update: Partial<Omit<SegmentField, 'id' | 'created_at'>>;
      };
      employee_segments: {
        Row: EmployeeSegment;
        Insert: EmployeeSegmentInsert;
        Update: Partial<Omit<EmployeeSegment, 'id'>>;
      };
      campaigns: {
        Row: Campaign;
        Insert: CampaignInsert;
        Update: CampaignUpdate;
      };
      questions: {
        Row: Question;
        Insert: QuestionInsert;
        Update: QuestionUpdate;
      };
      responses: {
        Row: Response;
        Insert: ResponseInsert;
        Update: Partial<Omit<Response, 'id' | 'submitted_at'>>;
      };
      campaign_insights: {
        Row: CampaignInsight;
        Insert: CampaignInsightInsert;
        Update: Partial<Omit<CampaignInsight, 'id' | 'generated_at'>>;
      };
    };
    Enums: {
      user_role: UserRole;
      campaign_status: CampaignStatus;
      insight_type: InsightType;
      insight_severity: InsightSeverity;
      segment_field_type: SegmentFieldType;
    };
  };
}
