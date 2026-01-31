from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

app = FastAPI(
    title="Ticket Tracker API",
    description="Professional Issue/Ticket Management System",
    version="1.0.0"
)

# CORS - Allow React frontend to call this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# DATA MODELS
# ============================================

class TicketCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)
    priority: str = Field(default="medium")
    assigned_to: Optional[str] = None

class TicketUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, min_length=10, max_length=2000)
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None

class Ticket(BaseModel):
    id: str
    title: str
    description: str
    status: str
    priority: str
    assigned_to: Optional[str]
    created_at: str
    updated_at: str

# ============================================
# IN-MEMORY DATABASE (Demo)
# ============================================

tickets_db = {}

def seed_tickets():
    """Create sample tickets for demo"""
    samples = [
        {
            "id": str(uuid.uuid4()),
            "title": "Login page not responsive on mobile",
            "description": "Users report login form not displaying correctly on mobile devices. Buttons are cut off on iPhone 12.",
            "status": "open",
            "priority": "high",
            "assigned_to": "Sarah Johnson",
            "created_at": "2024-01-28T10:30:00",
            "updated_at": "2024-01-28T10:30:00"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Add dark mode support",
            "description": "Implement dark mode theme across the application for better user experience during night-time.",
            "status": "in_progress",
            "priority": "medium",
            "assigned_to": "Mike Chen",
            "created_at": "2024-01-27T14:20:00",
            "updated_at": "2024-01-30T09:15:00"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Database backup automation",
            "description": "Setup automated daily backups for production database with 30-day retention policy.",
            "status": "resolved",
            "priority": "critical",
            "assigned_to": "Alex Martinez",
            "created_at": "2024-01-25T08:00:00",
            "updated_at": "2024-01-29T16:45:00"
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Update user profile API",
            "description": "Add ability to upload profile pictures and update bio information.",
            "status": "open",
            "priority": "low",
            "assigned_to": None,
            "created_at": "2024-01-26T11:00:00",
            "updated_at": "2024-01-26T11:00:00"
        }
    ]
    
    for ticket in samples:
        tickets_db[ticket["id"]] = ticket

seed_tickets()

# ============================================
# API ENDPOINTS
# ============================================

@app.get("/")
def root():
    return {
        "message": "Ticket Tracker API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/tickets", response_model=List[Ticket])
def get_tickets(status: Optional[str] = None, priority: Optional[str] = None):
    """Get all tickets with optional filters"""
    tickets = list(tickets_db.values())
    
    if status:
        tickets = [t for t in tickets if t["status"] == status]
    if priority:
        tickets = [t for t in tickets if t["priority"] == priority]
    
    tickets.sort(key=lambda x: x["created_at"], reverse=True)
    return tickets

@app.get("/api/tickets/{ticket_id}", response_model=Ticket)
def get_ticket(ticket_id: str):
    """Get specific ticket"""
    if ticket_id not in tickets_db:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return tickets_db[ticket_id]

@app.post("/api/tickets", response_model=Ticket, status_code=201)
def create_ticket(ticket: TicketCreate):
    """Create new ticket"""
    ticket_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    
    new_ticket = {
        "id": ticket_id,
        "title": ticket.title,
        "description": ticket.description,
        "status": "open",
        "priority": ticket.priority,
        "assigned_to": ticket.assigned_to,
        "created_at": now,
        "updated_at": now
    }
    
    tickets_db[ticket_id] = new_ticket
    return new_ticket

@app.put("/api/tickets/{ticket_id}", response_model=Ticket)
def update_ticket(ticket_id: str, update: TicketUpdate):
    """Update ticket"""
    if ticket_id not in tickets_db:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket = tickets_db[ticket_id]
    
    if update.title is not None:
        ticket["title"] = update.title
    if update.description is not None:
        ticket["description"] = update.description
    if update.status is not None:
        ticket["status"] = update.status
    if update.priority is not None:
        ticket["priority"] = update.priority
    if update.assigned_to is not None:
        ticket["assigned_to"] = update.assigned_to
    
    ticket["updated_at"] = datetime.utcnow().isoformat()
    return ticket

@app.delete("/api/tickets/{ticket_id}", status_code=204)
def delete_ticket(ticket_id: str):
    """Delete ticket"""
    if ticket_id not in tickets_db:
        raise HTTPException(status_code=404, detail="Ticket not found")
    del tickets_db[ticket_id]

@app.get("/api/stats")
def get_stats():
    """Get dashboard statistics"""
    tickets = list(tickets_db.values())
    
    return {
        "total": len(tickets),
        "by_status": {
            "open": len([t for t in tickets if t["status"] == "open"]),
            "in_progress": len([t for t in tickets if t["status"] == "in_progress"]),
            "resolved": len([t for t in tickets if t["status"] == "resolved"]),
            "closed": len([t for t in tickets if t["status"] == "closed"])
        },
        "by_priority": {
            "low": len([t for t in tickets if t["priority"] == "low"]),
            "medium": len([t for t in tickets if t["priority"] == "medium"]),
            "high": len([t for t in tickets if t["priority"] == "high"]),
            "critical": len([t for t in tickets if t["priority"] == "critical"])
        }
    }