from typing import Any, Dict, List, Optional

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


async def list_users_by_tenant(db: AsyncSession, tenant_id: int) -> List[models.User]:
    result = await db.execute(select(models.User).where(models.User.tenant_id == tenant_id).order_by(models.User.email))
    return result.scalars().all()


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


async def list_trips_for_tenant(
    db: AsyncSession,
    *,
    tenant_id: int,
    employee_id: Optional[int] = None,
) -> List[models.Trip]:
    stmt = select(models.Trip).where(models.Trip.tenant_id == tenant_id).order_by(models.Trip.date.desc())
    if employee_id is not None:
        stmt = stmt.where(models.Trip.employee_id == employee_id)
    result = await db.execute(stmt)
    return result.scalars().all()
