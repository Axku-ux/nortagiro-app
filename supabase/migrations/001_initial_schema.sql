-- ============================================================
-- ClimaPulse 360 — Initial Database Schema
-- ============================================================
-- Run this migration in Supabase SQL Editor or via CLI:
--   supabase db push
-- ============================================================

-- ─── Custom Enum Types ──────────────────────────────────────

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'viewer');
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'active', 'closed');
CREATE TYPE insight_type AS ENUM ('critical_alert', 'opportunity', 'sentiment', 'topic');
CREATE TYPE insight_severity AS ENUM ('critical', 'warning', 'info');
CREATE TYPE segment_field_type AS ENUM ('select', 'text');

-- ─── Organizations ──────────────────────────────────────────

CREATE TABLE organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  logo_url   TEXT,
  settings   JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE organizations IS 'Single-tenant: one row for the company using the platform.';

-- ─── Users (Admins & Managers) ──────────────────────────────

CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  auth_uid        UUID UNIQUE,  -- Links to Supabase Auth (auth.users.id)
  email           TEXT NOT NULL UNIQUE,
  full_name       TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'viewer',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_auth ON users(auth_uid);

COMMENT ON TABLE users IS 'Platform users (admin/manager/viewer) who log in to manage campaigns.';
COMMENT ON COLUMN users.auth_uid IS 'Foreign key to auth.users.id from Supabase Auth.';

-- ─── Employees (Survey Respondents) ─────────────────────────

CREATE TABLE employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  invite_token    UUID NOT NULL DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

CREATE INDEX idx_employees_org ON employees(organization_id);
CREATE INDEX idx_employees_token ON employees(invite_token);

COMMENT ON TABLE employees IS 'Employees who receive and respond to surveys. They do NOT have login credentials.';
COMMENT ON COLUMN employees.invite_token IS 'Unique token used in survey invitation links for anonymous access.';

-- ─── Segment Fields (Custom Segmentation) ───────────────────

CREATE TABLE segment_fields (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  field_name      TEXT NOT NULL,
  field_type      segment_field_type NOT NULL DEFAULT 'select',
  options         TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, field_name)
);

COMMENT ON TABLE segment_fields IS 'Admin-defined segmentation fields (e.g., Departamento, Ubicación, Antigüedad).';
COMMENT ON COLUMN segment_fields.options IS 'Allowed values for select-type fields (e.g., [Tech, Sales, Ops, Marketing]).';

-- ─── Employee Segments (Values per Employee) ────────────────

CREATE TABLE employee_segments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  segment_field_id UUID NOT NULL REFERENCES segment_fields(id) ON DELETE CASCADE,
  value            TEXT NOT NULL,
  UNIQUE(employee_id, segment_field_id)
);

CREATE INDEX idx_emp_segments_employee ON employee_segments(employee_id);
CREATE INDEX idx_emp_segments_field ON employee_segments(segment_field_id);

COMMENT ON TABLE employee_segments IS 'Stores the segment value for each employee per field (e.g., employee X → Departamento → Tech).';

-- ─── Campaigns ──────────────────────────────────────────────

CREATE TABLE campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  status          campaign_status NOT NULL DEFAULT 'draft',
  period_label    TEXT NOT NULL DEFAULT '',
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  reminder_config JSONB NOT NULL DEFAULT '{"enabled": true, "first_reminder_days": 3, "final_reminder_hours": 24}',
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at       TIMESTAMPTZ
);

CREATE INDEX idx_campaigns_org ON campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

COMMENT ON TABLE campaigns IS 'Survey campaigns with lifecycle: draft → scheduled → active → closed.';
COMMENT ON COLUMN campaigns.reminder_config IS 'JSON: { enabled, first_reminder_days, final_reminder_hours }.';

-- ─── Questions ──────────────────────────────────────────────

CREATE TABLE questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  dimension   TEXT NOT NULL DEFAULT 'General',
  order_index INT NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_questions_campaign ON questions(campaign_id);

COMMENT ON TABLE questions IS '100% customizable questions per campaign. Each has a dimension label for grouping in analysis.';
COMMENT ON COLUMN questions.dimension IS 'Free-text dimension label (e.g., Liderazgo, Bienestar). Admin-defined.';

-- ─── Responses ──────────────────────────────────────────────

CREATE TABLE responses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id  UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  department   TEXT,
  location     TEXT,
  rating       INT NOT NULL CHECK (rating >= 1 AND rating <= 10),
  comment      TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_responses_campaign ON responses(campaign_id);
CREATE INDEX idx_responses_question ON responses(question_id);
CREATE INDEX idx_responses_department ON responses(department);
CREATE INDEX idx_responses_location ON responses(location);

COMMENT ON TABLE responses IS 'Individual employee responses. Rating scale 1-10 with optional comment.';

-- ─── Campaign Insights (AI-Generated) ───────────────────────

CREATE TABLE campaign_insights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  insight_type    insight_type NOT NULL,
  severity        insight_severity NOT NULL DEFAULT 'info',
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  dimension       TEXT,
  segment_ref     TEXT,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_ai_response JSONB
);

CREATE INDEX idx_insights_campaign ON campaign_insights(campaign_id);
CREATE INDEX idx_insights_type ON campaign_insights(insight_type);

COMMENT ON TABLE campaign_insights IS 'AI-generated insights produced by Gemini when a campaign is closed.';

-- ─── Campaign Employees (Many-to-Many) ──────────────────────
-- Tracks which employees are invited to each campaign

CREATE TABLE campaign_employees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded   BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(campaign_id, employee_id)
);

CREATE INDEX idx_campaign_employees_campaign ON campaign_employees(campaign_id);
CREATE INDEX idx_campaign_employees_employee ON campaign_employees(employee_id);

COMMENT ON TABLE campaign_employees IS 'Join table tracking which employees are invited to each campaign and whether they responded.';

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_employees ENABLE ROW LEVEL SECURITY;

-- ─── Helper function: get current user's organization ───────

CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id 
  FROM users 
  WHERE auth_uid = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── Helper function: get current user's role ───────────────

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role 
  FROM users 
  WHERE auth_uid = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── Policies: Organizations ────────────────────────────────

CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id = get_user_org_id());

CREATE POLICY "Anyone can create an organization"
  ON organizations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update their organization"
  ON organizations FOR UPDATE
  USING (id = get_user_org_id() AND get_user_role() = 'admin');

-- ─── Policies: Users ───────────────────────────────────────

CREATE POLICY "Users can view users in their organization"
  ON users FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "Authenticated users can create their profile"
  ON users FOR INSERT
  WITH CHECK (auth_uid = auth.uid());

CREATE POLICY "Admins can manage users"
  ON users FOR ALL
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

-- ─── Policies: Employees ───────────────────────────────────

CREATE POLICY "Users can view employees in their organization"
  ON employees FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "Admins can manage employees"
  ON employees FOR ALL
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

-- ─── Policies: Segment Fields ───────────────────────────────

CREATE POLICY "Users can view segment fields"
  ON segment_fields FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "Admins can manage segment fields"
  ON segment_fields FOR ALL
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

-- ─── Policies: Employee Segments ────────────────────────────

CREATE POLICY "Users can view employee segments"
  ON employee_segments FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE organization_id = get_user_org_id()
    )
  );

CREATE POLICY "Admins can manage employee segments"
  ON employee_segments FOR ALL
  USING (
    employee_id IN (
      SELECT id FROM employees WHERE organization_id = get_user_org_id()
    )
    AND get_user_role() = 'admin'
  );

-- ─── Policies: Campaigns ───────────────────────────────────

CREATE POLICY "Users can view campaigns in their organization"
  ON campaigns FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "Admins and Managers can create campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (
    organization_id = get_user_org_id() 
    AND get_user_role() IN ('admin', 'manager')
  );

CREATE POLICY "Admins and Managers can update campaigns"
  ON campaigns FOR UPDATE
  USING (
    organization_id = get_user_org_id() 
    AND get_user_role() IN ('admin', 'manager')
  );

-- ─── Policies: Questions ───────────────────────────────────

CREATE POLICY "Anyone can view questions for survey"
  ON questions FOR SELECT
  USING (true);

CREATE POLICY "Admins and Managers can manage questions"
  ON questions FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id = get_user_org_id()
    )
    AND get_user_role() IN ('admin', 'manager')
  );

-- ─── Policies: Responses ───────────────────────────────────

CREATE POLICY "Anyone can insert survey responses"
  ON responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view responses in their organization"
  ON responses FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id = get_user_org_id()
    )
  );

-- ─── Policies: Campaign Insights ────────────────────────────

CREATE POLICY "Users can view insights"
  ON campaign_insights FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id = get_user_org_id()
    )
  );

-- ─── Policies: Campaign Employees ───────────────────────────

CREATE POLICY "Users can view campaign employees"
  ON campaign_employees FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id = get_user_org_id()
    )
  );

CREATE POLICY "Admins and Managers can manage campaign employees"
  ON campaign_employees FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE organization_id = get_user_org_id()
    )
    AND get_user_role() IN ('admin', 'manager')
  );

-- ============================================================
-- Useful Views (for dashboard queries)
-- ============================================================

-- Aggregated campaign stats
CREATE OR REPLACE VIEW campaign_stats AS
SELECT 
  c.id AS campaign_id,
  c.title,
  c.status,
  c.period_label,
  c.organization_id,
  COUNT(r.id) AS total_responded_questions,
  ROUND(AVG(r.rating)::NUMERIC, 2) AS avg_rating
FROM campaigns c
LEFT JOIN campaign_employees ce ON ce.campaign_id = c.id
LEFT JOIN responses r ON r.campaign_id = c.id
GROUP BY c.id, c.title, c.status, c.period_label, c.organization_id;
