-- Create alerts table to store user alerts
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_type TEXT NOT NULL,
  event_id TEXT,
  market_type TEXT NOT NULL,
  team_side TEXT,
  threshold NUMERIC,
  direction TEXT NOT NULL,
  time_window TEXT NOT NULL DEFAULT 'both',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification_channels table for delivery preferences per alert
CREATE TABLE public.alert_notification_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'push', 'sms')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(alert_id, channel_type)
);

-- Create user notification settings table for global preferences
CREATE TABLE public.user_notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  email_address TEXT,
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for alerts
CREATE POLICY "Users can view their own alerts" 
ON public.alerts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts" 
ON public.alerts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" 
ON public.alerts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts" 
ON public.alerts FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for alert notification channels
CREATE POLICY "Users can view their alert channels" 
ON public.alert_notification_channels FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.alerts WHERE alerts.id = alert_notification_channels.alert_id AND alerts.user_id = auth.uid()
));

CREATE POLICY "Users can create their alert channels" 
ON public.alert_notification_channels FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.alerts WHERE alerts.id = alert_notification_channels.alert_id AND alerts.user_id = auth.uid()
));

CREATE POLICY "Users can update their alert channels" 
ON public.alert_notification_channels FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.alerts WHERE alerts.id = alert_notification_channels.alert_id AND alerts.user_id = auth.uid()
));

CREATE POLICY "Users can delete their alert channels" 
ON public.alert_notification_channels FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.alerts WHERE alerts.id = alert_notification_channels.alert_id AND alerts.user_id = auth.uid()
));

-- Create policies for user notification settings
CREATE POLICY "Users can view their own settings" 
ON public.user_notification_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" 
ON public.user_notification_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.user_notification_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_alerts_updated_at
BEFORE UPDATE ON public.alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_notification_settings_updated_at
BEFORE UPDATE ON public.user_notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();