import asyncio
import random
from datetime import datetime, timedelta

from ..auth import get_password_hash
from ..db import AsyncSessionLocal, Base, engine
from ..models import Tenant, Trip, User, Vendor


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        tenant = Tenant(name="AcmeCorp")
        session.add(tenant)
        await session.commit()
        await session.refresh(tenant)

        admin = User(
            email="admin@acme.com",
            hashed_password=get_password_hash("password"),
            tenant_id=tenant.id,
            is_admin=True,
            role="admin",
        )
        session.add(admin)
        vendor = Vendor(
            tenant_id=tenant.id,
            name="Vendor A",
            billing_model="trip",
            billing_config={"per_km": 2.0, "per_hour": 10.0, "extra_km_rate": 3.0},
        )
        session.add(vendor)
        await session.commit()
        await session.refresh(vendor)

        trips = []
        for _ in range(50):
            trips.append(
                Trip(
                    tenant_id=tenant.id,
                    vendor_id=vendor.id,
                    employee_id=admin.id,
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
