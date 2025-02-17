#!/usr/bin/env python3
import os
import psycopg2
from dotenv import load_dotenv

def test_db_connection():
    # Load environment variables
    load_dotenv()
    
    # Get database URL
    db_url = os.getenv('SUPABASE_DB_URL')
    print(f"Testing database connection...")
    
    try:
        # Connect to the database
        conn = psycopg2.connect(db_url)
        print("✅ Database connection successful!")
        
        # Test query
        with conn.cursor() as cur:
            cur.execute("SELECT version();")
            version = cur.fetchone()[0]
            print(f"Database version: {version}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

if __name__ == '__main__':
    test_db_connection() 