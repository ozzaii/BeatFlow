 
import os
import sys
from pathlib import Path
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import logging
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MigrationRunner:
    def __init__(self):
        load_dotenv()
        
        # Get Supabase connection details
        self.db_url = os.getenv('SUPABASE_DB_URL')
        if not self.db_url:
            raise ValueError("SUPABASE_DB_URL environment variable is required")
            
        self.migrations_dir = Path(__file__).parent.parent / 'migrations' / 'versions'
        self.conn = None
        
    def connect(self):
        """Connect to the database"""
        try:
            self.conn = psycopg2.connect(self.db_url)
            self.conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            logger.info("Connected to database successfully")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            sys.exit(1)
            
    def get_migration_files(self):
        """Get sorted list of migration files"""
        migration_files = []
        for file in self.migrations_dir.glob('*.sql'):
            if file.name.startswith(('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')):
                migration_files.append(file)
        return sorted(migration_files)
        
    def create_migrations_table(self):
        """Create migrations table if it doesn't exist"""
        try:
            with self.conn.cursor() as cur:
                cur.execute("""
                    create table if not exists migrations (
                        id serial primary key,
                        name text not null unique,
                        applied_at timestamp with time zone default current_timestamp
                    )
                """)
            logger.info("Migrations table ready")
        except Exception as e:
            logger.error(f"Failed to create migrations table: {e}")
            sys.exit(1)
            
    def get_applied_migrations(self):
        """Get list of already applied migrations"""
        try:
            with self.conn.cursor() as cur:
                cur.execute("select name from migrations")
                return {row[0] for row in cur.fetchall()}
        except Exception as e:
            logger.error(f"Failed to get applied migrations: {e}")
            return set()
            
    def apply_migration(self, migration_file):
        """Apply a single migration file"""
        try:
            # Read migration file
            with open(migration_file, 'r') as f:
                sql = f.read()
                
            # Execute migration in a transaction
            with self.conn.cursor() as cur:
                cur.execute("begin")
                try:
                    # Execute migration
                    cur.execute(sql)
                    
                    # Record migration
                    cur.execute(
                        "insert into migrations (name) values (%s)",
                        (migration_file.name,)
                    )
                    
                    cur.execute("commit")
                    logger.info(f"Applied migration: {migration_file.name}")
                    return True
                    
                except Exception as e:
                    cur.execute("rollback")
                    logger.error(f"Failed to apply migration {migration_file.name}: {e}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error reading migration file {migration_file.name}: {e}")
            return False
            
    def run_migrations(self):
        """Run all pending migrations"""
        try:
            self.connect()
            self.create_migrations_table()
            
            applied_migrations = self.get_applied_migrations()
            migration_files = self.get_migration_files()
            
            if not migration_files:
                logger.info("No migration files found")
                return True
                
            success = True
            for migration_file in migration_files:
                if migration_file.name not in applied_migrations:
                    logger.info(f"Applying migration: {migration_file.name}")
                    if not self.apply_migration(migration_file):
                        success = False
                        break
                else:
                    logger.info(f"Skipping already applied migration: {migration_file.name}")
                    
            if success:
                logger.info("All migrations completed successfully")
            else:
                logger.error("Migration failed")
                
            return success
            
        except Exception as e:
            logger.error(f"Unexpected error during migration: {e}")
            return False
            
        finally:
            if self.conn:
                self.conn.close()
                
    def rollback_migration(self, migration_name):
        """Rollback a specific migration"""
        try:
            self.connect()
            
            with self.conn.cursor() as cur:
                # Check if migration exists
                cur.execute(
                    "select exists(select 1 from migrations where name = %s)",
                    (migration_name,)
                )
                if not cur.fetchone()[0]:
                    logger.error(f"Migration {migration_name} not found")
                    return False
                    
                # Start transaction
                cur.execute("begin")
                try:
                    # Remove migration record
                    cur.execute(
                        "delete from migrations where name = %s",
                        (migration_name,)
                    )
                    
                    # Execute rollback file if exists
                    rollback_file = self.migrations_dir / f"rollback_{migration_name}"
                    if rollback_file.exists():
                        with open(rollback_file, 'r') as f:
                            cur.execute(f.read())
                            
                    cur.execute("commit")
                    logger.info(f"Rolled back migration: {migration_name}")
                    return True
                    
                except Exception as e:
                    cur.execute("rollback")
                    logger.error(f"Failed to rollback migration {migration_name}: {e}")
                    return False
                    
        except Exception as e:
            logger.error(f"Unexpected error during rollback: {e}")
            return False
            
        finally:
            if self.conn:
                self.conn.close()

def main():
    runner = MigrationRunner()
    
    if len(sys.argv) > 1 and sys.argv[1] == 'rollback':
        if len(sys.argv) != 3:
            logger.error("Please specify migration name to rollback")
            sys.exit(1)
        success = runner.rollback_migration(sys.argv[2])
    else:
        success = runner.run_migrations()
        
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()