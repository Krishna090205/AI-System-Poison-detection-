"""
MongoDB Atlas connection and database utilities with resilient fallback and persistent disk caching
"""
import os
import asyncio
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, PyMongoError
from bson import json_util

# Load environment variables
load_dotenv()

# MongoDB configuration from environment
MONGODB_URI = os.getenv("MONGO_URI", os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
DATABASE_NAME = os.getenv("DATABASE_NAME", "poison_detection_db")
LOCAL_BACKUP_PATH = os.path.join(os.path.dirname(__file__), "persistent_history.json")

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
    """Async collection wrapper for mongomock with persistent disk backing"""
    def __init__(self, collection, parent_db=None):
        self._col = collection
        self._parent_db = parent_db

    def _save_to_disk(self):
        if self._parent_db is not None:
            self._parent_db.save_to_disk()

    async def insert_one(self, doc):
        res = self._col.insert_one(doc)
        self._save_to_disk()
        return res

    async def find_one(self, *args, **kwargs):
        return self._col.find_one(*args, **kwargs)

    async def update_one(self, *args, **kwargs):
        res = self._col.update_one(*args, **kwargs)
        self._save_to_disk()
        return res

    async def create_index(self, *args, **kwargs):
        return "index"

    def find(self, *args, **kwargs):
        return AsyncCursor(self._col.find(*args, **kwargs))

class AsyncMockDatabase:
    """Async database wrapper for mongomock with persistent disk caching"""
    def __init__(self, db_name="poison_detection_db"):
        import mongomock
        self._client = mongomock.MongoClient()
        self._db = self._client[db_name]
        self._load_from_disk()

    def _load_from_disk(self):
        """Restore all past analyses and datasets from local JSON cache on startup"""
        if os.path.exists(LOCAL_BACKUP_PATH):
            try:
                with open(LOCAL_BACKUP_PATH, "r", encoding="utf-8") as f:
                    data = json_util.loads(f.read())
                    total_docs = 0
                    for col_name, docs in data.items():
                        if docs:
                            self._db[col_name].insert_many(docs)
                            total_docs += len(docs)
                print(f"[OK] Restored {total_docs} historical records from persistent disk cache: {LOCAL_BACKUP_PATH}")
            except Exception as e:
                print(f"[WARNING] Could not restore from disk cache: {e}")

    def save_to_disk(self):
        """Persist collections to disk so history is never lost across server restarts"""
        try:
            dump_data = {}
            for col_name in ["datasets", "analyses", "cleaned_datasets"]:
                dump_data[col_name] = list(self._db[col_name].find())
            with open(LOCAL_BACKUP_PATH, "w", encoding="utf-8") as f:
                f.write(json_util.dumps(dump_data, indent=2))
        except Exception as e:
            print(f"[WARNING] Could not save database backup to disk: {e}")

    def __getattr__(self, name):
        return AsyncMockCollection(self._db[name], parent_db=self)

    def __getitem__(self, name):
        return AsyncMockCollection(self._db[name], parent_db=self)

async def init_db():
    """Initialize database connection with resilient fallback and persistent sync"""
    global client, database

    try:
        motor_client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2500)
        await motor_client.admin.command('ping')
        client = motor_client
        database = client[DATABASE_NAME]
        print(f"[OK] Connected to MongoDB Atlas: {DATABASE_NAME}")
        await create_indexes()

        # Sync from Atlas to local persistent disk cache as offline safety net
        asyncio.create_task(sync_atlas_to_disk(database))
    except Exception as e:
        print(f"[WARNING] MongoDB Atlas connection failed ({e}).")
        print("[INFO] Initializing persistent local disk database for seamless offline execution...")
        database = AsyncMockDatabase(DATABASE_NAME)
        print("[OK] Persistent database initialized. All past history and features are fully functional.")

async def sync_atlas_to_disk(db):
    """Background task to sync Atlas data to local disk cache"""
    try:
        dump_data = {}
        for col_name in ["datasets", "analyses", "cleaned_datasets"]:
            cursor = db[col_name].find()
            docs = await cursor.to_list(length=1000)
            dump_data[col_name] = docs
        with open(LOCAL_BACKUP_PATH, "w", encoding="utf-8") as f:
            f.write(json_util.dumps(dump_data, indent=2))
        print(f"[OK] Synced {sum(len(d) for d in dump_data.values())} records from Atlas to local persistent storage")
    except Exception as e:
        print(f"[WARNING] Background sync to local disk failed: {e}")

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
