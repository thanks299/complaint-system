/**
 * API Service for the NACOS Complaint System
 * Handles all API requests and data fetching operations
 */
class APIService {
  constructor() {
    // Base URL for your backend API
    this.baseURL = 'https://complaint-system-1os4.onrender.com/api';
    
    // For local development, optionally switch to localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Uncomment this line if you want to use a local API during development
      // this.baseURL = 'http://localhost:3001/api'; 
    }
    
    this.headers = {
      'Content-Type': 'application/json',
    };
    // Track pending requests for potential cancellation
    this.pendingRequests = {};
    
    console.log('🌐 API Service initialized with base URL:', this.baseURL);
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
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} endpoint - API endpoint
   * @param {object} data - Request body for POST/PUT requests
   * @returns {Promise} - Promise that resolves to the API response
   */
  async request(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Add auth token to headers if available
    this.setAuthToken();
    
    const requestId = `${method}-${endpoint}-${Date.now()}`;
    
    // Create request configuration
    const options = {
      method,
      headers: this.headers,
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }
    
    try {
      console.log(`🌐 API Request: ${method} ${endpoint}`);
      
      // Track request for potential cancellation
      const controller = new AbortController();
      options.signal = controller.signal;
      this.pendingRequests[requestId] = controller;
      
      // Make request
      const response = await fetch(url, options);
      
      // Remove from pending requests
      delete this.pendingRequests[requestId];
      
      // For debugging - log the actual response
      console.log(`🌐 API Response status for ${method} ${endpoint}:`, response.status);

      // Parse the response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
        try {
          // Try to parse as JSON anyway
          data = JSON.parse(data);
        } catch (e) {
          // Keep as text if not valid JSON
        }
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP Error ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle AbortError separately
      if (error.name === 'AbortError') {
        console.log(`Request cancelled: ${endpoint}`);
        return { cancelled: true };
      }
      
      // If we're in development, provide fallback data for certain endpoints
      if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && 
          endpoint === '/admin/dashboard/stats') {
        console.warn('Using fallback data for development');
        return this.getFallbackDashboardData();
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
    return this.request('POST', '/login', data);
  }

  /**
   * Unified registration method
   * @param {object} data - Registration data including role
   * @returns {Promise} - Promise that resolves to user data
   */
  async register(data) {
    const endpoint = '/registeration';
    
    return this.request('POST', endpoint, data);
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
      
      // Assuming Swal is available globally
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'success',
          title: 'Logged Out',
          text: 'You have been successfully logged out.',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          window.location.href = 'index.html';
        });
      } else {
        window.location.href = 'index.html';
      }
    };

    if (showConfirmation && typeof Swal !== 'undefined') {
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
    
    return this.request('GET', endpoint);
  }

  /**
   * Create a new complaint
   * @param {object} data - Complaint data
   * @returns {Promise} - Promise that resolves to created complaint
   */
  async createComplaint(data) {
    return this.request('POST', '/complaints', data);
  }

  /**
   * Submit complaint (alias for backwards compatibility)
   * @param {object} data - Complaint data
   * @returns {Promise} - Promise that resolves to created complaint
   */
  async submitComplaint(data) {
    return this.request('POST', '/complaintform', data);
  }

  /**
   * Get a complaint by ID
   * @param {string} id - Complaint ID
   * @returns {Promise} - Promise that resolves to complaint details
   */
  async getComplaintById(id) {
    return this.request('GET', `/complaints/${id}`);
  }
  
  /**
   * Get complaint details (alias for admin dashboard)
   * @param {string} id - Complaint ID
   * @returns {Promise} - Promise that resolves to complaint details
   */
  async getComplaintDetails(id) {
    return this.request('GET', `/complaints/${id}`);
  }

  /**
   * Update a complaint
   * @param {string} id - Complaint ID
   * @param {object} data - Updated data
   * @returns {Promise} - Promise that resolves to updated complaint
   */
  async updateComplaint(id, data) {
    return this.request('PUT', `/complaints/${id}`, data);
  }

  /**
   * Delete a complaint
   * @param {string} id - Complaint ID
   * @returns {Promise} - Promise that resolves to deletion status
   */
  async deleteComplaint(id) {
    return this.request('DELETE', `/complaints/${id}`);
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
    return this.request('PATCH', `/admin/complaints/${id}/status`, { status });
  }

  /**
   * Get all users (admin)
   * @param {object} filters - Optional filters
   * @returns {Promise} - Promise that resolves to users list
   */
  async getAllUsers(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/admin/users?${queryParams}` : '/admin/users';
    
    return this.request('GET', endpoint);
  }

  /**
   * Get dashboard statistics (admin)
   * @returns {Promise} - Promise that resolves to dashboard stats
   */
  async getDashboardStats() {
    try {
      return await this.request('GET', '/admin/dashboard/stats');
    } catch (error) {
      // If we're in development, provide fallback data
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.warn('Using fallback dashboard data for development');
        return this.getFallbackDashboardData();
      }
      throw error;
    }
  }

  /**
   * Get recent complaints for dashboard (admin)
   * @param {number} limit - Number of complaints to retrieve
   * @returns {Promise} - Promise that resolves to recent complaints
   */
  async getRecentComplaints(limit = 5) {
    return this.request('GET', `/admin/dashboard/recent-complaints?limit=${limit}`);
  }

  /**
   * Get complaint statistics by type (admin)
   * @returns {Promise} - Promise that resolves to complaint type stats
   */
  async getComplaintTypeStats() {
    return this.request('GET', '/admin/dashboard/complaint-types');
  }

  /**
   * Get complaint statistics by status (admin)
   * @returns {Promise} - Promise that resolves to complaint status stats
   */
  async getComplaintStatusStats() {
    return this.request('GET', '/admin/dashboard/complaint-status');
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
    return this.request('POST', '/admin/users', data);
  }

  /**
   * Update a user (admin)
   * @param {string} id - User ID
   * @param {object} data - Updated user data
   * @returns {Promise} - Promise that resolves to updated user
   */
  async updateUser(id, data) {
    return this.request('PUT', `/admin/users/${id}`, data);
  }

  /**
   * Delete a user (admin)
   * @param {string} id - User ID
   * @returns {Promise} - Promise that resolves to deletion status
   */
  async deleteUser(id) {
    return this.request('DELETE', `/admin/users/${id}`);
  }

  /**
   * Get user by ID (admin)
   * @param {string} id - User ID
   * @returns {Promise} - Promise that resolves to user details
   */
  async getUserById(id) {
    return this.request('GET', `/admin/users/${id}`);
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
    
    return this.request('GET', endpoint);
  }
  
  /**
   * Generate analytics report (admin)
   * @param {object} config - Report configuration
   * @returns {Promise} - Promise that resolves to report URL
   */
  async generateReport(config) {
    return this.request('POST', '/admin/reports/generate', config);
  }

  // ==============================
  // Settings Methods
  // ==============================
  
  /**
   * Get system settings (admin)
   * @returns {Promise} - Promise that resolves to system settings
   */
  async getSystemSettings() {
    return this.request('GET', '/admin/settings');
  }
  
  /**
   * Update system settings (admin)
   * @param {object} settings - Settings to update
   * @returns {Promise} - Promise that resolves to updated settings
   */
  async updateSystemSettings(settings) {
    return this.request('PUT', '/admin/settings', settings);
  }

  /**
   * Fallback data for development
   * @returns {object} - Dashboard data for development
   */
  getFallbackDashboardData() {
    console.log('📊 Providing fallback dashboard data for development');
    
    return {
      success: true,
      stats: {
        pending: 12,
        inProgress: 8,
        resolved: 24,
        totalUsers: 45
      },
      recentComplaints: [
        {
          id: 'C001',
          student: 'John Doe',
          type: 'Academic',
          status: 'Pending',
          priority: 'High',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Issue with course registration'
        },
        {
          id: 'C002',
          student: 'Alice Smith',
          type: 'Technical',
          status: 'In Progress',
          priority: 'Medium',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Cannot access online resources'
        },
        {
          id: 'C003',
          student: 'Bob Johnson',
          type: 'Administrative',
          status: 'Resolved',
          priority: 'Low',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'ID card renewal issue'
        },
        {
          id: 'C004',
          student: 'Sarah Williams',
          type: 'Facility',
          status: 'Pending',
          priority: 'Medium',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Classroom projector not working'
        },
        {
          id: 'C005',
          student: 'Mike Brown',
          type: 'Academic',
          status: 'Resolved',
          priority: 'High',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Missing course materials'
        }
      ]
    };
  }
}

// Initialize API service
const api = new APIService();

// For debugging - remove in production
window.api = api;