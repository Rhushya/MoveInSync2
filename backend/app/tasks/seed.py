import asyncio
import random
from datetime import datetime, timedelta

from sqlalchemy import delete

from ..auth import get_password_hash
from ..db import AsyncSessionLocal, Base, engine
from ..models import InvoiceRow, Tenant, Trip, User, Vendor


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Reset existing data so credentials are deterministic
        for model in (InvoiceRow, Trip, Vendor, User, Tenant):
            await session.execute(delete(model))
        await session.commit()

        tenant = Tenant(name="AcmeCorp")
        session.add(tenant)
        await session.commit()
        await session.refresh(tenant)

        admins = []
        for idx in range(1, 4):
            admin = User(
                email=f"admin{idx}@acme.com",
                hashed_password=get_password_hash("123"),
                tenant_id=tenant.id,
                is_admin=True,
                role="admin",
            )
            admins.append(admin)
            session.add(admin)

        primary_admin = User(
            email="admin@acme.com",
            hashed_password=get_password_hash("123"),
            tenant_id=tenant.id,
            is_admin=True,
            role="admin",
        )
        session.add(primary_admin)

        vendor = Vendor(
            tenant_id=tenant.id,
            name="Vendor A",
            billing_model="trip",
            billing_config={"per_km": 2.0, "per_hour": 10.0, "extra_km_rate": 3.0},
        )
        session.add(vendor)
        await session.commit()
        await session.refresh(vendor)
        await session.refresh(primary_admin)

        trips = []
        main_employee_id = primary_admin.id
        for _ in range(50):
            trips.append(
                Trip(
                    tenant_id=tenant.id,
                    vendor_id=vendor.id,
                    employee_id=main_employee_id,
                    distance_km=random.uniform(5.0, 20.0),
                    duration_minutes=random.randint(10, 60),
                    date=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                    extra_km=random.choice([0, 1, 2]),
                    extra_hours=random.choice([0, 1]),
                    payload={},
                )
            )
        session.add_all(trips)
        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())
