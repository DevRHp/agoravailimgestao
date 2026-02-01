import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/patrimonio_new')

client = None
db = None

def init_db():
    global client, db
    if not client:
        try:
            client = MongoClient(MONGO_URI)
            db = client.get_database()
            print(f" * Connected to MongoDB at {MONGO_URI}")
        except Exception as e:
            print(f" * Failed to connect to MongoDB: {e}")
            raise e

def get_db():
    if not db:
        init_db()
    return db
