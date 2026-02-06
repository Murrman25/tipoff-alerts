-- Create alert_templates table for user-defined reusable alert configurations
CREATE TABLE public.alert_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  rule_type text NOT NULL,
  market_type text NOT NULL DEFAULT 'ml',
  threshold numeric,
  direction text,
  surge_window_minutes integer,
  run_window_minutes integer,
  game_period text,
  time_window text NOT NULL DEFAULT 'both',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.alert_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user isolation (same pattern as alerts table)
CREATE POLICY "Users can view their own templates"
ON public.alert_templates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
ON public.alert_templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
ON public.alert_templates
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
ON public.alert_templates
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER update_alert_templates_updated_at
BEFORE UPDATE ON public.alert_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();