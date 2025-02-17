-- Enable UUID extension (available by default)
create extension if not exists "uuid-ossp";

-- Create custom types
create type user_role as enum ('user', 'creator', 'admin');
create type subscription_tier as enum ('free', 'pro', 'premium');
create type notification_type as enum ('like', 'comment', 'follow', 'collaboration'); 