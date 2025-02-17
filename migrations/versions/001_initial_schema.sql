-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create beats table
CREATE TABLE IF NOT EXISTS public.beats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    bpm INTEGER NOT NULL DEFAULT 120,
    key TEXT,
    time_signature TEXT DEFAULT '4/4',
    is_public BOOLEAN DEFAULT false,
    storage_path TEXT NOT NULL,
    waveform_path TEXT,
    owner_id UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1,
    tags TEXT[]
);

-- Create beats_versions table for version control
CREATE TABLE IF NOT EXISTS public.beats_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) NOT NULL,
    version INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    waveform_path TEXT,
    changes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    UNIQUE(beat_id, version)
);

-- Create collaborations table
CREATE TABLE IF NOT EXISTS public.collaborations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('viewer', 'editor', 'owner')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(beat_id, user_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT NOT NULL,
    timestamp FLOAT,
    parent_id UUID REFERENCES public.comments(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(beat_id, user_id)
);

-- Create playlists table
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    owner_id UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create playlist_items table
CREATE TABLE IF NOT EXISTS public.playlist_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    playlist_id UUID REFERENCES public.playlists(id) NOT NULL,
    beat_id UUID REFERENCES public.beats(id) NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(playlist_id, beat_id),
    UNIQUE(playlist_id, position)
);

-- Create functions for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beats_updated_at
    BEFORE UPDATE ON public.beats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaborations_updated_at
    BEFORE UPDATE ON public.collaborations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at
    BEFORE UPDATE ON public.playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX beats_created_by_idx ON public.beats(owner_id);
CREATE INDEX beats_created_at_idx ON public.beats(created_at DESC);
CREATE INDEX comments_beat_id_idx ON public.comments(beat_id);
CREATE INDEX likes_beat_id_idx ON public.likes(beat_id);
CREATE INDEX follows_follower_id_idx ON public.follows(follower_id);
CREATE INDEX follows_following_id_idx ON public.follows(following_id);
CREATE INDEX notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX beats_versions_beat_id_idx ON public.beats_versions(beat_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beats_versions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Public beats are viewable by everyone"
    ON public.beats FOR SELECT
    USING (is_public = true OR auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create beats"
    ON public.beats FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own beats"
    ON public.beats FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own beats"
    ON public.beats FOR DELETE
    USING (auth.uid() = owner_id);

-- Create real-time subscriptions
CREATE PUBLICATION supabase_realtime FOR TABLE public.beats, public.comments, public.likes, public.notifications; 