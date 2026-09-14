import { http } from './httpClient';
import { debug } from './logger';

debug('[api] loaded', 'profileService');

/**
 * Get current user profile
 */
export async function getProfile() {
  const response = await http.get('/v1/me');
  return response?.data?.data || response?.data || {};
}

/**
 * Update current user profile
 * @param {Object} data - Profile data to update
 * @param {string} data.first_name
 * @param {string} data.last_name
 * @param {string} data.phone
 * @param {string} data.email
 * @param {string} data.city
 * @param {string} data.province
 * @param {string} data.school_name
 * @param {number} data.grade_id
 */
export async function updateProfile(data) {
  const response = await http.put('/v1/profile', data);
  return response?.data?.data || response?.data || {};
}

/**
 * Upload user avatar
 * @param {File} file - Image file to upload
 */
export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await http.post('/v1/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response?.data?.data || response?.data || {};
}

/**
 * Get all tickets for current user
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status (open, in_progress, waiting_user, closed)
 * @param {string} params.q - Search query
 * @param {number} params.page - Page number
 * @param {number} params.per_page - Items per page
 */
export async function getTickets(params = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.q) query.set('q', params.q);
  if (params.page) query.set('page', String(params.page));
  if (params.per_page) query.set('per_page', String(params.per_page));
  
  const url = '/v1/tickets' + (query.toString() ? `?${query.toString()}` : '');
  const response = await http.get(url);
  // Backend returns paginated data: response.data.data.data is the array
  const paginatedData = response?.data?.data;
  if (paginatedData && Array.isArray(paginatedData.data)) {
    return paginatedData.data;
  }
  return response?.data?.data || response?.data || [];
}

/**
 * Get a single ticket with messages
 * @param {number} id - Ticket ID
 */
export async function getTicket(id) {
  const response = await http.get(`/v1/tickets/${id}`);
  return response?.data?.data || response?.data || null;
}

/**
 * Create a new ticket
 * @param {Object} data - Ticket data
 * @param {string} data.subject - Ticket subject
 * @param {string} data.message - Initial message
 * @param {string} data.priority - Priority (low, medium, high)
 * @param {number} data.department_id - Department ID (optional)
 * @param {number} data.category_id - Category ID (optional)
 */
export async function createTicket(data) {
  const response = await http.post('/v1/tickets', data);
  return response?.data?.data || response?.data || null;
}

/**
 * Add a message to a ticket
 * @param {number} ticketId - Ticket ID
 * @param {string} message - Message text
 */
export async function addTicketMessage(ticketId, message) {
  const response = await http.post(`/v1/tickets/${ticketId}/messages`, { message });
  return response?.data?.data || response?.data || null;
}

/**
 * Close a ticket
 * @param {number} ticketId - Ticket ID
 */
export async function closeTicket(ticketId) {
  const response = await http.post(`/v1/tickets/${ticketId}/close`);
  return response?.data?.data || response?.data || null;
}
