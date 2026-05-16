from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.core.database import get_db
from app.models.user import User
from app.repositories.user_repo import UserRepository
from app.schemas.auth import (
    AuthResponse,
    AuthTokens,
    LoginRequest,
    RefreshRequest,
    SignupRequest,
    UserSchema,
)
from app.services.auth.password import hash_password, verify_password

router = APIRouter()


def create_access_token(subject: str | Any, settings: Settings) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(subject: str | Any, settings: Settings) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    body: SignupRequest,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthResponse:
    user_repo = UserRepository(db)

    if await user_repo.email_exists(body.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    hashed_pwd = hash_password(body.password)
    user = User(email=body.email, hashed_password=hashed_pwd)
    user = await user_repo.create(user)

    user_schema = UserSchema(
        id=str(user.id),
        email=user.email,
        created_at=user.created_at.isoformat() if hasattr(user.created_at, "isoformat") else str(user.created_at),
    )
    access_token = create_access_token(user.id, settings)
    refresh_token = create_refresh_token(user.id, settings)

    return AuthResponse(
        user=user_schema,
        tokens=AuthTokens(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.access_token_expire_minutes * 60,
        ),
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthResponse:
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(body.email)

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    user_schema = UserSchema(
        id=str(user.id),
        email=user.email,
        created_at=user.created_at.isoformat() if hasattr(user.created_at, "isoformat") else str(user.created_at),
    )
    access_token = create_access_token(user.id, settings)
    refresh_token = create_refresh_token(user.id, settings)

    return AuthResponse(
        user=user_schema,
        tokens=AuthTokens(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.access_token_expire_minutes * 60,
        ),
    )


@router.post("/refresh", response_model=AuthResponse)
async def refresh(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthResponse:
    try:
        payload = jwt.decode(
            body.refresh_token, settings.secret_key, algorithms=[settings.algorithm]
        )
        token_type = payload.get("type")
        if token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    user_schema = UserSchema(
        id=str(user.id),
        email=user.email,
        created_at=user.created_at.isoformat() if hasattr(user.created_at, "isoformat") else str(user.created_at),
    )
    access_token = create_access_token(user.id, settings)
    refresh_token = create_refresh_token(user.id, settings)

    return AuthResponse(
        user=user_schema,
        tokens=AuthTokens(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.access_token_expire_minutes * 60,
        ),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout() -> None:
    pass
