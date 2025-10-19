-- Create categories master table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tournament_id, name)
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow all operations on categories
CREATE POLICY "Allow all operations on categories"
ON public.categories
FOR ALL
USING (true)
WITH CHECK (true);

-- Add category field to players table
ALTER TABLE public.players ADD COLUMN category TEXT;