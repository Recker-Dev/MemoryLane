import os
import chromadb
from dotenv import load_dotenv

load_dotenv()

VECTOR_DB_PATH = os.getenv("VECTOR_DB_PATH")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")

if not VECTOR_DB_PATH or not COLLECTION_NAME:
    raise ValueError("Missing VECTOR_DB_PATH or COLLECTION_NAME in environment variables.")

try:
    client = chromadb.PersistentClient(path=VECTOR_DB_PATH)
    collection = client.get_or_create_collection(name=COLLECTION_NAME)
except Exception as e:
    raise RuntimeError(f"Failed to initialize ChromaDB collection: {str(e)}")
