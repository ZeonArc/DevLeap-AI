import os
import asyncpg
from urllib.parse import urlparse, parse_qs
from dotenv import load_dotenv

load_dotenv()

pool = None

async def connect_db():
    global pool
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("WARNING: DATABASE_URL is not set! DB features will be disabled.")
        return
    
    # asyncpg doesn't understand ?sslmode=require from Prisma DSN.
    # Strip it and pass ssl=True directly.
    clean_url = db_url.split("?")[0] if "?" in db_url else db_url
    
    try:
        pool = await asyncpg.create_pool(dsn=clean_url, ssl=True)
        print("Connected to PostgreSQL via asyncpg")
    except Exception as e:
        print(f"WARNING: Failed to connect to database: {e}")
        pool = None

async def disconnect_db():
    global pool
    if pool:
        await pool.close()
        print("Closed DB connection")

def get_db():
    return pool
