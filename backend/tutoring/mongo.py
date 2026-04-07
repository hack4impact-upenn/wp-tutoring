import os
import certifi
from pymongo import MongoClient, ASCENDING
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


def ensure_draft_migration(db=None):
    """One-time migration: assign any existing matches without a draft_id to an 'Initial Draft'.

    Safe to call on every startup — it is a no-op when no orphan matches exist.
    Also ensures the compound index on matches for draft queries.
    """
    from tutoring.common import current_semester, now_iso

    if db is None:
        db = get_db()

    # Ensure compound index for draft-scoped queries
    db.matches.create_index(
        [("draft_id", ASCENDING), ("semester", ASCENDING), ("status", ASCENDING)],
        name="draft_semester_status",
        background=True,
    )

    orphan_count = db.matches.count_documents({"draft_id": {"$exists": False}})
    if orphan_count == 0:
        return

    semester = current_semester()
    draft_doc = {
        "name": "Initial Draft",
        "semester": semester,
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    result = db.matching_drafts.insert_one(draft_doc)
    db.matches.update_many(
        {"draft_id": {"$exists": False}},
        {"$set": {"draft_id": result.inserted_id}},
    )
