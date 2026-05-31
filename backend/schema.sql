-- Create the core tables
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'starter',
    data_region VARCHAR(50) NOT NULL DEFAULT 'eu-west',
    pdpl_consent_at TIMESTAMPTZ NULL,
    uae_pdpl_consent_at TIMESTAMPTZ NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'member',
    sso_provider VARCHAR(50),
    last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(500) NOT NULL,
    client_name VARCHAR(255),
    status VARCHAR(50),
    qdrant_collection VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    project_id UUID REFERENCES projects(id),
    s3_key VARCHAR(1000) NOT NULL,
    doc_type VARCHAR(50),
    ingestion_status VARCHAR(50),
    celery_task_id VARCHAR(255),
    language VARCHAR(10) DEFAULT 'ar',
    page_count INTEGER
);

-- Enable Row-Level Security (The Technical Moat)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create the Isolation Policies
DROP POLICY IF EXISTS tenant_iso_users ON users;
CREATE POLICY tenant_iso_users ON users 
USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

DROP POLICY IF EXISTS tenant_iso_projects ON projects;
CREATE POLICY tenant_iso_projects ON projects 
USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

DROP POLICY IF EXISTS tenant_iso_documents ON documents;
CREATE POLICY tenant_iso_documents ON documents 
USING (tenant_id = current_setting('app.tenant_id', true)::UUID);