/**
 * API Service for the NACOS Complaint System
 * Handles all API requests and data fetching operations
 */
class APIService {
  constructor() {
    this.baseURL = 'https://complaint-system-1os4.onrender.com/api';
    this.headers = {
      'Content-Type': 'application/json',
    };
    // Track pending requests for potential cancellation
    this.pendingRequests = {};
  }

  /**
   * Add authentication token to headers
   */
  setAuthToken() {
    const token = localStorage.getItem('authToken');
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  /**
   * Generic method to make API requests
   * @param {string} endpoint - API endpoint
   * @param {object} options - Request options
   * @returns {Promise} - Promise that resolves to the API response
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Add auth token to headers if available
    this.setAuthToken();
    
    const requestId = `${options.method || 'GET'}-${endpoint}-${Date.now()}`;
    
    // Create request configuration
    const config = {
      headers: this.headers,
      ...options,
    };
    
    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`);
      
      // Track request for potential cancellation
      const controller = new AbortController();
      config.signal = controller.signal;
      this.pendingRequests[requestId] = controller;
      
      // Make request
      const response = await fetch(url, config);
      const data = await response.json();
      
      // Remove from pending requests
      delete this.pendingRequests[requestId];

      if (!response.ok) {
        throw new Error(data.message || `HTTP Error ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle AbortError separately
      if (error.name === 'AbortError') {
        console.log(`Request cancelled: ${endpoint}`);
        return { cancelled: true };
      }
      
      throw error;
    }
  }

  /**
   * Cancel an ongoing request
   * @param {string} requestId - ID of the request to cancel
   */
  cancelRequest(requestId) {
    if (this.pendingRequests[requestId]) {
      this.pendingRequests[requestId].abort();
      delete this.pendingRequests[requestId];
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    Object.values(this.pendingRequests).forEach(controller => {
      controller.abort();
    });
    this.pendingRequests = {};
  }

  // ==============================
  // Authentication Methods
  // ==============================
  
  /**
   * Login user
   * @param {object} data - Login credentials
   * @returns {Promise} - Promise that resolves to user data
   */
  async loginUser(data) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Unified registration method
   * @param {object} data - Registration data including role
   * @returns {Promise} - Promise that resolves to user data
   */
  async register(data) {
    const endpoint = '/registeration';
    
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Register student user (legacy method)
   * @param {object} data - Student data
   * @returns {Promise} - Promise that resolves to user data
   */
  async registerUser(data) {
    return this.register({ ...data, role: 'student' });
  }

  /**
   * Register admin user (legacy method)
   * @param {object} data - Admin data
   * @returns {Promise} - Promise that resolves to user data
   */
  async registerAdmin(data) {
    return this.register({ ...data, role: 'admin' });
  }

  /**
   * Logout user
   * @param {boolean} showConfirmation - Whether to show confirmation dialog
   */
  logout(showConfirmation = false) {
    const performLogout = () => {
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      localStorage.removeItem('userId');
      localStorage.removeItem('authToken');
      
      Swal.fire({
        icon: 'success',
        title: 'Logged Out',
        text: 'You have been successfully logged out.',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        window.location.href = 'index.html';
      });
    };

    if (showConfirmation) {
      Swal.fire({
        title: 'Logout',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, logout'
      }).then((result) => {
        if (result.isConfirmed) {
          performLogout();
        }
      });
    } else {
      performLogout();
    }
  }

  // ==============================
  // Complaint Methods
  // ==============================
  
  /**
   * Get all complaints
   * @param {object} filters - Optional filters (status, priority, etc)
   * @returns {Promise} - Promise that resolves to complaints list
   */
  async getComplaints(filters = {}) {
    // Build query string from filters
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/complaints?${queryParams}` : '/complaints';
    
    return this.request(endpoint);
  }

  /**
   * Create a new complaint
   * @param {object} data - Complaint data
   * @returns {Promise} - Promise that resolves to created complaint
   */
  async createComplaint(data) {
    return this.request('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get a complaint by ID
   * @param {string} id - Complaint ID
   * @returns {Promise} - Promise that resolves to complaint details
   */
  async getComplaintById(id) {
    return this.request(`/complaints/${id}`);
  }

  /**
   * Update a complaint
   * @param {string} id - Complaint ID
   * @param {object} data - Updated data
   * @returns {Promise} - Promise that resolves to updated complaint
   */
  async updateComplaint(id, data) {
    return this.request(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a complaint
   * @param {string} id - Complaint ID
   * @returns {Promise} - Promise that resolves to deletion status
   */
  async deleteComplaint(id) {
    return this.request(`/complaints/${id}`, {
      method: 'DELETE',
    });
  }

  // ==============================
  // Admin-specific Methods
  // ==============================
  
  /**
   * Update complaint status (admin)
   * @param {string} id - Complaint ID
   * @param {string} status - New status
   * @returns {Promise} - Promise that resolves to updated complaint
   */
  async updateComplaintStatus(id, status) {
    return this.request(`/admin/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  /**
   * Get all users (admin)
   * @param {object} filters - Optional filters
   * @returns {Promise} - Promise that resolves to users list
   */
  async getAllUsers(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/admin/users?${queryParams}` : '/admin/users';
    
    return this.request(endpoint);
  }

  /**
   * Get dashboard statistics (admin)
   * @returns {Promise} - Promise that resolves to dashboard stats
   */
  async getDashboardStats() {
    return this.request('/admin/dashboard/stats');
  }

  /**
   * Get recent complaints for dashboard (admin)
   * @param {number} limit - Number of complaints to retrieve
   * @returns {Promise} - Promise that resolves to recent complaints
   */
  async getRecentComplaints(limit = 5) {
    return this.request(`/admin/dashboard/recent-complaints?limit=${limit}`);
  }

  /**
   * Get complaint statistics by type (admin)
   * @returns {Promise} - Promise that resolves to complaint type stats
   */
  async getComplaintTypeStats() {
    return this.request('/admin/dashboard/complaint-types');
  }

  /**
   * Get complaint statistics by status (admin)
   * @returns {Promise} - Promise that resolves to complaint status stats
   */
  async getComplaintStatusStats() {
    return this.request('/admin/dashboard/complaint-status');
  }

  // ==============================
  // User Management Methods
  // ==============================
  
  /**
   * Create a new user (admin)
   * @param {object} data - User data
   * @returns {Promise} - Promise that resolves to created user
   */
  async createUser(data) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a user (admin)
   * @param {string} id - User ID
   * @param {object} data - Updated user data
   * @returns {Promise} - Promise that resolves to updated user
   */
  async updateUser(id, data) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a user (admin)
   * @param {string} id - User ID
   * @returns {Promise} - Promise that resolves to deletion status
   */
  async deleteUser(id) {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get user by ID (admin)
   * @param {string} id - User ID
   * @returns {Promise} - Promise that resolves to user details
   */
  async getUserById(id) {
    return this.request(`/admin/users/${id}`);
  }
  
  // ==============================
  // Analytics Methods
  // ==============================
  
  /**
   * Get analytics data (admin)
   * @param {object} params - Analytics parameters
   * @returns {Promise} - Promise that resolves to analytics data
   */
  async getAnalyticsData(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/admin/analytics?${queryParams}` : '/admin/analytics';
    
    return this.request(endpoint);
  }
  
  /**
   * Generate analytics report (admin)
   * @param {string} format - Report format (pdf, csv)
   * @param {object} filters - Report filters
   * @returns {Promise} - Promise that resolves to report URL
   */
  async generateReport(format = 'pdf', filters = {}) {
    return this.request('/admin/reports/generate', {
      method: 'POST',
      body: JSON.stringify({
        format,
        filters
      }),
    });
  }

  // ==============================
  // Settings Methods
  // ==============================
  
  /**
   * Get system settings (admin)
   * @returns {Promise} - Promise that resolves to system settings
   */
  async getSystemSettings() {
    return this.request('/admin/settings');
  }
  
  /**
   * Update system settings (admin)
   * @param {object} settings - Settings to update
   * @returns {Promise} - Promise that resolves to updated settings
   */
  async updateSystemSettings(settings) {
    return this.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  /* ==============================
   * Mock Data Methods (For Development)
   * ==============================
   * 
   * NOTE: Mock data functionality has been commented out
   * to ensure the system uses only real user-submitted data
   
  getMockDashboardData() {
    return {
      pendingCount: 23,
      inProgressCount: 12,
      resolvedCount: 121,
      totalUsers: 89,
      recentComplaints: [
        {
          id: '1',
          ticketId: 'NACOS-000001',
          studentName: 'John Doe',
          studentId: 'CS/2020/001',
          type: 'Academic',
          status: 'pending',
          priority: 'medium',
          dateCreated: '2024-01-15T10:30:00Z',
          subject: 'Unable to access course materials'
        },
        {
          id: '2',
          ticketId: 'NACOS-000002',
          studentName: 'Jane Smith',
          studentId: 'CS/2020/002',
          type: 'Technical',
          status: 'in_progress',
          priority: 'high',
          dateCreated: '2024-01-14T14:20:00Z',
          subject: 'Password reset not working'
        },
        {
          id: '3',
          ticketId: 'NACOS-000003',
          studentName: 'Mike Johnson',
          studentId: 'CS/2020/003',
          type: 'Administrative',
          status: 'resolved',
          priority: 'low',
          dateCreated: '2024-01-13T09:15:00Z',
          subject: 'Transcript request delay'
        }
      ],
      complaintsByType: {
        Academic: 45,
        Technical: 32,
        Administrative: 27,
        Other: 8
      },
      complaintsByStatus: {
        pending: 23,
        in_progress: 12,
        resolved: 54,
        closed: 23
      }
    };
  }
  */
}

// Initialize API service
const api = new APIService();

// For debugging - remove in production
window.api = api;