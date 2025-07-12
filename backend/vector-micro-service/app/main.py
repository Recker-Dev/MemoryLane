from fastapi import FastAPI
from app.controllers.routes import router as vector_router
from app.controllers.health import router as health_router

app = FastAPI(title="VectorDB Service")

# Mount all routers
app.include_router(vector_router, prefix="/vectorDb", tags=["VectorDb Operations"])
app.include_router(health_router, prefix="/health", tags=["Health Check"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=False)
