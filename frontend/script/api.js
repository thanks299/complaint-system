class APIService {
  constructor() {
    this.baseURL = 'https://complaint-system-1os4.onrender.com/api';
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // User Authentication
  async loginUser(data) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Unified registration method
  async register(data) {
    const { role, ...userData } = data;
    
    //unified endpoint for all role
    const endpoint =  '/registration';
    
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Keep individual methods for backward compatibility (optional)
  async registerUser(data) {
    return this.register({ ...data, role: 'student' });
  }

  async registerAdmin(data) {
    return this.register({ ...data, role: 'admin' });
  }

  // REST endpoints
  async getComplaints() {
    return this.request('/complaints');
  }

  async createComplaint(data) {
    return this.request('/complaints', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getComplaintById(id) {
    return this.request(`/complaints/${id}`);
  }

  async updateComplaint(id, data) {
    return this.request(`/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteComplaint(id) {
    return this.request(`/complaints/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin Dashboard Endpoints
  async updateComplaintStatus(id, status) {
    return this.request(`/admin/complaints/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getAllUsers() {
    return this.request('/admin/users');
  }

  // Centralized logout functionality
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
}

const api = new APIService();