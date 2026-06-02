import os
import time
import uuid
from sqlalchemy import create_engine, Column, String, Integer, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/dbname")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Supabase (and most cloud Postgres) requires SSL
connect_args = {}
if "supabase" in DATABASE_URL:
    connect_args["sslmode"] = "require"

# Retry logic for the database connection
engine = None
for i in range(10):
    try:
        engine = create_engine(DATABASE_URL, connect_args=connect_args)
        # Test connection
        connection = engine.connect()
        connection.close()
        print("--- Database connected successfully! ---")
        break
    except OperationalError as e:
        print(f"--- Database not ready yet (attempt {i+1}/10). Waiting... ---")
        print(f"    Error: {e}")
        time.sleep(3)

if engine is None:
    raise Exception("Could not connect to the database after multiple attempts.")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, index=True)
    tenant_id = Column(String, index=True)
    name = Column(String)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DocumentMetadata(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(String, index=True)
    project_id = Column(String, ForeignKey("projects.id"), index=True)
    filename = Column(String)
    status = Column(String)
    chunks = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), index=True, nullable=False)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(String, primary_key=True)  # clerk user_id
    tenant_id = Column(String, index=True)
    is_pro = Column(Boolean, default=False)
    activated_at = Column(DateTime, nullable=True)

def init_db():
    print("--- Running init_db(): Creating tables if they don't exist... ---")
    Base.metadata.create_all(bind=engine)
    print("--- init_db() complete. Tables are ready. ---")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()