from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TenantBase(BaseModel):
    name: str


class TenantCreate(TenantBase):
    pass


class TenantOut(TenantBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    email: EmailStr
    tenant_id: int
    role: str = Field("employee", pattern=r"^(admin|vendor|employee)$")


class UserCreate(UserBase):
    password: str


class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    tenant_id: int
    is_admin: bool = False

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TripIn(BaseModel):
    tenant_id: int
    vendor_id: int
    employee_id: int
    distance_km: float
    duration_minutes: int
    date: datetime
    extra_km: float = 0.0
    extra_hours: float = 0.0
    payload: Dict[str, Any] = {}


class TripOut(TripIn):
    id: int

    model_config = ConfigDict(from_attributes=True)


class InvoiceRowOut(BaseModel):
    id: int
    vendor_id: int
    trip_id: int
    amount: float
    note: str

    model_config = ConfigDict(from_attributes=True)
