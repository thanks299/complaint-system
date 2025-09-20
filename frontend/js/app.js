// Main Application JavaScript
class ComplaintApp {
    constructor() {
        this.currentUser = null;
        this.complaints = [];
        this.currentComplaintId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.showSection('dashboard');
        this.loadDashboardData();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Complaint form
        document.getElementById('complaintForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitComplaint();
        });

        // Search and filters
        document.getElementById('searchInput').addEventListener('input', () => {
            this.debounce(() => this.filterComplaints(), 300)();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.filterComplaints();
        });

        document.getElementById('priorityFilter').addEventListener('change', () => {
            this.filterComplaints();
        });

        // File upload
        document.getElementById('complaintAttachments').addEventListener('change', (e) => {
            this.handleFileUpload(e);
        });

        // Status update
        document.getElementById('updateStatusBtn').addEventListener('click', () => {
            this.showStatusUpdateModal();
        });
    }

    loadUserData() {
        // Load user data from localStorage or API
        const userData = localStorage.getItem('user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUserInterface();
        } else {
            // Redirect to login if no user data
            this.showLoginModal();
        }
    }

    updateUserInterface() {
        const userDropdown = document.querySelector('.navbar-nav .dropdown-toggle');
        if (userDropdown && this.currentUser) {
            userDropdown.innerHTML = `<i class="fas fa-user me-1"></i>${this.currentUser.name || 'User'}`;
        }
    }

    showLoginModal() {
        // Create and show login modal
        const loginModal = this.createLoginModal();
        document.body.appendChild(loginModal);
        const modal = new bootstrap.Modal(loginModal);
        modal.show();
    }

    createLoginModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'loginModal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Login to Complaint System</h5>
                    </div>
                    <div class="modal-body">
                        <form id="loginForm">
                            <div class="mb-3">
                                <label for="loginEmail" class="form-label">Email</label>
                                <input type="email" class="form-control" id="loginEmail" required>
                            </div>
                            <div class="mb-3">
                                <label for="loginPassword" class="form-label">Password</label>
                                <input type="password" class="form-control" id="loginPassword" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" onclick="app.login()">Login</button>
                        <button type="button" class="btn btn-secondary" onclick="app.register()">Register</button>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    async login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            this.showLoading(true);
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const userData = await response.json();
                this.currentUser = userData.user;
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                localStorage.setItem('token', userData.token);
                this.updateUserInterface();
                this.hideLoginModal();
                this.showToast('Login successful!', 'success');
            } else {
                const error = await response.json();
                this.showToast(error.message || 'Login failed', 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async register() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            this.showLoading(true);
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, name: email.split('@')[0] }),
            });

            if (response.ok) {
                const userData = await response.json();
                this.currentUser = userData.user;
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                localStorage.setItem('token', userData.token);
                this.updateUserInterface();
                this.hideLoginModal();
                this.showToast('Registration successful!', 'success');
            } else {
                const error = await response.json();
                this.showToast(error.message || 'Registration failed', 'error');
            }
        } catch (error) {
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    hideLoginModal() {
        const modal = document.getElementById('loginModal');
        if (modal) {
            const bootstrapModal = bootstrap.Modal.getInstance(modal);
            if (bootstrapModal) {
                bootstrapModal.hide();
            }
            modal.remove();
        }
    }

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        this.currentUser = null;
        this.showLoginModal();
        this.showToast('Logged out successfully', 'info');
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('d-none');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.remove('d-none');
            targetSection.classList.add('fade-in');

            // Update navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            const activeLink = document.querySelector(`[href="#${sectionName}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }

            // Load section-specific data
            this.loadSectionData(sectionName);
        }
    }

    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'complaints':
                this.loadComplaints();
                break;
            case 'new-complaint':
                this.resetComplaintForm();
                break;
        }
    }

    async loadDashboardData() {
        try {
            this.showLoading(true);
            const response = await fetch('/api/complaints/stats');
            if (response.ok) {
                const stats = await response.json();
                this.updateDashboardStats(stats);
            }

            const complaintsResponse = await fetch('/api/complaints?limit=5');
            if (complaintsResponse.ok) {
                const complaints = await complaintsResponse.json();
                this.updateRecentComplaints(complaints);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showToast('Error loading dashboard data', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateDashboardStats(stats) {
        document.getElementById('totalComplaints').textContent = stats.total || 0;
        document.getElementById('openComplaints').textContent = stats.open || 0;
        document.getElementById('inProgressComplaints').textContent = stats.inProgress || 0;
        document.getElementById('resolvedComplaints').textContent = stats.resolved || 0;

        // Update charts
        this.updateStatusChart(stats);
        this.updatePriorityChart(stats);
    }

    updateStatusChart(stats) {
        const ctx = document.getElementById('statusChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Open', 'In Progress', 'Resolved', 'Closed'],
                datasets: [{
                    data: [stats.open || 0, stats.inProgress || 0, stats.resolved || 0, stats.closed || 0],
                    backgroundColor: ['#ffc107', '#0dcaf0', '#198754', '#6c757d'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updatePriorityChart(stats) {
        const ctx = document.getElementById('priorityChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Low', 'Medium', 'High', 'Urgent'],
                datasets: [{
                    label: 'Complaints by Priority',
                    data: [stats.priorityLow || 0, stats.priorityMedium || 0, stats.priorityHigh || 0, stats.priorityUrgent || 0],
                    backgroundColor: ['#28a745', '#ffc107', '#fd7e14', '#dc3545'],
                    borderWidth: 1,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateRecentComplaints(complaints) {
        const tbody = document.getElementById('recentComplaintsTable');
        tbody.innerHTML = '';

        complaints.forEach(complaint => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${complaint.id}</td>
                <td class="text-truncate-2">${complaint.title}</td>
                <td><span class="badge badge-status-${complaint.status}">${complaint.status.replace('_', ' ')}</span></td>
                <td><span class="badge badge-priority-${complaint.priority}">${complaint.priority}</span></td>
                <td>${new Date(complaint.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="app.viewComplaint(${complaint.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadComplaints() {
        try {
            this.showLoading(true);
            const response = await fetch('/api/complaints');
            if (response.ok) {
                const complaints = await response.json();
                this.complaints = complaints;
                this.renderComplaintsTable(complaints);
            } else {
                this.showToast('Error loading complaints', 'error');
            }
        } catch (error) {
            console.error('Error loading complaints:', error);
            this.showToast('Error loading complaints', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderComplaintsTable(complaints) {
        const tbody = document.getElementById('complaintsTable');
        tbody.innerHTML = '';

        complaints.forEach(complaint => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${complaint.id}</td>
                <td class="text-truncate-2">${complaint.title}</td>
                <td><span class="badge bg-secondary">${complaint.category}</span></td>
                <td><span class="badge badge-status-${complaint.status}">${complaint.status.replace('_', ' ')}</span></td>
                <td><span class="badge badge-priority-${complaint.priority}">${complaint.priority}</span></td>
                <td>${new Date(complaint.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="app.viewComplaint(${complaint.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="app.editComplaint(${complaint.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="app.deleteComplaint(${complaint.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    filterComplaints() {
        const statusFilter = document.getElementById('statusFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        let filteredComplaints = this.complaints;

        if (statusFilter) {
            filteredComplaints = filteredComplaints.filter(complaint => complaint.status === statusFilter);
        }

        if (priorityFilter) {
            filteredComplaints = filteredComplaints.filter(complaint => complaint.priority === priorityFilter);
        }

        if (searchTerm) {
            filteredComplaints = filteredComplaints.filter(complaint => 
                complaint.title.toLowerCase().includes(searchTerm) ||
                complaint.description.toLowerCase().includes(searchTerm)
            );
        }

        this.renderComplaintsTable(filteredComplaints);
    }

    async submitComplaint() {
        const formData = new FormData();
        formData.append('title', document.getElementById('complaintTitle').value);
        formData.append('category', document.getElementById('complaintCategory').value);
        formData.append('priority', document.getElementById('complaintPriority').value);
        formData.append('email', document.getElementById('complaintEmail').value);
        formData.append('description', document.getElementById('complaintDescription').value);

        const files = document.getElementById('complaintAttachments').files;
        for (let i = 0; i < files.length; i++) {
            formData.append('attachments', files[i]);
        }

        try {
            this.showLoading(true);
            const response = await fetch('/api/complaints', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                this.showToast('Complaint submitted successfully!', 'success');
                this.resetComplaintForm();
                this.showSection('complaints');
                this.loadComplaints();
            } else {
                const error = await response.json();
                this.showToast(error.message || 'Error submitting complaint', 'error');
            }
        } catch (error) {
            console.error('Error submitting complaint:', error);
            this.showToast('Error submitting complaint', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    resetComplaintForm() {
        document.getElementById('complaintForm').reset();
        document.getElementById('complaintAttachments').value = '';
    }

    async viewComplaint(id) {
        try {
            this.showLoading(true);
            const response = await fetch(`/api/complaints/${id}`);
            if (response.ok) {
                const complaint = await response.json();
                this.showComplaintDetail(complaint);
            } else {
                this.showToast('Error loading complaint details', 'error');
            }
        } catch (error) {
            console.error('Error loading complaint:', error);
            this.showToast('Error loading complaint details', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showComplaintDetail(complaint) {
        const modal = document.getElementById('complaintDetailModal');
        const content = document.getElementById('complaintDetailContent');
        
        content.innerHTML = `
            <div class="row">
                <div class="col-md-8">
                    <h4>${complaint.title}</h4>
                    <p class="text-muted">Created: ${new Date(complaint.created_at).toLocaleString()}</p>
                    <hr>
                    <h6>Description:</h6>
                    <p>${complaint.description}</p>
                    ${complaint.attachments && complaint.attachments.length > 0 ? `
                        <h6>Attachments:</h6>
                        <div class="row">
                            ${complaint.attachments.map(attachment => `
                                <div class="col-md-4 mb-2">
                                    <div class="card">
                                        <div class="card-body text-center">
                                            <i class="fas fa-file fa-2x mb-2"></i>
                                            <p class="card-text small">${attachment.filename}</p>
                                            <a href="${attachment.url}" class="btn btn-sm btn-outline-primary" target="_blank">Download</a>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6 class="mb-0">Complaint Details</h6>
                        </div>
                        <div class="card-body">
                            <p><strong>ID:</strong> #${complaint.id}</p>
                            <p><strong>Status:</strong> <span class="badge badge-status-${complaint.status}">${complaint.status.replace('_', ' ')}</span></p>
                            <p><strong>Priority:</strong> <span class="badge badge-priority-${complaint.priority}">${complaint.priority}</span></p>
                            <p><strong>Category:</strong> ${complaint.category}</p>
                            <p><strong>Email:</strong> ${complaint.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.currentComplaintId = complaint.id;
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    showStatusUpdateModal() {
        const modal = document.getElementById('statusUpdateModal');
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    async updateComplaintStatus() {
        const newStatus = document.getElementById('newStatus').value;
        const comment = document.getElementById('statusComment').value;

        if (!newStatus) {
            this.showToast('Please select a status', 'warning');
            return;
        }

        try {
            this.showLoading(true);
            const response = await fetch(`/api/complaints/${this.currentComplaintId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status: newStatus, comment })
            });

            if (response.ok) {
                this.showToast('Status updated successfully!', 'success');
                bootstrap.Modal.getInstance(document.getElementById('statusUpdateModal')).hide();
                this.loadComplaints();
                this.loadDashboardData();
            } else {
                const error = await response.json();
                this.showToast(error.message || 'Error updating status', 'error');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            this.showToast('Error updating status', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteComplaint(id) {
        if (!confirm('Are you sure you want to delete this complaint?')) {
            return;
        }

        try {
            this.showLoading(true);
            const response = await fetch(`/api/complaints/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                this.showToast('Complaint deleted successfully!', 'success');
                this.loadComplaints();
                this.loadDashboardData();
            } else {
                const error = await response.json();
                this.showToast(error.message || 'Error deleting complaint', 'error');
            }
        } catch (error) {
            console.error('Error deleting complaint:', error);
            this.showToast('Error deleting complaint', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    handleFileUpload(event) {
        const files = event.target.files;
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        for (let file of files) {
            if (file.size > maxSize) {
                this.showToast(`File ${file.name} is too large. Maximum size is 10MB.`, 'warning');
                continue;
            }

            if (!allowedTypes.includes(file.type)) {
                this.showToast(`File ${file.name} has an unsupported format.`, 'warning');
                continue;
            }
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.remove('d-none');
        } else {
            spinner.classList.add('d-none');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastHeader = toast.querySelector('.toast-header i');

        toastMessage.textContent = message;

        // Update icon and color based on type
        toastHeader.className = `fas me-2`;
        switch (type) {
            case 'success':
                toastHeader.classList.add('fa-check-circle', 'text-success');
                break;
            case 'error':
                toastHeader.classList.add('fa-exclamation-circle', 'text-danger');
                break;
            case 'warning':
                toastHeader.classList.add('fa-exclamation-triangle', 'text-warning');
                break;
            default:
                toastHeader.classList.add('fa-info-circle', 'text-primary');
        }

        const bootstrapToast = new bootstrap.Toast(toast);
        bootstrapToast.show();
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Global functions for HTML onclick handlers
function showSection(sectionName) {
    app.showSection(sectionName);
}

function filterComplaints() {
    app.filterComplaints();
}

function updateComplaintStatus() {
    app.updateComplaintStatus();
}

// Initialize the application
const app = new ComplaintApp();
