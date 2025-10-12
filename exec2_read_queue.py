#!/usr/bin/env python3
"""
EXECUTABLE 2: Read queue ID 24 and verify status
This verifies that the update from Executable 1 was successful.
"""

import psycopg2
from datetime import datetime

# Database connection parameters
DB_HOST = "aws-1-ap-southeast-1.pooler.supabase.com"
DB_PORT = 6543
DB_NAME = "postgres"
DB_USER = "postgres.cztmiiztlmhdhrnbutpy"
DB_PASSWORD = "IloveOOP@123"

def read_queue_status():
    """Read queue ID 24 and check status"""
    conn = None
    cursor = None
    
    try:
        print("=" * 80)
        print("EXECUTABLE 2: READ QUEUE 24 STATUS")
        print("=" * 80)
        print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Connect
        print(f"Connecting to {DB_HOST}:{DB_PORT}...")
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            sslmode='require'
        )
        print("✓ Connected\n")
        
        cursor = conn.cursor()
        
        # Execute SELECT
        print("Executing SELECT query...")
        print("SQL: SELECT id, clinic_id, queue_status, created_at, updated_at FROM queues WHERE id = 24")
        print()
        
        select_query = """
            SELECT id, clinic_id, queue_status, created_at, updated_at
            FROM queues
            WHERE id = %s
        """
        
        cursor.execute(select_query, (24,))
        result = cursor.fetchone()
        
        if result:
            queue_id, clinic_id, queue_status, created_at, updated_at = result
            
            print("✓ RECORD FOUND:")
            print(f"   Queue ID:      {queue_id}")
            print(f"   Clinic ID:     {clinic_id}")
            print(f"   Queue Status:  {queue_status}")
            print(f"   Created At:    {created_at}")
            print(f"   Updated At:    {updated_at}")
            print()
            
            print("=" * 80)
            if queue_status == 'PAUSED':
                print("✅ VERIFICATION SUCCESSFUL - Queue status is PAUSED")
                print("=" * 80)
                return True
            else:
                print(f"❌ VERIFICATION FAILED - Queue status is '{queue_status}', NOT 'PAUSED'")
                print("=" * 80)
                return False
        else:
            print("❌ Queue ID 24 not found")
            return False
            
    except psycopg2.Error as e:
        print(f"❌ DATABASE ERROR: {e}")
        return False
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            print("Connection closed\n")

if __name__ == "__main__":
    success = read_queue_status()
    exit(0 if success else 1)
