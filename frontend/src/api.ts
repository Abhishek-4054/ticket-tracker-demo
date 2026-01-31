import axios from 'axios';
import { Ticket, TicketCreate, TicketUpdate, Stats } from './types';

// Use environment variable or default to backend service name
const API_URL = process.env.REACT_APP_API_URL || 'http://backend-service:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ticketAPI = {
  // Get all tickets
  getTickets: async (status?: string, priority?: string): Promise<Ticket[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    
    const response = await api.get<Ticket[]>(`/api/tickets?${params.toString()}`);
    return response.data;
  },

  // Get single ticket
  getTicket: async (id: string): Promise<Ticket> => {
    const response = await api.get<Ticket>(`/api/tickets/${id}`);
    return response.data;
  },

  // Create ticket
  createTicket: async (ticket: TicketCreate): Promise<Ticket> => {
    const response = await api.post<Ticket>('/api/tickets', ticket);
    return response.data;
  },

  // Update ticket
  updateTicket: async (id: string, updates: TicketUpdate): Promise<Ticket> => {
    const response = await api.put<Ticket>(`/api/tickets/${id}`, updates);
    return response.data;
  },

  // Delete ticket
  deleteTicket: async (id: string): Promise<void> => {
    await api.delete(`/api/tickets/${id}`);
  },

  // Get statistics
  getStats: async (): Promise<Stats> => {
    const response = await api.get<Stats>('/api/stats');
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};