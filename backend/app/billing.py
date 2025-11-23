from __future__ import annotations

from typing import Dict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import InvoiceRow, Trip, Vendor


async def compute_trip_amount(vendor: Vendor, trip: Trip) -> float:
    cfg: Dict[str, float] = vendor.billing_config or {}
    model = vendor.billing_model
    amount = 0.0

    if model == "trip":
        amount += trip.distance_km * cfg.get("per_km", 1.0)
        amount += (trip.duration_minutes / 60) * cfg.get("per_hour", 0.0)
        amount += trip.extra_km * cfg.get("extra_km_rate", 2.0)
        amount += trip.extra_hours * cfg.get("extra_hour_rate", 5.0)
    elif model == "package":
        amount = cfg.get("monthly_cost", 1000.0)
        amount += trip.extra_km * cfg.get("extra_km_rate", 2.0)
    elif model == "hybrid":
        base = cfg.get("monthly_cost", 500.0)
        per_km = cfg.get("per_km", 1.0)
        amount = base + (trip.distance_km * per_km)
        amount += trip.extra_km * cfg.get("extra_km_rate", 2.0)
    else:
        amount = trip.distance_km * 1.0

    return round(amount, 2)


async def bill_trip_and_store(db: AsyncSession, trip: Trip) -> InvoiceRow:
    vendor = await _get_vendor(db, trip.vendor_id)
    if not vendor:
        raise ValueError("Vendor not found")

    amount = await compute_trip_amount(vendor, trip)
    row = InvoiceRow(
        tenant_id=trip.tenant_id,
        vendor_id=trip.vendor_id,
        trip_id=trip.id,
        amount=amount,
        note="auto",
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def _get_vendor(db: AsyncSession, vendor_id: int) -> Vendor | None:
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    return result.scalars().first()
