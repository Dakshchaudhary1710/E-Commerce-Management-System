import os
import mysql.connector
from mysql.connector import Error, pooling
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "ecommerce_db")

connection_pool = None

def init_connection_pool():
    global connection_pool
    try:
        connection_pool = pooling.MySQLConnectionPool(
            pool_name="ecommerce_pool",
            pool_size=5,
            pool_reset_session=True,
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset="utf8mb4",
            autocommit=False
        )
        return True
    except Error as e:
        print(f"Error initializing MySQL connection pool: {e}")
        return False

def get_db_connection():
    global connection_pool
    if connection_pool is None:
        init_connection_pool()
    
    if connection_pool:
        try:
            return connection_pool.get_connection()
        except Error:
            pass
            
    # Direct fallback if pool is exhausted or unavailable
    return mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset="utf8mb4",
        autocommit=False
    )

def execute_query(query, params=None, fetch_one=False, fetch_all=True, commit=False):
    """
    Executes a read or simple single-statement write query safely with dictionary cursor.
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params or ())
        if commit:
            conn.commit()
            last_id = cursor.lastrowid
            row_count = cursor.rowcount
            return {"last_id": last_id, "row_count": row_count}
        
        if fetch_one:
            return cursor.fetchone()
        if fetch_all:
            return cursor.fetchall()
        return None
    finally:
        cursor.close()
        conn.close()
