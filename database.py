import contextvars
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# ME PUT SECRET POUCH HERE
tenant_id_context_var: contextvars.ContextVar[str | None] = contextvars.ContextVar("tenant_id", default=None)

app = FastAPI()

# ME GRAB ID FROM HEADERS, PUT IN POUCH
@app.middleware("http")
async def tenant_middleware(request: Request, call_next):
    tenant_id = request.headers.get("X-Tenant-ID")
    token = tenant_id_context_var.set(tenant_id)
    try:
        response = await call_next(request)
        return response
    finally:
        # ME EMPTY POUCH AFTER REQUEST
        tenant_id_context_var.reset(token)

# ME SETUP FAST ASYNCPG ENGINE
# YOU PUT REAL CONNECTION STRING HERE
DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5432/postgres"
engine = create_async_engine(DATABASE_URL, echo=False)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

# ME YIELD SESSION WITH LOCAL SCOPE
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    tenant_id = tenant_id_context_var.get()
    
    async with async_session_maker() as session:
        if tenant_id:
            # SET LOCAL ONLY LIVE UNTIL TRANSACTION COMMIT OR ROLLBACK
            # NO LEAK TO OTHER POOL CONNECTIONS
            await session.execute(
                text("SET LOCAL app.tenant_id = :tenant"),
                {"tenant": tenant_id}
            )
        yield session
