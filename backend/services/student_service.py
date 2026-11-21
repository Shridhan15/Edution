from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import models
import schemas
from fastapi import HTTPException


async def get_default_organization(db: AsyncSession):
    # Grab the first organization in the database
    result = await db.execute(select(models.Organization).limit(1))
    org = result.scalars().first()
    
    # If none exists yet, automatically create one
    if not org:
        org = models.Organization(name="EduNova Default Center")
        db.add(org)
        await db.commit()
        await db.refresh(org)
        
    return org

async def create_student(db: AsyncSession, student: schemas.StudentCreate):
    # 1. Get the default organization automatically
    org = await get_default_organization(db)
    
    # 2. Convert incoming data to a dictionary and inject the organization_id
    student_data = student.model_dump()
    student_data["organization_id"] = org.id
    
    # 3. Save to database
    new_student = models.Student(**student_data)
    db.add(new_student)
    await db.commit()
    await db.refresh(new_student)
    return new_student

async def get_all_students(db: AsyncSession):
    result = await db.execute(select(models.Student))
    return result.scalars().all()



async def get_student_by_id(db: AsyncSession, student_id: str):
    result = await db.execute(select(models.Student).where(models.Student.id == student_id))
    student = result.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student