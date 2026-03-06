-- ============================================================
-- Jonathan CRM — Supabase Schema (v2)
-- Run in the Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- ── Helper: updated_at trigger function ─────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Companies ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id      UUID REFERENCES auth.users NOT NULL,
  name          TEXT NOT NULL,
  domain        TEXT,
  industry      TEXT,
  size          TEXT,
  phone         TEXT,
  address       TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS companies_updated_at ON public.companies;
CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_select" ON public.companies FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "companies_insert" ON public.companies FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "companies_update" ON public.companies FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "companies_delete" ON public.companies FOR DELETE USING (auth.uid() = owner_id);

-- ── Contacts ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contacts (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id      UUID REFERENCES auth.users NOT NULL,
  full_name     TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  role          TEXT,
  company_id    UUID REFERENCES public.companies ON DELETE SET NULL,
  label         TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS contacts_updated_at ON public.contacts;
CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contacts_select" ON public.contacts FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "contacts_insert" ON public.contacts FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "contacts_update" ON public.contacts FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "contacts_delete" ON public.contacts FOR DELETE USING (auth.uid() = owner_id);

-- ── Deals ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deals (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id          UUID REFERENCES auth.users NOT NULL,
  title             TEXT NOT NULL,
  organization      TEXT,
  contact_person    TEXT,
  contact_id        UUID REFERENCES public.contacts ON DELETE SET NULL,
  company_id        UUID REFERENCES public.companies ON DELETE SET NULL,
  value             NUMERIC DEFAULT 0,
  currency          TEXT DEFAULT 'USD',
  stage             TEXT NOT NULL DEFAULT 'Qualified',
  pipeline          TEXT DEFAULT 'Counting Tool',
  label             TEXT,
  probability       INTEGER,
  expected_close    DATE,
  source_channel    TEXT,
  source_channel_id TEXT,
  visible_to        TEXT DEFAULT 'Only me',
  phone             TEXT,
  phone_type        TEXT DEFAULT 'Work',
  email             TEXT,
  email_type        TEXT DEFAULT 'Work',
  notes             TEXT,
  warn              BOOLEAN DEFAULT true,
  won               BOOLEAN DEFAULT false,
  lost              BOOLEAN DEFAULT false,
  lost_reason       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS deals_updated_at ON public.deals;
CREATE TRIGGER deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deals_select" ON public.deals FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "deals_insert" ON public.deals FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "deals_update" ON public.deals FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "deals_delete" ON public.deals FOR DELETE USING (auth.uid() = owner_id);

-- ── Activities ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activities (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id      UUID REFERENCES auth.users NOT NULL,
  type          TEXT NOT NULL DEFAULT 'task',
  title         TEXT NOT NULL,
  description   TEXT,
  due_date      TIMESTAMPTZ,
  completed     BOOLEAN DEFAULT false,
  completed_at  TIMESTAMPTZ,
  deal_id       UUID REFERENCES public.deals ON DELETE CASCADE,
  contact_id    UUID REFERENCES public.contacts ON DELETE SET NULL,
  priority      TEXT DEFAULT 'medium',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS activities_updated_at ON public.activities;
CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_select" ON public.activities FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "activities_insert" ON public.activities FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "activities_update" ON public.activities FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "activities_delete" ON public.activities FOR DELETE USING (auth.uid() = owner_id);

-- ── Profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users PRIMARY KEY,
  full_name   TEXT,
  avatar_url  TEXT,
  timezone    TEXT DEFAULT 'America/New_York',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Indexes for performance ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_deals_owner    ON public.deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage    ON public.deals(stage);
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON public.contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_owner ON public.activities(owner_id);
CREATE INDEX IF NOT EXISTS idx_activities_deal ON public.activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_due  ON public.activities(due_date);
