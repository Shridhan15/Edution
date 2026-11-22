import os
import time
from fastapi import UploadFile, HTTPException
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2 MB

async def upload_student_photo(student_id: str, file: UploadFile) -> str:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed.")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be smaller than 2MB.")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "jpg"
    file_path = f"{student_id}/avatar.{ext}"

    # upsert=true overwrites the previous photo so old files don't pile up
    supabase.storage.from_("student-photos").upload(
        path=file_path,
        file=contents,
        file_options={"content-type": file.content_type, "upsert": "true"},
    )

    public_url = supabase.storage.from_("student-photos").get_public_url(file_path)
    
    # Append timestamp for browser cache-busting
    return f"{public_url}?t={int(time.time())}"



def delete_student_folder(student_id: str):
    files = supabase.storage.from_("student-photos").list(path=student_id)
    if files:
        paths = [f"{student_id}/{f['name']}" for f in files]
        supabase.storage.from_("student-photos").remove(paths)