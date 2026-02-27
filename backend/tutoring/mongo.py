import os
import certifi
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent / '.env')

_client = None

def get_db(db_name='Users'):
    global _client
    if _client is None:
        uri = os.environ.get('MONGODB_URI', '')
        if not uri:
            raise RuntimeError('MONGODB_URI is not set')
        _client = MongoClient(uri, tlsCAFile=certifi.where())
    return _client[db_name]
