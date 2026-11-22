-- ==============================================================================
-- CropDoc Supabase Schema: Kisan Profile, Scans & Cloud Persistence
-- ==============================================================================

-- 1. Create Kisan Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    state TEXT DEFAULT 'Punjab',
    district TEXT DEFAULT 'Ludhiana',
    preferred_crops TEXT[] DEFAULT ARRAY['Wheat', 'Paddy / Rice'],
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 2. Create Scans Table
CREATE TABLE IF NOT EXISTS public.scans (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp BIGINT NOT NULL,
    image_url TEXT,
    image_thumbnail TEXT,
    diagnosis JSONB NOT NULL,
    severity TEXT NOT NULL,
    severity_gauge TEXT,
    tanki_quick_dose TEXT,
    advisory JSONB NOT NULL,
    weather_snapshot JSONB,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Index for fast user query ordering
CREATE INDEX IF NOT EXISTS idx_scans_user_timestamp ON public.scans(user_id, timestamp DESC);

-- Enable RLS for scans
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scans"
    ON public.scans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans"
    ON public.scans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans"
    ON public.scans FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scans"
    ON public.scans FOR DELETE
    USING (auth.uid() = user_id);

-- 3. Trigger for Automatic Profile Creation on Google Sign-In
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Kisan Brother'),
        NEW.email,
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Storage Bucket Configuration for Leaf Photos
-- Run these in Supabase SQL editor to create the 'scans' bucket:
INSERT INTO storage.buckets (id, name, public)
VALUES ('scans', 'scans', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Anyone can view public scan images
CREATE POLICY "Public leaf scan image read access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'scans');

-- Storage RLS: Authenticated users can upload to scans bucket
CREATE POLICY "Authenticated user leaf scan upload"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'scans' AND
        auth.role() = 'authenticated'
    );
