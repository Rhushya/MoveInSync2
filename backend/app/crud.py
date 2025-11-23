from typing import Any, Dict, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import models
from .auth import get_password_hash


async def create_tenant(db: AsyncSession, *, name: str) -> models.Tenant:
    tenant = models.Tenant(name=name)
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    return tenant


async def create_user(
    db: AsyncSession,
    *,
    email: str,
    password: str,
    tenant_id: int,
    role: str = "employee",
    is_admin: bool = False,
) -> models.User:
    hashed_password = get_password_hash(password)
    user = models.User(
        email=email,
        hashed_password=hashed_password,
        tenant_id=tenant_id,
        role=role,
        is_admin=is_admin,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[models.User]:
    result = await db.execute(select(models.User).where(models.User.email == email))
    return result.scalars().first()


async def create_vendor(db: AsyncSession, payload: Dict[str, Any]) -> models.Vendor:
    vendor = models.Vendor(**payload)
    db.add(vendor)
    await db.commit()
    await db.refresh(vendor)
    return vendor


async def get_vendor(db: AsyncSession, vendor_id: int) -> Optional[models.Vendor]:
    result = await db.execute(select(models.Vendor).where(models.Vendor.id == vendor_id))
    return result.scalars().first()


async def create_trip(db: AsyncSession, payload: Dict[str, Any]) -> models.Trip:
    trip = models.Trip(**payload)
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return trip
