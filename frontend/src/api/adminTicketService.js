// Admin Tickets API
import { http } from './httpClient';
import { debug } from './logger';

debug('[api] loaded', 'adminTicketService');

/**
 * Get all tickets (admin view)
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>}
 */
export async function getAdminTickets(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.priority) query.set('priority', params.priority);
  if (params.q) query.set('q', params.q);
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));
  
  const url = '/v1/admin/tickets' + (query.toString() ? `?${query.toString()}` : '');
  const response = await http.get(url);
  // Backend returns paginated data: response.data.data.data is the array
  const paginatedData = response?.data?.data;
  if (paginatedData && Array.isArray(paginatedData.data)) {
    return paginatedData.data;
  }
  return response?.data?.data || response?.data || [];
}

/**
 * Get a single ticket with messages (admin view)
 * @param {number} id - Ticket ID
 * @returns {Promise<Object>}
 */
export async function getAdminTicket(id) {
  const response = await http.get(`/v1/admin/tickets/${id}`);
  return response?.data?.data || response?.data || null;
}

/**
 * Reply to a ticket (admin)
 * @param {number} ticketId - Ticket ID
 * @param {string} message - Reply message
 * @returns {Promise<Object>}
 */
export async function addAdminTicketMessage(ticketId, message) {
  const response = await http.post(`/v1/admin/tickets/${ticketId}/messages`, {
    message: message,
  });
  return response?.data?.data || response?.data || null;
}

/**
 * Update ticket status
 * @param {number} ticketId - Ticket ID
 * @param {string} status - New status (open, in_progress, waiting_user, closed)
 * @returns {Promise<Object>}
 */
export async function updateTicketStatus(ticketId, status) {
  const response = await http.put(`/v1/admin/tickets/${ticketId}/status`, {
    status: status,
  });
  return response?.data?.data || response?.data || null;
}

/**
 * Update ticket priority
 * @param {number} ticketId - Ticket ID
 * @param {string} priority - New priority (low, medium, high)
 * @returns {Promise<Object>}
 */
export async function updateTicketPriority(ticketId, priority) {
  const response = await http.put(`/v1/admin/tickets/${ticketId}/priority`, {
    priority: priority,
  });
  return response?.data?.data || response?.data || null;
}

export default {
  getAdminTickets,
  getAdminTicket,
  addAdminTicketMessage,
  updateTicketStatus,
  updateTicketPriority,
};
