import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class SupabaseConfig:
    def __init__(self):
        self.url: str = os.environ.get("SUPABASE_URL")
        self.key: str = os.environ.get("SUPABASE_KEY")
        self.jwt_secret: str = os.environ.get("SUPABASE_JWT_SECRET")
        
        if not all([self.url, self.key, self.jwt_secret]):
            raise ValueError("Missing Supabase configuration. Please check your .env file.")

    def get_client(self) -> Client:
        """Get Supabase client instance"""
        return create_client(self.url, self.key)

# Create a singleton instance
supabase_config = SupabaseConfig()
supabase = supabase_config.get_client()

# Database tables
TABLES = {
    'users': 'users',
    'posts': 'posts',
    'comments': 'comments',
    'likes': 'likes',
    'followers': 'followers',
    'beats': 'beats',
    'collaborations': 'collaborations'
}

# RLS Policies (to be implemented in Supabase dashboard)
POLICIES = {
    'users': {
        'select': 'authenticated users can read all profiles',
        'insert': 'users can insert their own profile',
        'update': 'users can update own profile',
        'delete': 'users can delete own profile'
    },
    'posts': {
        'select': 'authenticated users can read all posts',
        'insert': 'authenticated users can create posts',
        'update': 'users can update own posts',
        'delete': 'users can delete own posts'
    },
    'beats': {
        'select': 'authenticated users can read all beats',
        'insert': 'authenticated users can create beats',
        'update': 'users can update own beats',
        'delete': 'users can delete own beats'
    }
}
