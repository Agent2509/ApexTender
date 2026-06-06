from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import os

from api.dependencies import get_current_user_token
from database import get_db, UserProfile

router = APIRouter()


class CouponRequest(BaseModel):
    coupon_code: str


@router.get("/status")
def get_billing_status(user: dict = Depends(get_current_user_token), db: Session = Depends(get_db)):
    """Get the current user's pro status."""
    profile = db.query(UserProfile).filter(UserProfile.id == user["user_id"]).first()
    if not profile:
        return {"is_pro": False, "activated_at": None}
    return {"is_pro": profile.is_pro, "activated_at": profile.activated_at}


@router.post("/activate-pro")
def activate_pro(
    request: CouponRequest,
    user: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db)
):
    """Activate pro access using a valid coupon code."""
    if request.coupon_code != os.getenv("PROMO_CODE"):
        raise HTTPException(status_code=400, detail="Invalid coupon code.")

    profile = db.query(UserProfile).filter(UserProfile.id == user["user_id"]).first()
    if profile:
        if profile.is_pro:
            return {"status": "already_active", "message": "Pro access is already active."}
        profile.is_pro = True
        profile.activated_at = datetime.utcnow()
    else:
        profile = UserProfile(
            id=user["user_id"],
            tenant_id=user["tenant_id"],
            is_pro=True,
            activated_at=datetime.utcnow()
        )
        db.add(profile)

    db.commit()
    db.refresh(profile)
    return {"status": "activated", "message": "Pro access activated successfully!", "is_pro": True}
