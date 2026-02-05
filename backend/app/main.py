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
# NEW UNTESTED UTILITY FUNCTIONS
# These functions have NO test coverage!
# ============================================

def validate_ticket_priority(priority: str) -> bool:
    """
    Validate if priority is in allowed values
    NO TESTS FOR THIS FUNCTION - will reduce coverage!
    """
    valid_priorities = ["low", "medium", "high", "critical"]
    if priority.lower() not in valid_priorities:
        return False
    return True


def calculate_ticket_age_days(created_at: str) -> int:
    """
    Calculate how many days old a ticket is
    NO TESTS FOR THIS FUNCTION - will reduce coverage!
    """
    try:
        created = datetime.fromisoformat(created_at)
        now = datetime.utcnow()
        delta = now - created
        return delta.days
    except Exception:
        return 0


def get_overdue_tickets(max_days: int = 7) -> List[dict]:
    """
    Get tickets that are open and older than max_days
    NO TESTS FOR THIS FUNCTION - will reduce coverage!
    """
    overdue = []
    for ticket in tickets_db.values():
        if ticket["status"] == "open":
            age = calculate_ticket_age_days(ticket["created_at"])
            if age > max_days:
                overdue.append(ticket)
    return overdue


def assign_ticket_automatically(ticket_id: str, team_members: List[str]) -> bool:
    """
    Auto-assign ticket to team member with least tickets
    NO TESTS FOR THIS FUNCTION - will reduce coverage!
    """
    if ticket_id not in tickets_db:
        return False
    
    if not team_members:
        return False
    
    # Count tickets per member
    assignment_counts = {member: 0 for member in team_members}
    for ticket in tickets_db.values():
        if ticket["assigned_to"] in assignment_counts:
            assignment_counts[ticket["assigned_to"]] += 1
    
    # Find member with least assignments
    least_busy = min(assignment_counts.items(), key=lambda x: x[1])
    
    # Assign ticket
    tickets_db[ticket_id]["assigned_to"] = least_busy[0]
    tickets_db[ticket_id]["updated_at"] = datetime.utcnow().isoformat()
    
    return True


def generate_ticket_report(status_filter: Optional[str] = None) -> dict:
    """
    Generate detailed report of tickets
    NO TESTS FOR THIS FUNCTION - will reduce coverage!
    """
    tickets = list(tickets_db.values())
    
    if status_filter:
        tickets = [t for t in tickets if t["status"] == status_filter]
    
    report = {
        "total_tickets": len(tickets),
        "average_age_days": 0,
        "oldest_ticket_days": 0,
        "unassigned_count": 0,
        "priority_distribution": {},
        "status_distribution": {}
    }
    
    if not tickets:
        return report
    
    # Calculate metrics
    ages = [calculate_ticket_age_days(t["created_at"]) for t in tickets]
    report["average_age_days"] = sum(ages) // len(ages) if ages else 0
    report["oldest_ticket_days"] = max(ages) if ages else 0
    report["unassigned_count"] = len([t for t in tickets if not t["assigned_to"]])
    
    # Priority distribution
    for priority in ["low", "medium", "high", "critical"]:
        count = len([t for t in tickets if t["priority"] == priority])
        report["priority_distribution"][priority] = count
    
    # Status distribution
    for status in ["open", "in_progress", "resolved", "closed"]:
        count = len([t for t in tickets if t["status"] == status])
        report["status_distribution"][status] = count
    
    return report


def bulk_update_tickets(ticket_ids: List[str], updates: dict) -> dict:
    """
    Update multiple tickets at once
    NO TESTS FOR THIS FUNCTION - will reduce coverage!
    """
    results = {
        "updated": [],
        "failed": [],
        "not_found": []
    }
    
    for ticket_id in ticket_ids:
        if ticket_id not in tickets_db:
            results["not_found"].append(ticket_id)
            continue
        
        try:
            ticket = tickets_db[ticket_id]
            
            if "status" in updates:
                ticket["status"] = updates["status"]
            if "priority" in updates:
                ticket["priority"] = updates["priority"]
            if "assigned_to" in updates:
                ticket["assigned_to"] = updates["assigned_to"]
            
            ticket["updated_at"] = datetime.utcnow().isoformat()
            results["updated"].append(ticket_id)
        except Exception:
            results["failed"].append(ticket_id)
    
    return results


class TicketAnalytics:
    """
    Analytics class for ticket metrics
    NO TESTS FOR THIS CLASS - will reduce coverage!
    """
    
    def __init__(self, tickets: dict):
        self.tickets = tickets
    
    def get_completion_rate(self) -> float:
        """Calculate percentage of resolved/closed tickets"""
        if not self.tickets:
            return 0.0
        
        completed = len([
            t for t in self.tickets.values() 
            if t["status"] in ["resolved", "closed"]
        ])
        return (completed / len(self.tickets)) * 100
    
    def get_average_resolution_time(self) -> float:
        """Calculate average time to resolve tickets (in days)"""
        resolved = [
            t for t in self.tickets.values() 
            if t["status"] in ["resolved", "closed"]
        ]
        
        if not resolved:
            return 0.0
        
        times = []
        for ticket in resolved:
            created = datetime.fromisoformat(ticket["created_at"])
            updated = datetime.fromisoformat(ticket["updated_at"])
            delta = updated - created
            times.append(delta.days)
        
        return sum(times) / len(times) if times else 0.0
    
    def get_tickets_by_assignee(self) -> dict:
        """Get ticket count grouped by assignee"""
        assignees = {}
        for ticket in self.tickets.values():
            assignee = ticket["assigned_to"] or "Unassigned"
            assignees[assignee] = assignees.get(assignee, 0) + 1
        return assignees
    
    def get_high_priority_open_count(self) -> int:
        """Count high/critical priority tickets that are still open"""
        count = 0
        for ticket in self.tickets.values():
            if ticket["status"] == "open" and ticket["priority"] in ["high", "critical"]:
                count += 1
        return count


# ============================================
# API ENDPOINTS (ORIGINAL - THESE ARE TESTED)
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


# ============================================
# NEW UNTESTED API ENDPOINTS
# These endpoints have NO test coverage!
# ============================================

@app.get("/api/tickets/overdue/list")
def get_overdue_tickets_endpoint(max_days: int = 7):
    """
    Get overdue tickets
    NO TESTS FOR THIS ENDPOINT - will reduce coverage!
    """
    overdue = get_overdue_tickets(max_days)
    return {
        "count": len(overdue),
        "max_days": max_days,
        "tickets": overdue
    }


@app.post("/api/tickets/{ticket_id}/auto-assign")
def auto_assign_endpoint(ticket_id: str, team_members: List[str]):
    """
    Auto-assign ticket to least busy team member
    NO TESTS FOR THIS ENDPOINT - will reduce coverage!
    """
    success = assign_ticket_automatically(ticket_id, team_members)
    if not success:
        raise HTTPException(status_code=400, detail="Assignment failed")
    return {"message": "Ticket assigned successfully", "ticket_id": ticket_id}


@app.get("/api/reports/detailed")
def detailed_report_endpoint(status: Optional[str] = None):
    """
    Get detailed ticket report
    NO TESTS FOR THIS ENDPOINT - will reduce coverage!
    """
    report = generate_ticket_report(status)
    return report


@app.post("/api/tickets/bulk-update")
def bulk_update_endpoint(ticket_ids: List[str], updates: dict):
    """
    Bulk update multiple tickets
    NO TESTS FOR THIS ENDPOINT - will reduce coverage!
    """
    results = bulk_update_tickets(ticket_ids, updates)
    return results


@app.get("/api/analytics/overview")
def analytics_overview():
    """
    Get analytics overview
    NO TESTS FOR THIS ENDPOINT - will reduce coverage!
    """
    analytics = TicketAnalytics(tickets_db)
    return {
        "completion_rate": analytics.get_completion_rate(),
        "average_resolution_time_days": analytics.get_average_resolution_time(),
        "tickets_by_assignee": analytics.get_tickets_by_assignee(),
        "high_priority_open": analytics.get_high_priority_open_count()
    }