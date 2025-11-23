from __future__ import annotations

from datetime import timedelta

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from . import auth, billing, crud, reporting, schemas
from .config import settings
from .db import Base, engine, get_db
from .deps import get_current_user, require_role

app = FastAPI(title="MoveInSync Billing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[host.strip() for host in settings.allowed_hosts.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.post("/auth/signup", response_model=schemas.Token)
async def signup(user: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    created = await crud.create_user(
        db,
        email=user.email,
        password=user.password,
        tenant_id=user.tenant_id,
        role=user.role,
    )
    token = auth.create_access_token({"sub": created.email, "tenant_id": created.tenant_id, "role": created.role})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/auth/login", response_model=schemas.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = auth.create_access_token(
        {"sub": user.email, "tenant_id": user.tenant_id, "role": user.role},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/me", response_model=schemas.UserOut)
async def read_current_user(current_user=Depends(get_current_user)):
    return current_user


@app.get("/users", response_model=list[schemas.UserOut])
async def list_users(
    current_admin: schemas.UserOut = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db),
):
    return await crud.list_users_by_tenant(db, tenant_id=current_admin.tenant_id)


@app.get("/tasks", response_model=list[schemas.TripOut])
async def list_tasks(
    user_id: int | None = Query(None, description="Optional user filter"),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    employee_filter = user_id if current_user.is_admin else current_user.id

    trips = await crud.list_trips_for_tenant(
        db,
        tenant_id=current_user.tenant_id,
        employee_id=employee_filter,
    )
    return trips


@app.post("/trips", response_model=schemas.TripOut)
async def add_trip(
    trip_in: schemas.TripIn,
    db: AsyncSession = Depends(get_db),
    _: schemas.UserOut = Depends(require_role("admin", "vendor")),
):
    trip = await crud.create_trip(db, trip_in.dict())
    await billing.bill_trip_and_store(db, trip)
    return trip


@app.get("/reports/vendor/{vendor_id}/monthly")
async def vendor_report(
    vendor_id: int,
    year: int,
    month: int,
    db: AsyncSession = Depends(get_db),
    _: schemas.UserOut = Depends(require_role("admin", "vendor")),
):
    return await reporting.vendor_monthly_statement(db, vendor_id, year, month)


@app.get("/dashboard/summary")
async def dashboard_summary(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await reporting.dashboard_summary(db, current_user.tenant_id)
