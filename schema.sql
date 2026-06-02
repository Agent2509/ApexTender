-- ME MAKE TABLES
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL
);

CREATE TABLE rfp_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    filename TEXT NOT NULL,
    status TEXT NOT NULL,
    page_count INTEGER NOT NULL
);

CREATE TABLE compliance_matrices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    document_id UUID NOT NULL REFERENCES rfp_documents(id),
    content JSONB NOT NULL
);

-- ME PUT HEAVY ROCK DOORS ON TABLES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfp_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_matrices ENABLE ROW LEVEL SECURITY;

-- ME MAKE SURE BOSS CANNOT BYPASS DOORS EITHER
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE rfp_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE compliance_matrices FORCE ROW LEVEL SECURITY;

-- ME WRITE RULES: NO TENANT ID IN SESSION = NO ROWS (FAIL CLOSED)
CREATE POLICY tenant_isolation_users ON users FOR ALL
USING (org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '00000000-0000-0000-0000-000000000000')::uuid);

CREATE POLICY tenant_isolation_rfp_documents ON rfp_documents FOR ALL
USING (org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '00000000-0000-0000-0000-000000000000')::uuid);

CREATE POLICY tenant_isolation_compliance_matrices ON compliance_matrices FOR ALL
USING (org_id = COALESCE(NULLIF(current_setting('app.tenant_id', true), ''), '00000000-0000-0000-0000-000000000000')::uuid);
