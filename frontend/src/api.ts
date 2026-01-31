import axios from 'axios';
import { Ticket, TicketCreate, TicketUpdate, Stats } from './types';

// In production: Nginx proxies /api to backend-service
// In development: use localhost:8000
const API_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ticketAPI = {
  getTickets: async (status?: string, priority?: string): Promise<Ticket[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    const response = await api.get<Ticket[]>(`/api/tickets?${params.toString()}`);
    return response.data;
  },

  getTicket: async (id: string): Promise<Ticket> => {
    const response = await api.get<Ticket>(`/api/tickets/${id}`);
    return response.data;
  },

  createTicket: async (ticket: TicketCreate): Promise<Ticket> => {
    const response = await api.post<Ticket>('/api/tickets', ticket);
    return response.data;
  },

  updateTicket: async (id: string, updates: TicketUpdate): Promise<Ticket> => {
    const response = await api.put<Ticket>(`/api/tickets/${id}`, updates);
    return response.data;
  },

  deleteTicket: async (id: string): Promise<void> => {
    await api.delete(`/api/tickets/${id}`);
  },

  getStats: async (): Promise<Stats> => {
    const response = await api.get<Stats>('/api/stats');
    return response.data;
  },

  healthCheck: async (): Promise<{ status: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};