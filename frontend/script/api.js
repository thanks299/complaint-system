/**
 * API Service for the NACOS Complaint System
 * Handles all API requests and data fetching operations
 */
class APIService {
  constructor() {
    // Base URL for your backend API
    this.apiBaseUrl = 'https://complaint-system-1ycs.onrender.com/api';
    
    // For local development, optionally switch to localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Uncomment this line if you want to use a local API during development
      // this.apiBaseUrl = 'http://localhost:3001/api'; 
    }
    
    // Get configuration from window.CONFIG if available
    if (window.CONFIG?.api?.baseUrl) {
      this.apiBaseUrl = window.CONFIG.api.baseUrl;
    }
    
    this.timeout = window.CONFIG?.api?.timeout || 10000;
    this.fallbackEnabled = window.CONFIG?.api?.fallback?.enabled ?? true;
    
    this.headers = {
      'Content-Type': 'application/json',
    };
    
    // Track pending requests for potential cancellation
    this.pendingRequests = {};
    
    console.log('🌐 API Service initialized with base URL:', this.apiBaseUrl);
    console.log(`🔄 Fallback mode: ${this.fallbackEnabled ? 'Enabled' : 'Disabled'}`);
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
    try {
      const url = `${this.apiBaseUrl}${endpoint}`;
      
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
      
      console.log(`🌐 API Request: ${method} ${endpoint}`);
      
      // Track request for potential cancellation
      const controller = new AbortController();
      options.signal = controller.signal;
      this.pendingRequests[requestId] = controller;
      
      // Create a timeout promise to cancel the request if it takes too long
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Request timeout after ${this.timeout/1000} seconds`)), this.timeout);
      });
      
      // Make request with timeout
      const response = await Promise.race([
        fetch(url, options),
        timeoutPromise
      ]);
      
      // Remove from pending requests
      delete this.pendingRequests[requestId];
      
      // For debugging - log the actual response
      console.log(`🌐 API Response status for ${method} ${endpoint}:`, response.status);

      // Parse the response
      let responseData;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
        try {
          // Try to parse as JSON anyway
          responseData = JSON.parse(responseData);
        } catch (e) {
          // Keep as text if not valid JSON
        }
      }

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `HTTP Error ${response.status}`);
      }

      return responseData;
    } catch (error) {
      console.error('API Error:', error);
      
      // Handle AbortError separately
      if (error.name === 'AbortError') {
        console.log(`Request cancelled: ${endpoint}`);
        return { cancelled: true };
      }
      
      // Check if this is a network/connection error
      if (error.message.includes('Failed to fetch') || 
          error.message.includes('NetworkError') ||
          error.message.includes('timeout') ||
          error.message.includes('Network request failed')) {
        
        console.warn('Network connection issue detected. Using fallback data if available.');
        
        // Check if we should provide fallback data for this endpoint
        if (this.fallbackEnabled) {
          // Handle specific endpoints with fallback data
          if (endpoint === '/admin/dashboard/stats') {
            return this.getFallbackDashboardData();
          } else if (endpoint.includes('/complaints')) {
            return this.getFallbackComplaints();
          } else if (endpoint.includes('/admin/users')) {
            return this.getFallbackUsers();
          }
        }
        
        // Return a standard error structure with offline flag
        throw {
          success: false,
          message: 'Cannot connect to server. Please check your internet connection.',
          error: error.message,
          offline: true
        };
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
   * Login user with fallback for offline development
   * @param {object} credentials - Login credentials
   * @returns {Promise} - Promise that resolves to user data
   */
  async loginUser(credentials) {
    try {
      const response = await this.request('POST', '/login', credentials);
      
      if (response && response.success) {
        // Store authentication data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('username', response.user.username || response.user.name);
        localStorage.setItem('role', response.user.role);
        
        if (response.user.id) {
          localStorage.setItem('userId', response.user.id);
        }
        
        return response;
      }
      
      return response;
    } catch (error) {
      console.warn('API login failed, checking for development fallback:', error);
      
      // DEVELOPMENT ONLY - Remove in production
      // Check if fallback is enabled and we have credentials
      if (this.fallbackEnabled && credentials && credentials.username && credentials.password) {
        // Admin login
        if (credentials.username === 'admin' && credentials.password === 'admin123') {
          // Mock admin response
          const mockAdminResponse = {
            success: true,
            message: 'Login successful (Development Mode)',
            token: 'dev-admin-token-' + Date.now(),
            user: {
              id: 1,
              username: 'Admin User',
              name: 'Admin User',
              email: 'admin@nacos.edu',
              role: 'admin'
            }
          };
          
          // Store authentication data
          localStorage.setItem('authToken', mockAdminResponse.token);
          localStorage.setItem('username', mockAdminResponse.user.name);
          localStorage.setItem('role', mockAdminResponse.user.role);
          localStorage.setItem('userId', mockAdminResponse.user.id);
          
          console.log('✅ Development admin login successful');
          return mockAdminResponse;
        } 
        // Student login
        else if (credentials.username === 'student' && credentials.password === 'student123') {
          // Mock student response
          const mockStudentResponse = {
            success: true,
            message: 'Login successful (Development Mode)',
            token: 'dev-student-token-' + Date.now(),
            user: {
              id: 2,
              username: 'Student User',
              name: 'Student User',
              email: 'student@nacos.edu',
              role: 'student',
              matric: 'CS/2023/001'
            }
          };
          
          // Store authentication data
          localStorage.setItem('authToken', mockStudentResponse.token);
          localStorage.setItem('username', mockStudentResponse.user.name);
          localStorage.setItem('role', mockStudentResponse.user.role);
          localStorage.setItem('userId', mockStudentResponse.user.id);
          
          console.log('✅ Development student login successful');
          return mockStudentResponse;
        }
      }
      
      // If we get here, even the fallback authentication failed
      throw error;
    }
  }

  /**
   * Unified registration method
   * @param {object} data - Registration data including role
   * @returns {Promise} - Promise that resolves to user data
   */
  async register(data) {
    try {
      const endpoint = '/registeration';
      return await this.request('POST', endpoint, data);
    } catch (error) {
      if (this.fallbackEnabled && error.offline) {
        console.warn('API registration failed, using development fallback');
        
        // Create mock response for development
        const mockResponse = {
          success: true,
          message: 'Registration successful (Development Mode)',
          user: {
            id: Math.floor(Math.random() * 1000) + 10,
            username: data.username,
            name: data.firstname + ' ' + data.lastname,
            email: data.email,
            role: data.role || 'student'
          }
        };
        
        return mockResponse;
      }
      
      throw error;
    }
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
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = queryParams ? `/complaints?${queryParams}` : '/complaints';
      
      return await this.request('GET', endpoint);
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        return this.getFallbackComplaints(filters);
      }
      throw error;
    }
  }

  /**
   * Create a new complaint
   * @param {object} complaintdata - Complaint data
   * @returns {Promise} - Promise that resolves to created complaint
   */
  async createComplaint(complaintData) {
    try {
      console.log('📝 Creating complaint...');
      const response = await this.request('POST', '/complaintform', complaintData);
      console.log('✅ Complaint created successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Error creating complaint:', error);
      throw error;
    }
  }

  /**
   * Submit complaint (alias for backwards compatibility)
   * @param {object} data - Complaint data
   * @returns {Promise} - Promise that resolves to created complaint
   */
  async submitComplaint(data) {
    return this.createComplaint(data);
  }

  /**
   * Get a complaint by ID
   * @param {string} id - Complaint ID
   * @returns {Promise} - Promise that resolves to complaint details
   */
  async getComplaintById(id) {
    try {
      return await this.request('GET', `/complaints/${id}`);
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        // Find complaint in fallback data
        const complaints = this.getFallbackComplaints().complaints;
        const complaint = complaints.find(c => c.id === id);
        
        if (complaint) {
          return {
            success: true,
            complaint
          };
        } else {
          throw new Error('Complaint not found (Development Mode)');
        }
      }
      throw error;
    }
  }
  
  /**
   * Get complaint details (alias for admin dashboard)
   * @param {string} id - Complaint ID
   * @returns {Promise} - Promise that resolves to complaint details
   */
  async getComplaintDetails(id) {
    return this.getComplaintById(id);
  }

  /**
   * Update a complaint
   * @param {string} id - Complaint ID
   * @param {object} data - Updated data
   * @returns {Promise} - Promise that resolves to updated complaint
   */
  async updateComplaint(id, data) {
    try {
      return await this.request('PUT', `/complaints/${id}`, data);
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        return {
          success: true,
          message: 'Complaint updated successfully (Development Mode)',
          complaint: {
            id,
            ...data,
            updated_at: new Date().toISOString()
          }
        };
      }
      throw error;
    }
  }

  /**
   * Delete a complaint
   * @param {string} id - Complaint ID
   * @returns {Promise} - Promise that resolves to deletion status
   */
  async deleteComplaint(id) {
    try {
      return await this.request('DELETE', `/complaints/${id}`);
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        return {
          success: true,
          message: 'Complaint deleted successfully (Development Mode)'
        };
      }
      throw error;
    }
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
    try {
      return await this.request('PATCH', `/admin/complaints/${id}/status`, { status });
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        return {
          success: true,
          message: `Complaint status updated to ${status} (Development Mode)`,
          complaint: {
            id,
            status,
            updated_at: new Date().toISOString()
          }
        };
      }
      throw error;
    }
  }

  /**
   * Get all users (admin)
   * @param {object} filters - Optional filters
   * @returns {Promise} - Promise that resolves to users list
   */
  async getAllUsers(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = queryParams ? `/admin/users?${queryParams}` : '/admin/users';
      
      return await this.request('GET', endpoint);
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        return this.getFallbackUsers(filters);
      }
      throw error;
    }
  }

  /**
   * Get dashboard statistics (admin)
   * @returns {Promise} - Promise that resolves to dashboard stats
   */
  async getDashboardStats() {
    try {
      return await this.request('GET', '/admin/dashboard/stats');
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        console.warn('Using fallback dashboard data due to connection issue');
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
    try {
      return await this.request('GET', `/admin/dashboard/recent-complaints?limit=${limit}`);
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        const fallbackData = this.getFallbackDashboardData();
        return {
          success: true,
          complaints: fallbackData.recentComplaints.slice(0, limit)
        };
      }
      throw error;
    }
  }

  /**
   * Get complaint statistics by type (admin)
   * @returns {Promise} - Promise that resolves to complaint type stats
   */
  async getComplaintTypeStats() {
    try {
      return await this.request('GET', '/admin/dashboard/complaint-types');
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        return {
          success: true,
          stats: {
            'Academic': 15,
            'Technical': 8,
            'Administrative': 12,
            'Facility': 5,
            'Other': 3
          }
        };
      }
      throw error;
    }
  }

  /**
   * Get complaint statistics by status (admin)
   * @returns {Promise} - Promise that resolves to complaint status stats
   */
  async getComplaintStatusStats() {
    try {
      return await this.request('GET', '/admin/dashboard/complaint-status');
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        const fallbackData = this.getFallbackDashboardData();
        return {
          success: true,
          stats: {
            'Pending': fallbackData.stats.pending,
            'In Progress': fallbackData.stats.inProgress,
            'Resolved': fallbackData.stats.resolved,
            'Closed': 5,
            'Rejected': 2
          }
        };
      }
      throw error;
    }
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
    try {
      return await this.request('POST', '/admin/users', data);
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        return {
          success: true,
          message: 'User created successfully (Development Mode)',
          user: {
            id: Math.floor(Math.random() * 1000) + 10,
            ...data,
            created_at: new Date().toISOString()
          }
        };
      }
      throw error;
    }
  }

  /**
   * Update a user (admin)
   * @param {string} id - User ID
   * @param {object} data - Updated user data
   * @returns {Promise} - Promise that resolves to updated user
   */
  async updateUser(id, data) {
    try {
      return await this.request('PUT', `/admin/users/${id}`, data);
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        return {
          success: true,
          message: 'User updated successfully (Development Mode)',
          user: {
            id,
            ...data,
            updated_at: new Date().toISOString()
          }
        };
      }
      throw error;
    }
  }

  /**
   * Delete a user (admin)
   * @param {string} id - User ID
   * @returns {Promise} - Promise that resolves to deletion status
   */
  async deleteUser(id) {
    try {
      return await this.request('DELETE', `/admin/users/${id}`);
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        return {
          success: true,
          message: 'User deleted successfully (Development Mode)'
        };
      }
      throw error;
    }
  }

  /**
   * Get user by ID (admin)
   * @param {string} id - User ID
   * @returns {Promise} - Promise that resolves to user details
   */
  async getUserById(id) {
    try {
      return await this.request('GET', `/admin/users/${id}`);
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        const users = this.getFallbackUsers().users;
        const user = users.find(u => u.id == id); // Using == for string/number comparison
        
        if (user) {
          return {
            success: true,
            user
          };
        } else {
          throw new Error('User not found (Development Mode)');
        }
      }
      throw error;
    }
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
    try {
      const queryParams = new URLSearchParams(params).toString();
      const endpoint = queryParams ? `/admin/analytics?${queryParams}` : '/admin/analytics';
      
      return await this.request('GET', endpoint);
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        // Generate fallback analytics data
        const now = new Date();
        const monthData = [];
        
        // Generate 12 months of data
        for (let i = 0; i < 12; i++) {
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthName = month.toLocaleString('default', { month: 'short' });
          
          monthData.unshift({
            month: monthName,
            pending: Math.floor(Math.random() * 20) + 5,
            inProgress: Math.floor(Math.random() * 15) + 3,
            resolved: Math.floor(Math.random() * 30) + 10
          });
        }
        
        return {
          success: true,
          message: 'Analytics data (Development Mode)',
          data: {
            monthlyStats: monthData,
            complaintTypes: {
              'Academic': 15,
              'Technical': 8,
              'Administrative': 12,
              'Facility': 5,
              'Other': 3
            },
            responseTime: {
              average: 32, // hours
              min: 2,
              max: 96
            }
          }
        };
      }
      throw error;
    }
  }
  
  /**
   * Generate analytics report (admin)
   * @param {object} config - Report configuration
   * @returns {Promise} - Promise that resolves to report URL
   */
  async generateReport(config) {
    try {
      return await this.request('POST', '/admin/reports/generate', config);
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        return {
          success: true,
          message: 'Report generated successfully (Development Mode)',
          downloadUrl: '#',
          reportConfig: config
        };
      }
      throw error;
    }
  }

  // ==============================
  // Settings Methods
  // ==============================
  
  /**
   * Get system settings (admin)
   * @returns {Promise} - Promise that resolves to system settings
   */
  async getSystemSettings() {
    try {
      return await this.request('GET', '/admin/settings');
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        return {
          success: true,
          settings: {
            systemName: 'NACOS Complaint System',
            enableEmailNotifications: true,
            autoAssignComplaints: false,
            defaultPriority: 'Medium',
            maintenanceMode: false,
            categories: ['Academic', 'Technical', 'Administrative', 'Facility', 'Other'],
            priorities: ['Low', 'Medium', 'High', 'Critical'],
            statuses: ['Pending', 'In Progress', 'Resolved', 'Closed', 'Rejected']
          }
        };
      }
      throw error;
    }
  }
  
  /**
   * Update system settings (admin)
   * @param {object} settings - Settings to update
   * @returns {Promise} - Promise that resolves to updated settings
   */
  async updateSystemSettings(settings) {
    try {
      return await this.request('PUT', '/admin/settings', settings);
    } catch (error) {
      if (error.offline && this.fallbackEnabled) {
        return {
          success: true,
          message: 'Settings updated successfully (Development Mode)',
          settings
        };
      }
      throw error;
    }
  }

  /**
   * Fallback data for development - Dashboard
   * @returns {object} - Dashboard data for development
   */
  getFallbackDashboardData() {
    console.log('📊 Providing fallback dashboard data for development');
    
    // Add some randomness to the data for a more realistic feel
    const now = new Date();
    const seed = now.getDate() + now.getHours();
    
    return {
      success: true,
      stats: {
        pending: 12 + (seed % 5),
        inProgress: 8 + (seed % 4),
        resolved: 24 + (seed % 8),
        totalUsers: 45 + (seed % 5)
      },
      recentComplaints: [
        {
          id: 'NACOS-001',
          student: 'John Doe',
          type: 'Academic',
          status: 'Pending',
          priority: 'High',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Issue with course registration'
        },
        {
          id: 'NACOS-002',
          student: 'Alice Smith',
          type: 'Technical',
          status: 'In Progress',
          priority: 'Medium',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Cannot access online resources'
        },
        {
          id: 'NACOS-003',
          student: 'Bob Johnson',
          type: 'Administrative',
          status: 'Resolved',
          priority: 'Low',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'ID card renewal issue'
        },
        {
          id: 'NACOS-004',
          student: 'Sarah Williams',
          type: 'Facility',
          status: 'Pending',
          priority: 'Medium',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Classroom projector not working'
        },
        {
          id: 'NACOS-005',
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

  /**
   * Fallback data for development - Complaints
   * @param {object} filters - Optional filters (not used in fallback)
   * @returns {object} - Complaints data for development
   */
  getFallbackComplaints(filters = {}) {
    console.log('📋 Providing fallback complaints data for development');
    
    return {
      success: true,
      complaints: [
        {
          id: 'NACOS-001',
          name: 'John Doe',
          matric: 'CS/2020/001',
          department: 'Academic',
          status: 'Pending',
          priority: 'High',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Issue with course registration'
        },
        {
          id: 'NACOS-002',
          name: 'Alice Smith',
          matric: 'CS/2020/002',
          department: 'Technical',
          status: 'In Progress',
          priority: 'Medium',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Cannot access online resources'
        },
        {
          id: 'NACOS-003',
          name: 'Bob Johnson',
          matric: 'CS/2020/003',
          department: 'Administrative',
          status: 'Resolved',
          priority: 'Low',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'ID card renewal issue'
        },
        {
          id: 'NACOS-004',
          name: 'Sarah Williams',
          matric: 'CS/2020/004',
          department: 'Facility',
          status: 'Pending',
          priority: 'Medium',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Classroom projector not working'
        },
        {
          id: 'NACOS-005',
          name: 'Mike Brown',
          matric: 'CS/2020/005',
          department: 'Academic',
          status: 'Resolved',
          priority: 'High',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Missing course materials'
        }
      ]
    };
  }

  /**
   * Fallback data for development - Users
   * @param {object} filters - Optional filters (not used in fallback)
   * @returns {object} - Users data for development
   */
  getFallbackUsers(filters = {}) {
    console.log('👥 Providing fallback users data for development');
    
    return {
      success: true,
      users: [
        { 
          id: 1, 
          firstname: 'John', 
          lastname: 'Doe', 
          username: 'johndoe', 
          email: 'john@example.com', 
          role: 'student', 
          regno: 'STD/2023/001', 
          last_login: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() 
        },
        { 
          id: 2, 
          firstname: 'Jane', 
          lastname: 'Smith', 
          username: 'janesmith', 
          email: 'jane@example.com', 
          role: 'student', 
          regno: 'STD/2023/002', 
          last_login: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() 
        },
        { 
          id: 3, 
          firstname: 'Admin', 
          lastname: 'User', 
          username: 'admin', 
          email: 'admin@example.com', 
          role: 'admin', 
          regno: 'ADMIN/001', 
          last_login: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() 
        },
        { 
          id: 4, 
          firstname: 'Sarah', 
          lastname: 'Johnson', 
          username: 'sarahj', 
          email: 'sarah@example.com', 
          role: 'student', 
          regno: 'STD/2023/003', 
          last_login: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() 
        },
        { 
          id: 5, 
          firstname: 'Mike', 
          lastname: 'Williams', 
          username: 'mikew', 
          email: 'mike@example.com', 
          role: 'student', 
          regno: 'STD/2023/004', 
          last_login: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() 
        }
      ]
    };
  }
}

// Initialize API service
const api = new APIService();

// For debugging - remove in production
window.api = api;

// Create a configuration file if it doesn't exist
if (!window.CONFIG) {
  window.CONFIG = {
    api: {
      baseUrl: 'https://complaint-system-1os4.onrender.com/api',
      timeout: 10000,
      fallback: {
        enabled: true,
        mockDelay: 500
      }
    },
    auth: {
      tokenKey: 'authToken',
      usernameKey: 'username',
      roleKey: 'role',
      devAccounts: {
        admin: {
          username: 'admin',
          password: 'admin123',
          role: 'admin',
          name: 'Admin User'
        },
        student: {
          username: 'student',
          password: 'student123',
          role: 'student',
          name: 'Student User'
        }
      }
    },
    system: {
      name: 'NACOS Complaint System',
      version: '1.0.0',
      devMode: true
    }
  };
  
  console.log('⚙️ Created default CONFIG object');
}