from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from database import tenant_id_context_var, async_session_maker

router = APIRouter()

class PromoRequest(BaseModel):
    promo_code: str

@router.post("/api/v1/billing/redeem", status_code=status.HTTP_200_OK)
async def redeem_promo_code(req: PromoRequest):
    # 1. ME CHECK SECRET POUCH FOR TENANT TAG
    tenant_id = tenant_id_context_var.get()
    if not tenant_id:
        raise HTTPException(status_code=401, detail="NO TAG. NO MAGIC FOR YOU.")

    try:
        # ME OPEN SECURE ROCK TUNNEL TO DATABASE
        async with async_session_maker() as session:
            # PUT ON TENANT MASK FOR RLS
            await session.execute(
                text("SET LOCAL app.tenant_id = :tenant"),
                {"tenant": tenant_id}
            )
            
            # 2. LOOK FOR MAGIC STICK (LOCK ROW SO OTHERS CANNOT GRAB SAME TIME)
            result = await session.execute(
                text("""
                    SELECT id, current_uses, max_uses 
                    FROM promotional_codes 
                    WHERE code = :code AND is_active = TRUE
                    FOR UPDATE
                """),
                {"code": req.promo_code}
            )
            code_record = result.fetchone()
            
            if not code_record:
                raise HTTPException(status_code=403, detail="MAGIC STICK NOT REAL.")
                
            code_id, current_uses, max_uses = code_record
            
            # 3. CHECK IF STICK BROKEN
            if current_uses >= max_uses:
                raise HTTPException(status_code=403, detail="MAGIC STICK HAS NO MORE MAGIC.")
                
            # 4. BURN ONE MAGIC USE
            await session.execute(
                text("UPDATE promotional_codes SET current_uses = current_uses + 1 WHERE id = :code_id"),
                {"code_id": code_id}
            )
            
            # 5. WRITE IN TALLY LOG (AUDIT)
            await session.execute(
                text("INSERT INTO code_redemptions (org_id, code_id) VALUES (:tenant, :code_id)"),
                {"tenant": tenant_id, "code_id": code_id}
            )
            
            # 6. MAKE TRIBE PRO!
            await session.execute(
                text("UPDATE organizations SET is_pro = TRUE WHERE id = :tenant"),
                {"tenant": tenant_id}
            )
            
            # COMMIT TRANSACTION ALL AT ONCE
            await session.commit()
            
            return {"status": "SUCCESS", "message": "YOU ARE PRO TRIBE NOW. BEAST BOWS TO YOU."}
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"CAVE QUAKE ERROR: {e}")
        raise HTTPException(status_code=500, detail="CAVE QUAKE! TRY AGAIN LATER.")
