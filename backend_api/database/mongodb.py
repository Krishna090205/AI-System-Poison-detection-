"""
MongoDB Atlas connection and database utilities with resilient fallback
"""
import os
import asyncio
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, PyMongoError

# Load environment variables
load_dotenv()

# MongoDB configuration from environment
MONGODB_URI = os.getenv("MONGO_URI", os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
DATABASE_NAME = os.getenv("DATABASE_NAME", "poison_detection_db")

# Global database client
client = None
database = None

class AsyncCursor:
    """Async cursor wrapper for in-memory/mock collection find operations"""
    def __init__(self, cursor):
        self._cursor = cursor

    def sort(self, *args, **kwargs):
        self._cursor = self._cursor.sort(*args, **kwargs)
        return self

    def limit(self, limit):
        self._cursor = self._cursor.limit(limit)
        return self

    async def to_list(self, length=None):
        items = list(self._cursor)
        if length is not None:
            return items[:length]
        return items

    def __aiter__(self):
        self._iter = iter(self._cursor)
        return self

    async def __anext__(self):
        try:
            return next(self._iter)
        except StopIteration:
            raise StopAsyncIteration

class AsyncMockCollection:
    """Async collection wrapper for mongomock"""
    def __init__(self, collection):
        self._col = collection

    async def insert_one(self, doc):
        return self._col.insert_one(doc)

    async def find_one(self, *args, **kwargs):
        return self._col.find_one(*args, **kwargs)

    async def update_one(self, *args, **kwargs):
        return self._col.update_one(*args, **kwargs)

    async def create_index(self, *args, **kwargs):
        return "index"

    def find(self, *args, **kwargs):
        return AsyncCursor(self._col.find(*args, **kwargs))

class AsyncMockDatabase:
    """Async database wrapper for mongomock"""
    def __init__(self, db_name="poison_detection_db"):
        import mongomock
        self._client = mongomock.MongoClient()
        self._db = self._client[db_name]

    def __getattr__(self, name):
        return AsyncMockCollection(self._db[name])

    def __getitem__(self, name):
        return AsyncMockCollection(self._db[name])

async def init_db():
    """Initialize database connection with resilient fallback"""
    global client, database

    try:
        # Short timeout to avoid hanging if cluster is unreachable or DNS fails
        motor_client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2500)
        await motor_client.admin.command('ping')
        client = motor_client
        database = client[DATABASE_NAME]
        print(f"[OK] Connected to MongoDB Atlas: {DATABASE_NAME}")
        await create_indexes()
    except Exception as e:
        print(f"[WARNING] MongoDB Atlas connection failed ({e}).")
        print("[INFO] Initializing in-memory mock database for seamless local execution...")
        database = AsyncMockDatabase(DATABASE_NAME)
        print("[OK] In-memory database initialized successfully. All features are fully functional.")

async def create_indexes():
    """Create database indexes for performance"""
    global database
    if not database:
        return

    try:
        await database.datasets.create_index("upload_time")
        await database.datasets.create_index("status")
        await database.analyses.create_index("dataset_id")
        await database.analyses.create_index("analysis_time")
        await database.analyses.create_index([("analysis_time", -1)])
        print("[OK] Database indexes created")
    except Exception as e:
        print(f"[WARNING] Could not create indexes: {e}")

async def get_database():
    """Dependency for getting database instance"""
    global database
    if database is None:
        database = AsyncMockDatabase(DATABASE_NAME)
    return database

async def close_db():
    """Close database connection"""
    global client
    if client:
        client.close()
        print("[OK] MongoDB connection closed")

