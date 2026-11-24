import asyncio
import random
from dotenv import load_dotenv
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

load_dotenv()

from database import get_db
import models


async def assign_students_to_batches():
    async for db in get_db():
        batches_res = await db.execute(select(models.Batch).order_by(models.Batch.start_time))
        batches = batches_res.scalars().all()

        students_res = await db.execute(select(models.Student))
        students = students_res.scalars().all()

        if not batches:
            print("⚠️ No batches found. Create batches first.")
            return
        if not students:
            print("⚠️ No students found. Run seed_students.py first.")
            return

        # Shuffle students for a natural mix, then distribute evenly across batches
        random.shuffle(students)
        rows = []
        counts = {batch.name: 0 for batch in batches}

        for idx, student in enumerate(students):
            batch = batches[idx % len(batches)]
            rows.append({
                "batch_id": batch.id,
                "student_id": student.id,
            })
            counts[batch.name] += 1

        stmt = pg_insert(models.BatchStudent).values(rows).on_conflict_do_nothing()
        await db.execute(stmt)
        await db.commit()

        print(f"✅ Assigned {len(students)} students across {len(batches)} batches:")
        for name, count in counts.items():
            print(f"   • {name}: {count} students")
        break


if __name__ == "__main__":
    asyncio.run(assign_students_to_batches())