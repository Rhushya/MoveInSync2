from __future__ import annotations

import csv
import io
from datetime import datetime, timedelta

import json

from redis.asyncio import Redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import settings
from .models import InvoiceRow, Trip, Vendor

redis = Redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)


async def vendor_monthly_statement(db: AsyncSession, vendor_id: int, year: int, month: int) -> dict:
    cache_key = f"reports:vendor:{vendor_id}:{year}:{month}"
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)

    month_start = datetime(year, month, 1)
    month_end = month_start + timedelta(days=32)
    month_end = month_end.replace(day=1)

    query = (
        select(InvoiceRow)
        .where(InvoiceRow.vendor_id == vendor_id)
        .where(InvoiceRow.created_at >= month_start)
        .where(InvoiceRow.created_at < month_end)
    )
    rows = (await db.execute(query)).scalars().all()
    total = sum(row.amount for row in rows)

    csv_buffer = io.StringIO()
    writer = csv.writer(csv_buffer)
    writer.writerow(["invoice_row_id", "trip_id", "amount", "note"])
    for row in rows:
        writer.writerow([row.id, row.trip_id, row.amount, row.note])

    payload = csv_buffer.getvalue()
    response = {"total": total, "csv": payload}
    await redis.setex(cache_key, 3600, json.dumps(response))
    return response


async def dashboard_summary(db: AsyncSession, tenant_id: int) -> dict:
    today = datetime.utcnow()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    trip_total_stmt = (
        select(func.sum(InvoiceRow.amount))
        .where(InvoiceRow.tenant_id == tenant_id)
        .where(InvoiceRow.created_at >= month_start)
    )
    vendor_count_stmt = select(func.count(Vendor.id)).where(Vendor.tenant_id == tenant_id)
    pending_stmt = select(func.count(Trip.id)).where(Trip.tenant_id == tenant_id)

    total = (await db.execute(trip_total_stmt)).scalar() or 0.0
    vendors = (await db.execute(vendor_count_stmt)).scalar() or 0
    pending = (await db.execute(pending_stmt)).scalar() or 0

    return {
        "monthly_total": round(total, 2),
        "vendors": vendors,
        "pending": pending,
    }
