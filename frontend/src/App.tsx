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
  const [searchQuery, setSearchQuery] = useState<string>('');
  
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
    
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTicket) {
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

  // Filter tickets by search
  const filteredTickets = tickets.filter(ticket => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ticket.title.toLowerCase().includes(query) ||
      ticket.description.toLowerCase().includes(query) ||
      (ticket.assigned_to && ticket.assigned_to.toLowerCase().includes(query))
    );
  });

  return (
    <div className="app">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="brand-name">Ticket Tracker</span>
          </div>
          
          <div className="nav-actions">
            <div className="connection-badge">
              <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`}></span>
              <span className="status-text">{connected ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="app-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Overview</h3>
            {stats && (
              <div className="stats-list">
                <div className="stat-item">
                  <div className="stat-icon total">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">Total</div>
                    <div className="stat-value">{stats.total}</div>
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-icon open">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">Open</div>
                    <div className="stat-value">{stats.by_status.open}</div>
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-icon in-progress">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">In Progress</div>
                    <div className="stat-value">{stats.by_status.in_progress}</div>
                  </div>
                </div>
                
                <div className="stat-item">
                  <div className="stat-icon resolved">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">Resolved</div>
                    <div className="stat-value">{stats.by_status.resolved}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1 className="page-title">All Tickets</h1>
              <p className="page-subtitle">Manage and track your team's work</p>
            </div>
            <button className="btn btn-primary" onClick={handleCreate}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4v16m8-8H4" />
              </svg>
              New Ticket
            </button>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-bar">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filters">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
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
                className="filter-select"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4m0 4h.01" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading tickets...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredTickets.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3>No tickets found</h3>
              <p>{searchQuery ? 'Try adjusting your search or filters' : 'Create your first ticket to get started'}</p>
              {!searchQuery && (
                <button className="btn btn-primary" onClick={handleCreate}>
                  Create Ticket
                </button>
              )}
            </div>
          )}

          {/* Tickets List */}
          {!loading && filteredTickets.length > 0 && (
            <div className="tickets-list">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="ticket-card">
                  <div className="ticket-main">
                    <div className="ticket-header">
                      <h3 className="ticket-title">{ticket.title}</h3>
                      <div className="ticket-badges">
                        <span className={`badge badge-status status-${ticket.status}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`badge badge-priority priority-${ticket.priority}`}>
                          {ticket.priority}
                        </span>
                      </div>
                    </div>

                    <p className="ticket-description">{ticket.description}</p>

                    <div className="ticket-meta">
                      <div className="ticket-assignee">
                        <div className="avatar">{getInitials(ticket.assigned_to)}</div>
                        <span className="assignee-name">{ticket.assigned_to || 'Unassigned'}</span>
                      </div>
                      <span className="ticket-date">{formatDate(ticket.created_at)}</span>
                    </div>
                  </div>

                  <div className="ticket-actions">
                    <button 
                      className="action-btn"
                      onClick={() => handleEdit(ticket)}
                      title="Edit"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    
                    {ticket.status === 'open' && (
                      <button 
                        className="action-btn action-primary"
                        onClick={() => handleStatusChange(ticket, 'in_progress')}
                        title="Start Progress"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </button>
                    )}
                    
                    {ticket.status === 'in_progress' && (
                      <button 
                        className="action-btn action-success"
                        onClick={() => handleStatusChange(ticket, 'resolved')}
                        title="Mark Resolved"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </button>
                    )}
                    
                    <button 
                      className="action-btn action-danger"
                      onClick={() => handleDelete(ticket.id)}
                      title="Delete"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingTicket ? 'Edit Ticket' : 'Create New Ticket'}
              </h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  minLength={3}
                  maxLength={200}
                  placeholder="Enter a clear, concise title"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  minLength={10}
                  maxLength={2000}
                  placeholder="Provide detailed information about the issue or task"
                  className="form-textarea"
                  rows={4}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as Priority})}
                    className="form-select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <input
                    type="text"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                    placeholder="Team member name"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTicket ? 'Update Ticket' : 'Create Ticket'}
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