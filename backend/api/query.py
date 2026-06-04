from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

# ABSOLUTE IMPORTS ONLY
from api.dependencies import get_current_user_token
from utils.retrieval import search_documents
from utils.llm import generate_rfp_answer
from database import get_db, Message
from api.limiter import limiter

router = APIRouter()

class QueryRequest(BaseModel):
    project_id: str
    question: str

class SourceItem(BaseModel):
    filename: str
    page_number: int | None = None
    snippet: str

class AskResponse(BaseModel):
    status: str
    answer: str
    sources: list[SourceItem]

@router.post("/ask", response_model=AskResponse)
@limiter.limit("10/minute")
async def ask_rfp(
    request: Request,
    body: QueryRequest,
    user: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
):
    try:
        # 1. Load past messages for this project, ordered by time
        past_messages = (
            db.query(Message)
            .filter(Message.project_id == body.project_id)
            .order_by(Message.created_at.asc())
            .all()
        )

        # 2. Format history for the LLM conversation array
        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in past_messages
        ]

        # 3. Search documents for relevant context
        context = search_documents(user["tenant_id"], body.project_id, body.question)
        if not context:
            return AskResponse(status="Success", answer="No info found.", sources=[])
        
        # 4. Collect source citations from context chunks
        source_items = []
        for chunk in context:
            text = chunk.get("text", "") if isinstance(chunk, dict) else str(chunk)
            snippet = text[:200].strip() + ("..." if len(text) > 200 else "")
            source_items.append(SourceItem(
                filename=chunk.get("filename", "unknown") if isinstance(chunk, dict) else "unknown",
                page_number=chunk.get("page_number") if isinstance(chunk, dict) else None,
                snippet=snippet,
            ))

        # 5. Generate answer with full conversation history
        answer = generate_rfp_answer(body.question, context, conversation_history)

        # 6. Save the user's question to the messages table
        user_msg = Message(
            project_id=body.project_id,
            role="user",
            content=body.question,
        )
        db.add(user_msg)

        # 7. Save the AI's response to the messages table
        assistant_msg = Message(
            project_id=body.project_id,
            role="assistant",
            content=answer,
        )
        db.add(assistant_msg)
        db.commit()

        return AskResponse(status="Success", answer=answer, sources=source_items)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class ExportRequest(BaseModel):
    project_name: str
    answer: str

def _build_branded_styles():
    """Build a professional style sheet for branded PDF exports."""
    styles = getSampleStyleSheet()
    
    # Cover title
    styles.add(ParagraphStyle(
        name='CoverTitle',
        parent=styles['Title'],
        fontSize=28,
        leading=34,
        textColor=HexColor('#0F172A'),
        spaceAfter=8,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold',
    ))
    
    # Cover subtitle
    styles.add(ParagraphStyle(
        name='CoverSubtitle',
        parent=styles['Normal'],
        fontSize=14,
        leading=18,
        textColor=HexColor('#64748B'),
        spaceAfter=4,
        alignment=TA_LEFT,
        fontName='Helvetica',
    ))
    
    # Section header
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading2'],
        fontSize=16,
        leading=20,
        textColor=HexColor('#1E40AF'),
        spaceBefore=18,
        spaceAfter=10,
        fontName='Helvetica-Bold',
        borderWidth=0,
        borderPadding=0,
    ))
    
    # Body text
    styles.add(ParagraphStyle(
        name='BodyText_Custom',
        parent=styles['Normal'],
        fontSize=11,
        leading=16,
        textColor=HexColor('#1E293B'),
        spaceAfter=8,
        alignment=TA_LEFT,
        fontName='Helvetica',
    ))
    
    # Footer
    styles.add(ParagraphStyle(
        name='FooterText',
        parent=styles['Normal'],
        fontSize=8,
        leading=10,
        textColor=HexColor('#94A3B8'),
        alignment=TA_CENTER,
        fontName='Helvetica',
    ))
    
    return styles


def _add_page_number(canvas, doc):
    """Draw page number and branding footer on every page."""
    canvas.saveState()
    
    # Footer line
    canvas.setStrokeColor(HexColor('#E2E8F0'))
    canvas.setLineWidth(0.5)
    canvas.line(72, 50, letter[0] - 72, 50)
    
    # Page number
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(HexColor('#94A3B8'))
    canvas.drawCentredString(letter[0] / 2, 35, f"Page {doc.page}")
    
    # Branding
    canvas.drawString(72, 35, "RFP Engine — Enterprise Edition")
    canvas.drawRightString(letter[0] - 72, 35, datetime.now().strftime("%Y-%m-%d"))
    
    canvas.restoreState()


@router.post("/export")
async def export_rfp(request: ExportRequest, user: dict = Depends(get_current_user_token)):
    """Generate a professionally branded PDF bid export."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        topMargin=72,
        bottomMargin=72,
        leftMargin=72,
        rightMargin=72,
        title=f"Bid Export — {request.project_name}",
        author="RFP Engine",
    )
    styles = _build_branded_styles()
    story = []
    
    # ── COVER PAGE ──────────────────────────────────────────────
    # Top accent bar
    accent_data = [['  ']]
    accent_table = Table(accent_data, colWidths=[doc.width])
    accent_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#2563EB')),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(accent_table)
    story.append(Spacer(1, 40))
    
    # Title block
    story.append(Paragraph("BID RESPONSE", styles['CoverTitle']))
    story.append(Paragraph(request.project_name, styles['CoverSubtitle']))
    story.append(Spacer(1, 16))
    
    # Metadata line
    gen_date = datetime.now().strftime("%B %d, %Y at %I:%M %p")
    story.append(Paragraph(f"Generated: {gen_date}", styles['CoverSubtitle']))
    story.append(Paragraph(f"Platform: RFP Engine — Enterprise Edition", styles['CoverSubtitle']))
    story.append(Spacer(1, 8))
    
    # Divider
    story.append(HRFlowable(
        width="100%", thickness=1,
        color=HexColor('#E2E8F0'),
        spaceAfter=12, spaceBefore=12,
    ))
    
    story.append(Paragraph(
        "This document was auto-generated by the RFP Engine AI pipeline. "
        "All content is based on ingested project documents and should be "
        "reviewed by a qualified professional before submission.",
        styles['BodyText_Custom']
    ))
    
    story.append(PageBreak())
    
    # ── RESPONSE BODY ───────────────────────────────────────────
    story.append(Paragraph("AI-Generated Response", styles['SectionHeader']))
    story.append(HRFlowable(
        width="100%", thickness=0.5,
        color=HexColor('#BFDBFE'),
        spaceAfter=16, spaceBefore=4,
    ))
    
    # Split answer into paragraphs and render each
    paragraphs = request.answer.split('\n')
    for para in paragraphs:
        cleaned = para.strip()
        if not cleaned:
            story.append(Spacer(1, 8))
            continue
        
        # Escape XML special characters for ReportLab
        cleaned = cleaned.replace('&', '&amp;')
        cleaned = cleaned.replace('<', '&lt;')
        cleaned = cleaned.replace('>', '&gt;')
        
        # Detect section-like headers (lines ending with colon or all caps)
        if cleaned.endswith(':') and len(cleaned) < 80:
            story.append(Spacer(1, 6))
            story.append(Paragraph(f"<b>{cleaned}</b>", styles['BodyText_Custom']))
        else:
            story.append(Paragraph(cleaned, styles['BodyText_Custom']))
    
    # ── BUILD PDF ───────────────────────────────────────────────
    doc.build(story, onFirstPage=_add_page_number, onLaterPages=_add_page_number)
    buffer.seek(0)
    
    safe_name = request.project_name.replace(' ', '_').lower()
    filename = f"bid_export_{safe_name}.pdf"
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )