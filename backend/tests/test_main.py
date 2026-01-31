import pytest
from fastapi.testclient import TestClient
from app.main import app, tickets_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_db():
    """Reset database before each test"""
    tickets_db.clear()
    yield
    tickets_db.clear()

# ============================================
# BASIC ENDPOINT TESTS
# ============================================

def test_read_root():
    """Test root endpoint returns API info"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    assert data["version"] == "1.0.0"

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "timestamp" in response.json()

# ============================================
# TICKET CRUD TESTS
# ============================================

def test_create_ticket_success():
    """Test creating a valid ticket"""
    ticket_data = {
        "title": "Test Bug Report",
        "description": "This is a detailed description of the bug that needs to be fixed",
        "priority": "high",
        "assigned_to": "John Doe"
    }
    
    response = client.post("/api/tickets", json=ticket_data)
    assert response.status_code == 201
    
    data = response.json()
    assert data["title"] == ticket_data["title"]
    assert data["description"] == ticket_data["description"]
    assert data["status"] == "open"  # Default status
    assert data["priority"] == "high"
    assert "id" in data
    assert "created_at" in data

def test_create_ticket_validation_error():
    """Test ticket creation with invalid data"""
    invalid_data = {
        "title": "AB",  # Too short (min 3 chars)
        "description": "Short",  # Too short (min 10 chars)
        "priority": "high"
    }
    
    response = client.post("/api/tickets", json=invalid_data)
    assert response.status_code == 422  # Validation error

def test_get_all_tickets():
    """Test retrieving all tickets"""
    # Create 3 test tickets
    for i in range(3):
        client.post("/api/tickets", json={
            "title": f"Test Ticket {i+1}",
            "description": f"Description for test ticket number {i+1}",
            "priority": "medium"
        })
    
    response = client.get("/api/tickets")
    assert response.status_code == 200
    tickets = response.json()
    assert len(tickets) == 3

def test_get_tickets_with_status_filter():
    """Test filtering tickets by status"""
    # Create tickets with different statuses
    ticket1 = client.post("/api/tickets", json={
        "title": "Open Ticket",
        "description": "This ticket is open and needs attention",
        "priority": "high"
    }).json()
    
    ticket2 = client.post("/api/tickets", json={
        "title": "Another Ticket",
        "description": "This is another ticket for testing",
        "priority": "low"
    }).json()
    
    # Update one ticket to in_progress
    client.put(f"/api/tickets/{ticket2['id']}", json={"status": "in_progress"})
    
    # Filter by status
    response = client.get("/api/tickets?status=open")
    assert response.status_code == 200
    tickets = response.json()
    assert len(tickets) == 1
    assert tickets[0]["status"] == "open"

def test_get_tickets_with_priority_filter():
    """Test filtering tickets by priority"""
    client.post("/api/tickets", json={
        "title": "High Priority",
        "description": "This is a high priority ticket",
        "priority": "high"
    })
    
    client.post("/api/tickets", json={
        "title": "Low Priority",
        "description": "This is a low priority ticket",
        "priority": "low"
    })
    
    response = client.get("/api/tickets?priority=high")
    assert response.status_code == 200
    tickets = response.json()
    assert len(tickets) == 1
    assert tickets[0]["priority"] == "high"

def test_get_ticket_by_id():
    """Test retrieving a specific ticket by ID"""
    create_response = client.post("/api/tickets", json={
        "title": "Specific Ticket",
        "description": "This ticket will be retrieved by its ID",
        "priority": "medium"
    })
    
    ticket_id = create_response.json()["id"]
    
    response = client.get(f"/api/tickets/{ticket_id}")
    assert response.status_code == 200
    ticket = response.json()
    assert ticket["id"] == ticket_id
    assert ticket["title"] == "Specific Ticket"

def test_get_nonexistent_ticket():
    """Test retrieving a ticket that doesn't exist"""
    response = client.get("/api/tickets/nonexistent-id-12345")
    assert response.status_code == 404
    assert response.json()["detail"] == "Ticket not found"

def test_update_ticket_success():
    """Test updating an existing ticket"""
    # Create ticket
    create_response = client.post("/api/tickets", json={
        "title": "Original Title",
        "description": "Original description for testing",
        "priority": "low"
    })
    
    ticket_id = create_response.json()["id"]
    
    # Update ticket
    update_data = {
        "title": "Updated Title",
        "status": "in_progress",
        "priority": "high"
    }
    
    response = client.put(f"/api/tickets/{ticket_id}", json=update_data)
    assert response.status_code == 200
    
    updated_ticket = response.json()
    assert updated_ticket["title"] == "Updated Title"
    assert updated_ticket["status"] == "in_progress"
    assert updated_ticket["priority"] == "high"
    assert updated_ticket["description"] == "Original description for testing"  # Unchanged

def test_update_partial_ticket():
    """Test partial update (only some fields)"""
    create_response = client.post("/api/tickets", json={
        "title": "Test Ticket",
        "description": "Test description",
        "priority": "medium"
    })
    
    ticket_id = create_response.json()["id"]
    
    # Update only status
    response = client.put(f"/api/tickets/{ticket_id}", json={"status": "resolved"})
    assert response.status_code == 200
    
    ticket = response.json()
    assert ticket["status"] == "resolved"
    assert ticket["title"] == "Test Ticket"  # Unchanged

def test_update_nonexistent_ticket():
    """Test updating a ticket that doesn't exist"""
    response = client.put("/api/tickets/fake-id", json={"status": "closed"})
    assert response.status_code == 404

def test_delete_ticket_success():
    """Test deleting a ticket"""
    create_response = client.post("/api/tickets", json={
        "title": "To Be Deleted",
        "description": "This ticket will be deleted in the test",
        "priority": "low"
    })
    
    ticket_id = create_response.json()["id"]
    
    # Delete ticket
    delete_response = client.delete(f"/api/tickets/{ticket_id}")
    assert delete_response.status_code == 204
    
    # Verify it's gone
    get_response = client.get(f"/api/tickets/{ticket_id}")
    assert get_response.status_code == 404

def test_delete_nonexistent_ticket():
    """Test deleting a ticket that doesn't exist"""
    response = client.delete("/api/tickets/nonexistent-id")
    assert response.status_code == 404

# ============================================
# STATISTICS TESTS
# ============================================

def test_get_statistics():
    """Test statistics endpoint"""
    # Create tickets with different statuses and priorities
    client.post("/api/tickets", json={
        "title": "Ticket 1",
        "description": "Description 1",
        "priority": "high"
    })
    
    ticket2 = client.post("/api/tickets", json={
        "title": "Ticket 2",
        "description": "Description 2",
        "priority": "medium"
    }).json()
    
    client.post("/api/tickets", json={
        "title": "Ticket 3",
        "description": "Description 3",
        "priority": "critical"
    })
    
    # Update one to in_progress
    client.put(f"/api/tickets/{ticket2['id']}", json={"status": "in_progress"})
    
    # Get stats
    response = client.get("/api/stats")
    assert response.status_code == 200
    
    stats = response.json()
    assert stats["total"] == 3
    assert stats["by_status"]["open"] == 2
    assert stats["by_status"]["in_progress"] == 1
    assert stats["by_priority"]["high"] == 1
    assert stats["by_priority"]["medium"] == 1
    assert stats["by_priority"]["critical"] == 1

def test_statistics_empty_database():
    """Test statistics with no tickets"""
    response = client.get("/api/stats")
    assert response.status_code == 200
    
    stats = response.json()
    assert stats["total"] == 0
    assert stats["by_status"]["open"] == 0