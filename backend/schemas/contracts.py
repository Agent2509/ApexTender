from enum import Enum
from typing import List
from pydantic import BaseModel, Field

class ComplianceStatus(str, Enum):
    COMPLIANT = "Compliant"
    NON_COMPLIANT = "Non-Compliant"
    PARTIAL = "Partial"
    NEEDS_REVIEW = "Needs_Review"

class ComplianceRow(BaseModel):
    # STRICT RULES (INVARIANTS) FOR SKY BRAIN
    requirement_id: str = Field(..., description="Unique identifier for the requirement")
    extracted_clause: str = Field(..., description="The clause extracted from the requirement")
    compliance_status: ComplianceStatus = Field(..., description="Status of compliance")
    reasoning_path: str = Field(..., description="Detailed explanation of the logic and reasoning for the status. MUST explain logic.")
    source_quote: str = Field(..., description="Exact quote from the RFP document to support the reasoning")

class RTMDocument(BaseModel):
    # BIG BOX TO HOLD SMALL BOXES
    rows: List[ComplianceRow] = Field(default_factory=list, description="List of compliance rows forming the matrix")
