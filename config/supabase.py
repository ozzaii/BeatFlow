import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

class SupabaseConfig:
    def __init__(self):
        # Required settings
        self.url: str = os.getenv('SUPABASE_URL')
        self.key: str = os.getenv('SUPABASE_KEY')
        self.jwt_secret: str = os.getenv('SUPABASE_JWT_SECRET')
        self.db_url: str = os.getenv('SUPABASE_DB_URL')
        
        # Validate required settings
        if not all([self.url, self.key, self.jwt_secret, self.db_url]):
            raise ValueError(
                "Missing required Supabase configuration. "
                "Please check your .env file and ensure all required variables are set."
            )
            
        # Optional settings with defaults
        self.enable_realtime: bool = os.getenv('ENABLE_REALTIME', 'true').lower() == 'true'
        self.realtime_timeout: int = int(os.getenv('REALTIME_TIMEOUT', '10000'))
        self.auto_refresh_token: bool = os.getenv('AUTO_REFRESH_TOKEN', 'true').lower() == 'true'
        self.persist_session: bool = os.getenv('PERSIST_SESSION', 'true').lower() == 'true'
        
        # Storage settings
        self.storage_bucket: str = os.getenv('STORAGE_BUCKET', 'beats')
        self.max_file_size: int = int(os.getenv('MAX_FILE_SIZE', '50000000'))  # 50MB
        
    def get_client(self) -> Client:
        """Get Supabase client instance with current configuration"""
        options = {
            'auto_refresh_token': self.auto_refresh_token,
            'persist_session': self.persist_session,
            'realtime': {
                'enabled': self.enable_realtime,
                'timeout': self.realtime_timeout
            }
        }
        
        return create_client(self.url, self.key, options)
        
    def get_storage_client(self) -> Optional[Client]:
        """Get Supabase storage client if storage is configured"""
        if not self.storage_bucket:
            return None
            
        client = self.get_client()
        return client.storage.from_(self.storage_bucket)

# Database tables
TABLES = {
    'PROFILES': 'profiles',
    'BEATS': 'beats',
    'COLLABORATIONS': 'collaborations',
    'COMMENTS': 'comments',
    'LIKES': 'likes',
    'FOLLOWS': 'follows',
    'NOTIFICATIONS': 'notifications',
    'BEATS_VERSIONS': 'beats_versions'
}

# RLS Policies
POLICIES = {
    'profiles': {
        'select': 'Public profiles are viewable by everyone',
        'insert': 'Users can insert their own profile',
        'update': 'Users can update own profile',
        'delete': None  # No delete policy
    },
    'beats': {
        'select': 'Public beats are viewable by everyone',
        'insert': 'Authenticated users can create beats',
        'update': 'Users can update own beats',
        'delete': 'Users can delete own beats'
    },
    'collaborations': {
        'select': 'Collaborators can view beats',
        'insert': 'Users can invite collaborators',
        'update': 'Users can update collaboration status',
        'delete': 'Users can remove collaborators'
    }
}

# Real-time channels
CHANNELS = {
    'BEATS': 'beats',
    'COMMENTS': 'comments',
    'NOTIFICATIONS': 'notifications',
    'PRESENCE': 'presence'
}

# Create singleton instance
supabase_config = SupabaseConfig()
supabase = supabase_config.get_client()
storage = supabase_config.get_storage_client()
