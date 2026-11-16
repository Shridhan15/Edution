# backend/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from sqlalchemy.future import select

# Import our custom modules
from database import get_db
import models
import schemas

app = FastAPI(title="Tuition Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "Backend is running", "database": "Connected to Supabase PostgreSQL"}
    except Exception as e:
        return {"status": "Backend is running", "database": f"Connection failed: {str(e)}"}

# --- NEW STUDENT ENDPOINTS ---

@app.post("/api/students", response_model=schemas.StudentResponse)
async def create_student(student: schemas.StudentCreate, db: AsyncSession = Depends(get_db)):
    # Convert the Pydantic model to a SQLAlchemy model
    new_student = models.Student(**student.model_dump())
    db.add(new_student)
    await db.commit()
    await db.refresh(new_student)
    return new_student

@app.get("/api/students", response_model=list[schemas.StudentResponse])
async def get_students(db: AsyncSession = Depends(get_db)):
    # Fetch all students from the database
    result = await db.execute(select(models.Student))
    return result.scalars().all()