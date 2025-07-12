# Vector Microservice

A FastAPI microservice for PDF ingestion and semantic search using ChromaDB and LangChain.

---

## Features

✅ Upload and vectorize PDF documents  
✅ Store chunk embeddings in ChromaDB  
✅ Query documents semantically  
✅ Delete vectors for specific files  
✅ Built with modern Python tooling (`uv`, FastAPI)

---

## Project Structure

```
vector-micro-service/
│
├── app/
│ ├── controllers/ # FastAPI routes
│ ├── services/ # Business logic
│ ├── models/ # Pydantic models
│ ├── chroma_client.py # ChromaDB connection
│ └── main.py # FastAPI app entry point
│
├── vectorDB/ # ChromaDB persistent storage folder
├── pyproject.toml # Project metadata and dependencies
├── uv.lock # Locked dependency versions
└── README.md # You are here!
```



---

## Requirements

- Python >= 3.11
- [uv](https://pypi.org/project/uv/)

---

## Getting Started

### 1. Run Project directly using UV

Use [uv](https://pypi.org/project/uv/) for zero-hassle management,
let uv take care of dependency management for you!

```bash
uv run -m app.main
```

### 2. Create .env inside `app` folder
```ini
VECTOR_DB_PATH=/absolute/path/to/vectorDB/folder
COLLECTION_NAME=vectors_collection
```

### 3. API Endpoints


| Method | Endpoint     | Description               |
| ------ | ------------ | ------------------------- |
| POST   | `/vectorize` | Upload and vectorize PDF  |
| POST   | `/query`     | Query semantic search     |
| DELETE | `/delete`    | Delete vectors for a file |
| GET    | `/count`     | Count chunks for a file   |
| GET    | `/health`    | Health check              |





