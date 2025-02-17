#!/usr/bin/env python3
import os
from supabase import create_client, Client
from dotenv import load_dotenv

def init_storage():
    # Load environment variables
    load_dotenv()
    
    # Initialize Supabase client
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')  # Use service key for admin operations
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # Define bucket configurations
    buckets = [
        {
            'name': 'beats',
            'public': False,
            'file_size_limit': 50000000,  # 50MB
            'allowed_mime_types': ['audio/*']
        },
        {
            'name': 'avatars',
            'public': True,
            'file_size_limit': 5000000,  # 5MB
            'allowed_mime_types': ['image/*']
        },
        {
            'name': 'waveforms',
            'public': True,
            'file_size_limit': 1000000,  # 1MB
            'allowed_mime_types': ['image/png', 'image/svg+xml']
        }
    ]
    
    success = True
    
    # Create buckets
    for bucket in buckets:
        try:
            supabase.storage.create_bucket(
                bucket['name'],
                {'public': bucket['public'],
                 'file_size_limit': bucket['file_size_limit'],
                 'allowed_mime_types': bucket['allowed_mime_types']}
            )
            print(f"✅ Created bucket: {bucket['name']}")
        except Exception as e:
            if 'Duplicate' in str(e):
                print(f"ℹ️ Bucket already exists: {bucket['name']}")
            else:
                print(f"❌ Failed to create bucket {bucket['name']}: {str(e)}")
                success = False
    
    # Set up storage policies
    storage_policies = {
        'beats': [
            {
                'name': 'Private beats access',
                'definition': """
                    (auth.role() = 'authenticated' AND 
                     (auth.uid() = owner_id OR 
                      EXISTS (
                          SELECT 1 FROM beats b
                          JOIN collaborations c ON b.id = c.beat_id
                          WHERE b.storage_path = name
                          AND c.user_id = auth.uid()
                      )))
                """
            }
        ],
        'avatars': [
            {
                'name': 'Public avatar access',
                'definition': "true"
            }
        ],
        'waveforms': [
            {
                'name': 'Public waveform access',
                'definition': "true"
            }
        ]
    }
    
    # Apply storage policies
    for bucket_name, policies in storage_policies.items():
        try:
            for policy in policies:
                supabase.storage.update_bucket(
                    bucket_name,
                    {'public': bucket_name in ['avatars', 'waveforms']}
                )
                print(f"✅ Updated policy for bucket: {bucket_name}")
        except Exception as e:
            print(f"❌ Failed to update policy for bucket {bucket_name}: {str(e)}")
            success = False
    
    return success

if __name__ == '__main__':
    init_storage()