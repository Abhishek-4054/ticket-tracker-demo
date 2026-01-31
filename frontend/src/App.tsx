import React, { useState, useEffect } from 'react';
import { ticketAPI } from './api';
import { Ticket, TicketCreate, Stats } from './types';
import './App.css';

type Priority = 'low' | 'medium' | 'high' | 'critical';
type Status = 'open' | 'in_progress' | 'resolved' | 'closed';

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<TicketCreate>({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: '',
  });

  // Load tickets and stats
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [ticketsData, statsData] = await Promise.all([
        ticketAPI.getTickets(statusFilter, priorityFilter),
        ticketAPI.getStats(),
      ]);
      
      setTickets(ticketsData);
      setStats(statsData);
      setConnected(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Check backend health
  const checkHealth = async () => {
    try {
      await ticketAPI.healthCheck();
      setConnected(true);
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    loadData();
    checkHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTicket) {
        // When editing, create proper update object
        await ticketAPI.updateTicket(editingTicket.id, {
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          assigned_to: formData.assigned_to || undefined,
        });
      } else {
        await ticketAPI.createTicket(formData);
      }
      
      setShowModal(false);
      setEditingTicket(null);
      resetForm();
      loadData();
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Failed to save ticket'));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      assigned_to: '',
    });
  };

  // Open modal for creating
  const handleCreate = () => {
    resetForm();
    setEditingTicket(null);
    setShowModal(true);
  };

  // Open modal for editing
  const handleEdit = (ticket: Ticket) => {
    setFormData({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      assigned_to: ticket.assigned_to || '',
    });
    setEditingTicket(ticket);
    setShowModal(true);
  };

  // Delete ticket
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        await ticketAPI.deleteTicket(id);
        loadData();
      } catch (err: any) {
        alert('Error: ' + (err.message || 'Failed to delete ticket'));
      }
    }
  };

  // Update ticket status
  const handleStatusChange = async (ticket: Ticket, newStatus: Status) => {
    try {
      await ticketAPI.updateTicket(ticket.id, { status: newStatus });
      loadData();
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Failed to update status'));
    }
  };

  // Get avatar initials
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="App">
      {/* Header */}
      <div className="header">
        <h1>🎫 Ticket Tracker</h1>
        <p>Professional Issue & Task Management System</p>
        <div className="connection-status">
          <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}></div>
          <span>{connected ? 'Connected to backend' : 'Backend disconnected'}</span>
        </div>
      </div>

      {/* Dashboard Stats */}
      {stats && (
        <div className="dashboard-stats">
          <div className="stat-card total">
            <h3>Total Tickets</h3>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat-card open">
            <h3>Open</h3>
            <div className="stat-value">{stats.by_status.open}</div>
          </div>
          <div className="stat-card in-progress">
            <h3>In Progress</h3>
            <div className="stat-value">{stats.by_status.in_progress}</div>
          </div>
          <div className="stat-card resolved">
            <h3>Resolved</h3>
            <div className="stat-value">{stats.by_status.resolved}</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Controls */}
        <div className="controls">
          <div className="filters">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={handleCreate}>
            ➕ Create Ticket
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading">Loading tickets...</div>
        )}

        {/* Tickets Grid */}
        {!loading && tickets.length === 0 && (
          <div className="empty-state">
            <h3>No tickets found</h3>
            <p>Create your first ticket to get started!</p>
          </div>
        )}

        {!loading && tickets.length > 0 && (
          <div className="tickets-grid">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <div>
                    <h3 className="ticket-title">{ticket.title}</h3>
                    <div className="ticket-badges">
                      <span className={`badge status-${ticket.status}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`badge priority-${ticket.priority}`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="ticket-description">{ticket.description}</p>

                <div className="ticket-footer">
                  <div className="ticket-assignee">
                    <div className="avatar">
                      {getInitials(ticket.assigned_to)}
                    </div>
                    <span>{ticket.assigned_to || 'Unassigned'}</span>
                  </div>
                  <span>{formatDate(ticket.created_at)}</span>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => handleEdit(ticket)}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleDelete(ticket.id)}
                  >
                    🗑️ Delete
                  </button>
                  {ticket.status === 'open' && (
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleStatusChange(ticket, 'in_progress')}
                    >
                      ▶️ Start
                    </button>
                  )}
                  {ticket.status === 'in_progress' && (
                    <button 
                      className="btn btn-secondary"
                      onClick={() => handleStatusChange(ticket, 'resolved')}
                    >
                      ✅ Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingTicket ? 'Edit Ticket' : 'Create New Ticket'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  minLength={3}
                  maxLength={200}
                  placeholder="Enter ticket title"
                />
              </div>

              <div className="form-group">
                <label>. Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  minLength={10}
                  maxLength={2000}
                  placeholder="Describe the issue or task in detail"
                />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value as Priority})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="form-group">
                <label>Assign To</label>
                <input
                  type="text"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                  placeholder="Enter assignee name (optional)"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTicket ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;