# backend/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from database import get_db
from routes import students,curriculum,batches,attendance,materials,batch_materials

app = FastAPI(title="Tuition Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the modular routes
app.include_router(students.router)
app.include_router(curriculum.router)
app.include_router(batches.router)
app.include_router(attendance.router)
app.include_router(materials.router)
app.include_router(batch_materials.router)

@app.get("/api/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "Backend is running", "database": "Connected"}
    except Exception as e:
        return {"status": "Backend is running", "database": f"Error: {str(e)}"}