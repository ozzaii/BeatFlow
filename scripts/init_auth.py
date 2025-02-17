#!/usr/bin/env python3
import os
from supabase import create_client, Client
import requests
from dotenv import load_dotenv

def init_auth():
    # Load environment variables
    load_dotenv()
    
    # Initialize Supabase client
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')  # Use service key for admin operations
    
    # Headers for admin API requests
    headers = {
        'Authorization': f'Bearer {supabase_key}',
        'apikey': supabase_key,
        'Content-Type': 'application/json'
    }
    
    # Get GitHub Pages URL
    site_url = os.getenv('GITHUB_PAGES_URL')
    
    # Configure authentication settings
    auth_config = {
        'SITE_URL': site_url,
        'ADDITIONAL_REDIRECT_URLS': [
            'http://localhost:3000',
            'http://localhost:5000',
            f"{site_url}/auth/callback",
            f"{site_url}/auth/reset-password",
            f"{site_url}/auth/confirm-email"
        ],
        'JWT_EXP': 3600,
        'DISABLE_SIGNUP': False,
        'ENABLE_EMAIL_SIGNUP': True,
        'ENABLE_EMAIL_AUTOCONFIRM': False,
        'ENABLE_PHONE_SIGNUP': False,
        'ENABLE_PHONE_AUTOCONFIRM': False,
        'MAILER_SECURE_EMAIL_CHANGE_ENABLED': True,
        'MAILER_SECURE_PASSWORD_CHANGE_ENABLED': True,
        'MAILER_URLPATHS_EMAIL_CONFIRM': '/auth/confirm-email',
        'MAILER_URLPATHS_PASSWORD_RESET': '/auth/reset-password',
        'MAILER_URLPATHS_EMAIL_CHANGE': '/auth/change-email',
        'MAILER_SUBJECTS_EMAIL_CONFIRM': 'Confirm your email for BeatFlow',
        'MAILER_SUBJECTS_PASSWORD_RESET': 'Reset your BeatFlow password',
        'MAILER_SUBJECTS_EMAIL_CHANGE': 'Confirm your new email for BeatFlow',
        'SECURITY_UPDATE_PASSWORD_REQUIRE_REAUTHENTICATION': True,
        'REFRESH_TOKEN_ROTATION_ENABLED': True,
        'SECURITY_CAPTCHA_ENABLED': True,
        'SECURITY_MANUAL_LINKING_ENABLED': False
    }
    
    # Configure OAuth providers
    oauth_providers = {
        'google': {
            'ENABLED': True,
            'CLIENT_ID': os.getenv('GOOGLE_CLIENT_ID'),
            'SECRET': os.getenv('GOOGLE_CLIENT_SECRET'),
            'REDIRECT_URI': f"{site_url}/auth/callback"
        },
        'github': {
            'ENABLED': True,
            'CLIENT_ID': os.getenv('GITHUB_CLIENT_ID'),
            'SECRET': os.getenv('GITHUB_CLIENT_SECRET'),
            'REDIRECT_URI': f"{site_url}/auth/callback"
        }
    }
    
    try:
        # Update auth settings
        response = requests.put(
            f"{supabase_url}/auth/v1/config",
            headers=headers,
            json=auth_config
        )
        response.raise_for_status()
        print("✅ Updated authentication settings")
        
        # Update OAuth providers
        for provider, config in oauth_providers.items():
            if config['CLIENT_ID'] and config['SECRET']:
                response = requests.put(
                    f"{supabase_url}/auth/v1/providers/{provider}",
                    headers=headers,
                    json=config
                )
                response.raise_for_status()
                print(f"✅ Configured {provider} authentication")
            else:
                print(f"⚠️ Skipping {provider} configuration (missing credentials)")
        
        print("\n🎉 Authentication configuration completed!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to configure authentication: {str(e)}")
        if hasattr(e, 'response'):
            print(f"Response details: {e.response.text if hasattr(e.response, 'text') else e.response}")
        return False

if __name__ == '__main__':
    init_auth() 