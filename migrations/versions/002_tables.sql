-- Create profiles table
create table profiles (
    id uuid references auth.users on delete cascade,
    username text unique,
    email text unique,
    avatar_url text,
    bio text,
    website text,
    role user_role default 'user',
    subscription_tier subscription_tier default 'free',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id),
    constraint username_length check (char_length(username) >= 3)
);

-- Create beats table
create table beats (
    id uuid default uuid_generate_v4() primary key,
    created_by uuid references profiles(id) on delete cascade,
    title text not null,
    description text,
    pattern jsonb not null,
    bpm integer not null default 128,
    is_public boolean default true,
    audio_url text,
    waveform_data jsonb,
    tags text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create collaborations table
create table collaborations (
    id uuid default uuid_generate_v4() primary key,
    beat_id uuid references beats(id) on delete cascade,
    user_id uuid references profiles(id) on delete cascade,
    role text not null,
    status text not null default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (beat_id, user_id)
);

-- Create comments table
create table comments (
    id uuid default uuid_generate_v4() primary key,
    beat_id uuid references beats(id) on delete cascade,
    user_id uuid references profiles(id) on delete cascade,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create likes table
create table likes (
    id uuid default uuid_generate_v4() primary key,
    beat_id uuid references beats(id) on delete cascade,
    user_id uuid references profiles(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (beat_id, user_id)
);

-- Create follows table
create table follows (
    id uuid default uuid_generate_v4() primary key,
    follower_id uuid references profiles(id) on delete cascade,
    following_id uuid references profiles(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (follower_id, following_id)
);

-- Create notifications table
create table notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade,
    type notification_type not null,
    actor_id uuid references profiles(id) on delete cascade,
    beat_id uuid references beats(id) on delete cascade,
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create beats_versions table for version control
create table beats_versions (
    id uuid default uuid_generate_v4() primary key,
    beat_id uuid references beats(id) on delete cascade,
    pattern jsonb not null,
    created_by uuid references profiles(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    version_number integer not null,
    commit_message text
); 