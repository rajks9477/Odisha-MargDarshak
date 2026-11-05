import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, update

from app.core.config import settings
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token,
    generate_otp,
)
from app.core.rbac import get_current_user, get_current_active_user, PERMISSIONS
from app.db.session import get_db
from app.models.user import User, UserRole, UserStatus
from app.models.token import RefreshToken, PasswordResetToken
from app.models.audit import AuditLog
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenRefreshRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.schemas.user import UserResponse, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

def build_user_response(user: User) -> UserResponse:
    perms = PERMISSIONS.get(user.role, [])
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        status=user.status,
        department=user.department,
        state=user.state,
        district=user.district,
        employee_id=user.employee_id,
        designation=user.designation,
        verified_at=user.verified_at,
        created_at=user.created_at,
        permissions=perms
    )

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_user(
    request: Request,
    payload: UserRegisterRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    # 1. Check duplicate email or phone
    result = await db.execute(
        select(User).filter(or_(User.email == payload.email.lower(), User.phone == payload.phone))
    )
    existing_user = result.scalars().first()
    if existing_user:
        if existing_user.email.lower() == payload.email.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists.",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this mobile number already exists.",
            )

    # 2. Determine initial status based on Role
    # Citizens and Drivers get ACTIVE immediately; Govt / Admin roles require Dept verification
    if payload.role in [UserRole.CITIZEN, UserRole.DRIVER]:
        initial_status = UserStatus.ACTIVE
    else:
        initial_status = UserStatus.PENDING_APPROVAL

    # 3. Create User record
    hashed_pwd = get_password_hash(payload.password)
    new_user = User(
        name=payload.name,
        email=payload.email.lower(),
        phone=payload.phone,
        password_hash=hashed_pwd,
        role=payload.role,
        status=initial_status,
        department=payload.department,
        state=payload.state,
        district=payload.district,
        employee_id=payload.employee_id,
        designation=payload.designation,
    )
    db.add(new_user)
    await db.flush()

    # 4. Audit Log
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    audit = AuditLog(
        user_id=new_user.id,
        user_email=new_user.email,
        action="REGISTER",
        ip_address=client_ip,
        user_agent=user_agent,
        details=f"Registered as role={payload.role.value}, status={initial_status.value}"
    )
    db.add(audit)
    await db.commit()
    await db.refresh(new_user)

    user_resp = build_user_response(new_user)

    if initial_status == UserStatus.ACTIVE:
        access_token = create_access_token(new_user.id, new_user.role.value)
        refresh_token = create_refresh_token(new_user.id)
        
        # Save refresh token
        db_refresh = RefreshToken(
            user_id=new_user.id,
            token_hash=hash_token(refresh_token),
            expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        db.add(db_refresh)
        await db.commit()

        return {
            "message": "Account created and activated successfully.",
            "status": "ACTIVE",
            "token": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "Bearer",
                "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                "user": user_resp.model_dump()
            }
        }
    else:
        return {
            "message": f"Account registration submitted successfully. As a {payload.role.value}, your account is pending official verification by the department administrator.",
            "status": "PENDING_APPROVAL",
            "user": user_resp.model_dump()
        }

@router.post("/login", response_model=TokenResponse)
async def login_user(
    request: Request,
    response: Response,
    payload: UserLoginRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    identifier = payload.email_or_phone.strip()
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    # 1. Lookup user by email or phone
    result = await db.execute(
        select(User).filter(or_(User.email == identifier.lower(), User.phone == identifier))
    )
    user = result.scalars().first()

    if not user:
        # Generic error message to prevent user enumeration
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your email/mobile and password.",
        )

    # 2. Check if account is locked
    now = datetime.now(timezone.utc)
    if user.locked_until and user.locked_until > now:
        remaining_minutes = int((user.locked_until - now).total_seconds() / 60) + 1
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is temporarily locked due to excessive failed attempts. Please retry in {remaining_minutes} minutes.",
        )

    # 3. Verify password
    is_valid = verify_password(payload.password, user.password_hash)
    if not is_valid:
        user.failed_logins += 1
        audit_details = f"Failed attempt #{user.failed_logins}"
        if user.failed_logins >= settings.MAX_FAILED_LOGIN_ATTEMPTS:
            user.locked_until = now + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
            audit_details += f" - Account locked for {settings.LOCKOUT_DURATION_MINUTES} mins"
        
        audit = AuditLog(
            user_id=user.id,
            user_email=user.email,
            action="LOGIN_FAILED",
            ip_address=client_ip,
            user_agent=user_agent,
            details=audit_details
        )
        db.add(audit)
        await db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your email/mobile and password.",
        )

    # 4. Check account status
    if user.status == UserStatus.PENDING_APPROVAL:
        audit = AuditLog(
            user_id=user.id,
            user_email=user.email,
            action="LOGIN_BLOCKED_PENDING",
            ip_address=client_ip,
            user_agent=user_agent,
            details="Login blocked: Account pending department approval"
        )
        db.add(audit)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending government/department verification. Please wait for an administrator to activate your account.",
        )
    elif user.status == UserStatus.SUSPENDED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended by an administrator. Please contact Odisha MargDarshak support.",
        )
    elif user.status == UserStatus.REJECTED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your account registration was rejected. Reason: {user.rejection_reason or 'Eligibility verification not met'}.",
        )
    elif user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive.",
        )

    # 5. Successful login: reset failed attempts & update last login
    user.failed_logins = 0
    user.locked_until = None
    user.last_login_at = now
    
    access_token = create_access_token(user.id, user.role.value)
    refresh_token = create_refresh_token(user.id)

    db_refresh = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(db_refresh)

    audit = AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="LOGIN_SUCCESS",
        ip_address=client_ip,
        user_agent=user_agent,
        details=f"Successful login as {user.role.value}"
    )
    db.add(audit)
    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="Bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=build_user_response(user)
    )

@router.post("/refresh", response_model=dict)
async def refresh_access_token(
    payload: TokenRefreshRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    token_data = decode_token(payload.refresh_token)
    if not token_data or token_data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    
    user_id = token_data.get("sub")
    t_hash = hash_token(payload.refresh_token)

    # Check if token exists in DB and is not revoked
    result = await db.execute(
        select(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.token_hash == t_hash,
            RefreshToken.revoked == False,
        )
    )
    db_token = result.scalars().first()
    if not db_token or db_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is expired or has been revoked",
        )

    # Fetch user
    user_result = await db.execute(select(User).filter(User.id == user_id))
    user = user_result.scalars().first()
    if not user or user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active",
        )

    new_access_token = create_access_token(user.id, user.role.value)
    return {
        "access_token": new_access_token,
        "token_type": "Bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }

@router.post("/logout", response_model=dict)
async def logout_user(
    request: Request,
    payload: Optional[TokenRefreshRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Any:
    if payload and payload.refresh_token:
        t_hash = hash_token(payload.refresh_token)
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == current_user.id, RefreshToken.token_hash == t_hash)
            .values(revoked=True)
        )
    else:
        # Revoke all active refresh tokens for this user on general logout
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == current_user.id)
            .values(revoked=True)
        )
    
    client_ip = request.client.host if request.client else "unknown"
    audit = AuditLog(
        user_id=current_user.id,
        user_email=current_user.email,
        action="LOGOUT",
        ip_address=client_ip,
        details="User logged out"
    )
    db.add(audit)
    await db.commit()

    return {"message": "Logged out successfully."}

@router.post("/forgot-password", response_model=dict)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    identifier = payload.email_or_phone.strip()
    result = await db.execute(
        select(User).filter(or_(User.email == identifier.lower(), User.phone == identifier))
    )
    user = result.scalars().first()

    if not user:
        # Don't reveal non-existent accounts for security
        return {
            "message": "If the account exists, a password reset token and verification code have been generated.",
            "success": True
        }

    # Generate secure reset token and OTP
    token_str = secrets.token_urlsafe(32)
    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)

    reset_entry = PasswordResetToken(
        user_id=user.id,
        token=token_str,
        otp_code=otp,
        expires_at=expires_at,
        is_used=False
    )
    db.add(reset_entry)

    audit = AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="PASSWORD_RESET_REQUEST",
        details="Password reset requested"
    )
    db.add(audit)
    await db.commit()

    return {
        "message": "Password reset token and verification OTP generated.",
        "success": True,
        "token": token_str,
        "otp_code": otp,  # Provided for easy testing & local verification
        "expires_in_minutes": settings.RESET_TOKEN_EXPIRE_MINUTES
    }

@router.post("/reset-password", response_model=dict)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(PasswordResetToken).filter(
            PasswordResetToken.token == payload.token,
            PasswordResetToken.otp_code == payload.otp_code.strip(),
            PasswordResetToken.is_used == False,
            PasswordResetToken.expires_at > now
        )
    )
    reset_entry = result.scalars().first()

    if not reset_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid, expired, or already used password reset token/OTP.",
        )

    # Fetch user
    user_result = await db.execute(select(User).filter(User.id == reset_entry.user_id))
    user = user_result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User associated with this reset request was not found.",
        )

    # Update password
    user.password_hash = get_password_hash(payload.new_password)
    user.failed_logins = 0
    user.locked_until = None
    reset_entry.is_used = True

    # Invalidate all prior sessions
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user.id)
        .values(revoked=True)
    )

    audit = AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="PASSWORD_RESET_COMPLETE",
        details="Password changed successfully via reset OTP"
    )
    db.add(audit)
    await db.commit()

    return {"message": "Password has been successfully updated. You can now log in with your new password."}

@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    return build_user_response(current_user)
