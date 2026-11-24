import asyncio
import random
from datetime import date, timedelta
from dotenv import load_dotenv
from sqlalchemy.future import select

load_dotenv()

from database import get_db
import models
from services.student_service import get_default_organization

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
    "Krishna", "Ishaan", "Ananya", "Diya", "Saanvi", "Aadhya", "Kiara", "Pari",
    "Myra", "Navya", "Riya", "Kavya", "Rohan", "Kabir", "Dev", "Pranav",
    "Sneha", "Tanvi", "Meera", "Nisha", "Harsh", "Yash"
]

LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Mishra", "Yadav",
    "Chauhan", "Joshi", "Nair", "Reddy", "Mehta", "Agarwal", "Tiwari"
]

PARENT_FIRST_NAMES = [
    "Rajesh", "Suresh", "Amit", "Vikram", "Sanjay", "Manoj", "Deepak", "Rakesh",
    "Sunita", "Anita", "Pooja", "Rekha", "Meena", "Neha", "Alok", "Pankaj"
]


async def seed_students(count: int = 30):
    async for db in get_db():
        org = await get_default_organization(db)

        # Fetch existing classes so students get distributed across them
        result = await db.execute(select(models.Class))
        classes = result.scalars().all()
        class_ids = [c.id for c in classes]

        if not class_ids:
            print("⚠️ No classes found. Students will be created as Unassigned.")

        students_to_add = []
        today = date.today()

        for i in range(count):
            first = FIRST_NAMES[i % len(FIRST_NAMES)]
            last = random.choice(LAST_NAMES)
            parent_first = random.choice(PARENT_FIRST_NAMES)

            student = models.Student(
                organization_id=org.id,
                class_id=random.choice(class_ids) if class_ids else None,
                full_name=f"{first} {last}",
                parent_name=f"{parent_first} {last}",
                parent_phone=f"9{random.randint(100000000, 999999999)}",
                status="INACTIVE" if i in (28, 29) else "ACTIVE",
                joining_date=today - timedelta(days=random.randint(0, 60)),
            )
            students_to_add.append(student)

        db.add_all(students_to_add)
        await db.commit()
        print(f"✅ Successfully seeded {count} students across {len(class_ids)} classes.")
        break


if __name__ == "__main__":
    asyncio.run(seed_students(30))