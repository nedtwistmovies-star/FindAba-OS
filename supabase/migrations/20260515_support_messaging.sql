
-- Support Messaging Table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public contact form)
DROP POLICY IF EXISTS "Anyone can insert support messages" ON public.support_messages;
CREATE POLICY "Anyone can insert support messages" ON public.support_messages 
  FOR INSERT WITH CHECK (true);

-- Only admins can view/manage support messages
DROP POLICY IF EXISTS "Only admins can view support messages" ON public.support_messages;
CREATE POLICY "Only admins can view support messages" ON public.support_messages 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Log the migration
INSERT INTO public.platform_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
UPDATE public.platform_config 
SET settings = COALESCE(settings, '{}'::jsonb) || '{"last_patch": "20260515_support_messaging"}'::jsonb 
WHERE id = 1;
