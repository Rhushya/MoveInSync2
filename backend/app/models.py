from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship

from .db import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    role = Column(String, default="employee")
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant")


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    billing_model = Column(String, nullable=False)
    billing_config = Column(JSON, default=dict)

    tenant = relationship("Tenant")


class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    distance_km = Column(Float, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    date = Column(DateTime, nullable=False)
    extra_km = Column(Float, default=0.0)
    extra_hours = Column(Float, default=0.0)
    payload = Column(JSON, default=dict)

    vendor = relationship("Vendor")
    tenant = relationship("Tenant")
    employee = relationship("User")


class InvoiceRow(Base):
    __tablename__ = "invoice_rows"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False, index=True)
    trip_id = Column(Integer, ForeignKey("trips.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    note = Column(String, default="auto")
    created_at = Column(DateTime, default=datetime.utcnow)

    vendor = relationship("Vendor")
    tenant = relationship("Tenant")
    trip = relationship("Trip")
