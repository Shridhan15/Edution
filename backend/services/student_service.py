from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import models
import schemas
from fastapi import HTTPException, UploadFile
from services import storage_service

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


async def update_student(db: AsyncSession, student_id: str, student_update: schemas.StudentUpdate):
    student = await get_student_by_id(db, student_id)
    
    update_data = student_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)
        
    await db.commit()
    await db.refresh(student)
    return student




async def update_student_photo(db: AsyncSession, student_id: str, file: UploadFile):
    student = await get_student_by_id(db, student_id)
    photo_url = await storage_service.upload_student_photo(student_id, file)
    
    student.photo_url = photo_url
    await db.commit()
    await db.refresh(student)
    return student


async def delete_student(db: AsyncSession, student_id: str):
    student = await get_student_by_id(db, student_id)

    await db.delete(student)
    await db.commit()

    # Best-effort cleanup of storage files so a storage hiccup doesn't break the response
    try:
        storage_service.delete_student_folder(student_id)
    except Exception as e:
        print(f"Warning: failed to clean up storage for student {student_id}: {e}")