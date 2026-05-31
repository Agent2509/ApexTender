from fastapi import Depends
from api.auth import verify_token


async def get_current_user_token(user_id: str = Depends(verify_token)):
    """
    Wraps the Clerk JWT verify_token dependency and returns a dict
    compatible with the shape every route handler expects:

        {"user_id": "...", "tenant_id": "...", "role": "user"}

    tenant_id is set equal to user_id — each Clerk user is their own
    tenant for data isolation in PostgreSQL and Qdrant.
    """
    return {
        "user_id": user_id,
        "tenant_id": user_id,
        "role": "user",
    }