#!/usr/bin/env python3
"""
EXECUTABLE 1: Update queue ID 24 to PAUSED status
This simulates what the frontend Pause Queue button should do.
"""

import psycopg2
from datetime import datetime

# Database connection parameters
DB_HOST = "aws-1-ap-southeast-1.pooler.supabase.com"
DB_PORT = 6543
DB_NAME = "postgres"
DB_USER = "postgres.cztmiiztlmhdhrnbutpy"
DB_PASSWORD = "IloveOOP@123"

def update_queue_to_paused():
    """Update queue ID 24 to PAUSED status"""
    conn = None
    cursor = None
    
    try:
        print("=" * 80)
        print("EXECUTABLE 1: UPDATE QUEUE 24 TO PAUSED")
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
        
        # Execute UPDATE
        print("Executing UPDATE query...")
        print("SQL: UPDATE queues SET queue_status = 'PAUSED', updated_at = NOW() WHERE id = 24")
        print()
        
        update_query = """
            UPDATE queues
            SET queue_status = %s, updated_at = NOW()
            WHERE id = %s
            RETURNING id, clinic_id, queue_status, updated_at
        """
        
        cursor.execute(update_query, ('PAUSED', 24))
        result = cursor.fetchone()
        conn.commit()
        
        if result:
            print("✅ UPDATE SUCCESSFUL!")
            print(f"   Queue ID:      {result[0]}")
            print(f"   Clinic ID:     {result[1]}")
            print(f"   Queue Status:  {result[2]}")
            print(f"   Updated At:    {result[3]}")
            print()
            print("=" * 80)
            print("RESULT: SUCCESS - Queue 24 updated to PAUSED")
            print("=" * 80)
            return True
        else:
            print("❌ UPDATE FAILED - No rows returned")
            return False
            
    except psycopg2.Error as e:
        print(f"❌ DATABASE ERROR: {e}")
        if conn:
            conn.rollback()
        return False
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        if conn:
            conn.rollback()
        return False
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            print("Connection closed\n")

if __name__ == "__main__":
    success = update_queue_to_paused()
    exit(0 if success else 1)
