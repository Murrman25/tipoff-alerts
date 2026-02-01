-- Create teams registry table for API-agnostic team management
CREATE TABLE public.teams (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  short_name TEXT,
  city TEXT,
  league TEXT NOT NULL,
  sport TEXT NOT NULL,
  
  -- Logo filename (your exact filename without .png extension)
  logo_filename TEXT,
  
  -- API Provider Mappings (add more columns as you switch providers)
  sportsgameodds_id TEXT UNIQUE,
  espn_id TEXT,
  odds_api_id TEXT,
  sportradar_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups by any API ID
CREATE INDEX idx_teams_sportsgameodds ON public.teams(sportsgameodds_id);
CREATE INDEX idx_teams_espn ON public.teams(espn_id);
CREATE INDEX idx_teams_league ON public.teams(league);

-- Enable RLS with public read access (team data is not sensitive)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view teams" 
ON public.teams 
FOR SELECT 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create public storage bucket for team logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-logos', 'team-logos', true);

-- Allow public read access to team logos
CREATE POLICY "Team logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'team-logos');