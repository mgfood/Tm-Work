import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys

# Configuration
DB_HOST = "localhost"
DB_USER = "postgres"
DB_PASSWORD = "1020" # User provided this
DB_NAME = "tmwork_dev"

def create_database():
    print(f"[*] Connecting to PostgreSQL at {DB_HOST} as {DB_USER}...")
    try:
        # Connect to default 'postgres' database to create a new one
        con = psycopg2.connect(
            dbname="postgres",
            user=DB_USER,
            host=DB_HOST,
            password=DB_PASSWORD
        )
        con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = con.cursor()
        
        # Check if DB exists
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{DB_NAME}'")
        exists = cur.fetchone()
        
        if not exists:
            print(f"[*] Creating database '{DB_NAME}'...")
            cur.execute(f"CREATE DATABASE {DB_NAME}")
            print(f"[+] Database '{DB_NAME}' created successfully!")
        else:
            print(f"[!] Database '{DB_NAME}' already exists.")
            
        cur.close()
        con.close()
        return True
    except Exception as e:
        print(f"[-] Error: {e}")
        return False

if __name__ == "__main__":
    if create_database():
        sys.exit(0)
    else:
        sys.exit(1)
