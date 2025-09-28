class APIService {
  constructor() {
    this.baseURL = 'https://complaint-system-1os4.onrender.com/api';

    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.headers,
      ...options,
    };

    try {
      console.log('Making request to:', url); // Debug log
      console.log('Request config:', config); // Debug log
      
      const response = await fetch(url, config);
      const data = await response.json();

      console.log('Response status:', response.status); // Debug log
      console.log('Response data:', data); // Debug log

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // User Authentication
  async loginUser(data) {
    // Ensure the data format matches what the backend expects
    const loginPayload = {
      username: data.username || undefined,
      email: data.email || undefined,
      password: data.password
    };

    // Remove undefined fields
    Object.keys(loginPayload).forEach(key => {
      if (loginPayload[key] === undefined) {
        delete loginPayload[key];
      }
    });
  }

  // Unified registration method
  async register(data) {
    const { role, ...userData } = data;
    
    //unified endpoint for all role
    const endpoint =  '/registeration';
    
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
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