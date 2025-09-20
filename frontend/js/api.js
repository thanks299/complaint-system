// API Utility Functions
class ComplaintAPI {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'An error occurred' }));
                throw new Error(error.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication endpoints
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(email, password, name) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name })
        });
    }

    async logout() {
        return this.request('/auth/logout', {
            method: 'POST'
        });
    }

    async getProfile() {
        return this.request('/auth/profile');
    }

    // Complaint endpoints
    async getComplaints(filters = {}) {
        const queryParams = new URLSearchParams();
        
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.priority) queryParams.append('priority', filters.priority);
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.limit) queryParams.append('limit', filters.limit);
        if (filters.offset) queryParams.append('offset', filters.offset);

        const endpoint = queryParams.toString() ? `/complaints?${queryParams}` : '/complaints';
        return this.request(endpoint);
    }

    async getComplaint(id) {
        return this.request(`/complaints/${id}`);
    }

    async createComplaint(complaintData) {
        const formData = new FormData();
        
        // Add text fields
        Object.keys(complaintData).forEach(key => {
            if (key !== 'attachments' && complaintData[key] !== null) {
                formData.append(key, complaintData[key]);
            }
        });

        // Add file attachments
        if (complaintData.attachments && complaintData.attachments.length > 0) {
            complaintData.attachments.forEach(file => {
                formData.append('attachments', file);
            });
        }

        return this.request('/complaints', {
            method: 'POST',
            headers: {
                // Remove Content-Type header to let browser set it with boundary
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });
    }

    async updateComplaint(id, complaintData) {
        return this.request(`/complaints/${id}`, {
            method: 'PUT',
            body: JSON.stringify(complaintData)
        });
    }

    async deleteComplaint(id) {
        return this.request(`/complaints/${id}`, {
            method: 'DELETE'
        });
    }

    async updateComplaintStatus(id, status, comment = '') {
        return this.request(`/complaints/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, comment })
        });
    }

    async getComplaintHistory(id) {
        return this.request(`/complaints/${id}/history`);
    }

    // Statistics endpoints
    async getComplaintStats() {
        return this.request('/complaints/stats');
    }

    async getDashboardData() {
        return this.request('/dashboard');
    }

    // Category endpoints
    async getCategories() {
        return this.request('/categories');
    }

    async createCategory(categoryData) {
        return this.request('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    }

    // Priority endpoints
    async getPriorities() {
        return this.request('/priorities');
    }

    // File upload endpoints
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        return this.request('/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });
    }

    async deleteFile(fileId) {
        return this.request(`/files/${fileId}`, {
            method: 'DELETE'
        });
    }

    // Search endpoints
    async searchComplaints(query, filters = {}) {
        const searchParams = new URLSearchParams();
        searchParams.append('q', query);
        
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                searchParams.append(key, filters[key]);
            }
        });

        return this.request(`/search/complaints?${searchParams}`);
    }

    // Export endpoints
    async exportComplaints(format = 'csv', filters = {}) {
        const queryParams = new URLSearchParams();
        queryParams.append('format', format);
        
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                queryParams.append(key, filters[key]);
            }
        });

        return this.request(`/export/complaints?${queryParams}`);
    }

    // Notification endpoints
    async getNotifications() {
        return this.request('/notifications');
    }

    async markNotificationAsRead(notificationId) {
        return this.request(`/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
    }

    async markAllNotificationsAsRead() {
        return this.request('/notifications/read-all', {
            method: 'PUT'
        });
    }

    // User management endpoints
    async getUsers() {
        return this.request('/users');
    }

    async getUser(id) {
        return this.request(`/users/${id}`);
    }

    async updateUser(id, userData) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(id) {
        return this.request(`/users/${id}`, {
            method: 'DELETE'
        });
    }

    // Settings endpoints
    async getSettings() {
        return this.request('/settings');
    }

    async updateSettings(settings) {
        return this.request('/settings', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }

    // Error handling
    handleError(error) {
        console.error('API Error:', error);
        
        if (error.message.includes('401')) {
            // Unauthorized - redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        } else if (error.message.includes('403')) {
            // Forbidden
            return 'You do not have permission to perform this action.';
        } else if (error.message.includes('404')) {
            // Not found
            return 'The requested resource was not found.';
        } else if (error.message.includes('500')) {
            // Server error
            return 'A server error occurred. Please try again later.';
        } else {
            // Network or other error
            return error.message || 'An unexpected error occurred.';
        }
    }

    // Utility methods
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    isAuthenticated() {
        return !!this.token;
    }

    // Request interceptor for adding common headers
    addRequestInterceptor(interceptor) {
        this.requestInterceptors = this.requestInterceptors || [];
        this.requestInterceptors.push(interceptor);
    }

    // Response interceptor for handling common responses
    addResponseInterceptor(interceptor) {
        this.responseInterceptors = this.responseInterceptors || [];
        this.responseInterceptors.push(interceptor);
    }
}

// Create global API instance
const api = new ComplaintAPI();

// Add request interceptor for token refresh
api.addRequestInterceptor(async (config) => {
    // Check if token is about to expire and refresh if needed
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const now = Math.floor(Date.now() / 1000);
            
            // If token expires in less than 5 minutes, refresh it
            if (payload.exp - now < 300) {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        api.setToken(data.token);
                        config.headers.Authorization = `Bearer ${data.token}`;
                    }
                }
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }
    }
    
    return config;
});

// Add response interceptor for error handling
api.addResponseInterceptor((response) => {
    if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.status = response.status;
        throw error;
    }
    return response;
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComplaintAPI;
}
