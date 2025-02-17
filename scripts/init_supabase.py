#!/usr/bin/env python3
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
import requests

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_migrations():
    """Run database migrations using Supabase REST API"""
    try:
        logger.info("Running database migrations...")
        
        # Initialize Supabase client
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        
        if not all([supabase_url, supabase_key]):
            logger.error("Missing required environment variables")
            return False
        
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Get migration files
        migrations_dir = Path(__file__).parent.parent / 'migrations' / 'versions'
        migration_files = sorted([f for f in migrations_dir.glob('*.sql')])
        
        if not migration_files:
            logger.info("No migration files found")
            return True
        
        # Run each migration file
        for migration_file in migration_files:
            try:
                with open(migration_file, 'r') as f:
                    sql = f.read()
                    
                # Execute migration using REST API
                response = requests.post(
                    f"{supabase_url}/rest/v1/rpc/exec_sql",
                    headers={
                        'apikey': supabase_key,
                        'Authorization': f'Bearer {supabase_key}',
                        'Content-Type': 'application/json'
                    },
                    json={'sql': sql}
                )
                response.raise_for_status()
                logger.info(f"✅ Applied migration: {migration_file.name}")
                
            except Exception as e:
                logger.error(f"Failed to apply migration {migration_file.name}: {str(e)}")
                return False
        
        logger.info("✅ Database migrations completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to run migrations: {str(e)}")
        return False

def init_storage():
    """Initialize storage buckets"""
    try:
        logger.info("Initializing storage buckets...")
        
        # Import and run storage initialization
        from init_storage import init_storage
        success = init_storage()
        
        if success:
            logger.info("✅ Storage buckets initialized successfully")
        else:
            logger.error("❌ Storage initialization failed")
            return False
            
        return True
    except Exception as e:
        logger.error(f"❌ Failed to initialize storage: {str(e)}")
        return False

def init_auth():
    """Configure authentication"""
    try:
        logger.info("Configuring authentication...")
        
        # Import and run auth configuration
        from init_auth import init_auth
        success = init_auth()
        
        if success:
            logger.info("✅ Authentication configured successfully")
        else:
            logger.error("❌ Authentication configuration failed")
            return False
            
        return True
    except Exception as e:
        logger.error(f"❌ Failed to configure authentication: {str(e)}")
        return False

def main():
    """Run complete initialization process"""
    try:
        # Load environment variables
        load_dotenv()
        
        # Ensure required environment variables are set
        required_vars = [
            'SUPABASE_URL',
            'SUPABASE_KEY',
            'SUPABASE_SERVICE_KEY',
            'GOOGLE_CLIENT_ID',
            'GOOGLE_CLIENT_SECRET',
            'GITHUB_CLIENT_ID',
            'GITHUB_CLIENT_SECRET'
        ]
        
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        if missing_vars:
            logger.error(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
            sys.exit(1)
        
        # Run initialization steps
        steps = [
            ("Database migrations", run_migrations),
            ("Storage initialization", init_storage),
            ("Authentication configuration", init_auth)
        ]
        
        for step_name, step_func in steps:
            logger.info(f"\n🔄 Running {step_name}...")
            if not step_func():
                logger.error(f"❌ {step_name} failed")
                sys.exit(1)
            logger.info(f"✅ {step_name} completed successfully")
        
        logger.info("\n🎉 Supabase project initialized successfully!")
        sys.exit(0)
        
    except Exception as e:
        logger.error(f"❌ Initialization failed: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()