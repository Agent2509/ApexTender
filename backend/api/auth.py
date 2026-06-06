import os
import jwt
import requests
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

# Cache the JWKS so we don't fetch it on every single request
_jwks_cache: dict | None = None


def _get_jwks() -> dict:
    """Fetch and cache the JWKS from the Clerk issuer endpoint."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    issuer = os.getenv("CLERK_ISSUER")
    if not issuer:
        raise HTTPException(
            status_code=500,
            detail="CLERK_ISSUER environment variable is not configured."
        )

    jwks_url = f"{issuer.rstrip('/')}/.well-known/jwks.json"
    try:
        response = requests.get(jwks_url, timeout=10)
        response.raise_for_status()
        _jwks_cache = response.json()
        return _jwks_cache
    except requests.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch JWKS from Clerk: {e}"
        )


def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    FastAPI dependency that verifies a Clerk-issued JWT.

    Extracts the Bearer token, validates it against the Clerk JWKS,
    checks signature and expiration, and returns the user_id (sub claim).

    Raises HTTPException(401) on any verification failure.
    """
    token = credentials.credentials

    # --- Local dev fallback ---
    if os.getenv("ENVIRONMENT") == "development" and token == "mock-dev-token":
        return "user-999-uuid"

    # --- Production: full Clerk JWT verification ---
    jwks = _get_jwks()
    issuer = os.getenv("CLERK_ISSUER", "")

    try:
        # Decode the token header to find the key id (kid)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise HTTPException(status_code=401, detail="Token header missing 'kid'.")

        # Find the matching public key in the JWKS
        rsa_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                rsa_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                break

        if rsa_key is None:
            # Clear cache in case keys rotated, then fail
            global _jwks_cache
            _jwks_cache = None
            raise HTTPException(
                status_code=401,
                detail="Unable to find matching signing key."
            )

        # Decode and verify the token
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"require": ["exp", "sub", "iss"]},
        )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing 'sub' claim.")

        return user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired.")
    except jwt.InvalidIssuerError:
        raise HTTPException(status_code=401, detail="Invalid token issuer.")
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")
