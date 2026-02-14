-- Allow strict equality comparator for odds alerts.
-- This migration is defensive: constraint names differ across environments.

DO $$
DECLARE
  existing_name TEXT;
  existing_def TEXT;
BEGIN
  SELECT c.conname, pg_get_constraintdef(c.oid)
    INTO existing_name, existing_def
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public'
    AND t.relname = 'odds_alerts'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%comparator%'
  ORDER BY c.conname
  LIMIT 1;

  -- If the existing check constraint already allows eq, nothing to do.
  IF existing_def IS NOT NULL AND existing_def ILIKE '%''eq''%' THEN
    RETURN;
  END IF;

  IF existing_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.odds_alerts DROP CONSTRAINT %I', existing_name);
  END IF;

  ALTER TABLE public.odds_alerts
    ADD CONSTRAINT odds_alerts_comparator_check
    CHECK (comparator IN ('gte', 'lte', 'eq', 'crosses_up', 'crosses_down'));
END $$;

