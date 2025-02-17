#!/usr/bin/env python3
import httpx
from supabase import create_client, Client

def test_supabase_connection():
    # Use the anon key for public operations
    supabase_url = 'https://meeqydhemhnzpsvmqqrg.supabase.co'
    supabase_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZXF5ZGhlbWhuenBzdm1xcXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MDk3MzcsImV4cCI6MjA1NTM4NTczN30.mXUknvv5SBVgTDY8rJUSJrmJ19kqvHRC7QAoJHKYi1c'
    
    print(f"Testing Supabase connection...")
    print(f"URL: {supabase_url}")
    print(f"Key: {supabase_key[:10]}...")
    
    try:
        # Initialize the Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Test REST API connection
        print("\nTesting REST API connection...")
        headers = {
            'apikey': supabase_key,
            'Authorization': f'Bearer {supabase_key}'
        }
        response = httpx.get(f"{supabase_url}/rest/v1/", headers=headers)
        response.raise_for_status()
        print("✅ REST API connection successful!")
        
        # Test auth API configuration
        print("\nTesting Auth API...")
        try:
            supabase.auth.get_session()
        except Exception as auth_e:
            if "No current session" in str(auth_e):
                print("✅ Auth API connection successful!")
                print("No active session (expected)")
            else:
                raise auth_e
        
        # Test storage API
        print("\nTesting Storage API...")
        try:
            supabase.storage.list_buckets()
            print("✅ Storage API connection successful!")
            print("Storage service is available")
        except Exception as storage_e:
            if "No buckets found" in str(storage_e):
                print("✅ Storage API connection successful!")
                print("No buckets available (expected for new project)")
            else:
                raise storage_e
        
        print("\n🎉 All API connections successful!")
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        if hasattr(e, 'response'):
            print(f"Response details: {e.response.text if hasattr(e.response, 'text') else e.response}")
        return False

if __name__ == '__main__':
    test_supabase_connection() 