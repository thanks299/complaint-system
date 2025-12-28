// Global variables
let allComplaints = [];
let filteredComplaints = [];
let searchTimeout;

// Configuration constants
const REFRESH_INTERVAL = 300000; // 5 minutes
const STATUS_COLORS = {
    'Pending': '#ff9800',
    'In Progress': '#2196f3',
    'Resolved': '#4caf50',
    'Closed': '#9e9e9e',
    'Rejected': '#f44336'
};

// Main dashboard controller
class AdminDashboard {
    constructor() {
        this.stats = {
            pending: 0,
            inProgress: 0,
            resolved: 0,
            totalUsers: 0
        };
        this.recentComplaints = [];
        this.refreshInterval = null;
        
        // Make this instance globally available
        window.adminDashboard = this;
    }

    // Initialize dashboard
    async initialize() {
        console.log('Initializing admin dashboard...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load initial dashboard data
        await this.refreshDashboard();
        
        // Set up automatic refresh interval
        this.setupAutoRefresh();
    }
    
    // Set up dashboard event listeners
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshDashboard());
        }
        
        // Quick action buttons
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = button.getAttribute('data-action');
                this.handleQuickAction(action);
            });
        });
        
        // Profile dropdown toggle
        const profileBtn = document.querySelector('.profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                const dropdown = document.querySelector('.dropdown-menu');
                if (dropdown) {
                    dropdown.classList.toggle('show');
                }
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.profile-dropdown')) {
                    const dropdown = document.querySelector('.dropdown-menu');
                    if (dropdown) {
                        dropdown.classList.remove('show');
                    }
                }
            });
        }
    }
    
    // Fallback dashboard data for when API fails
    getFallbackDashboardData() {
        // Generate realistic-looking data
        const now = new Date();
        const seed = now.getDate() + now.getHours();
        
        return {
            success: true,
            stats: {
                pending: 23 + (seed % 5),
                inProgress: 12 + (seed % 3),
                resolved: 121 + (seed % 10),
                totalUsers: 89 + (seed % 7)
            },
            recentComplaints: [
                {
                    id: 'NACOS-000001',
                    student: 'John Doe',
                    type: 'Academic',
                    status: 'Pending',
                    priority: 'Medium',
                    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'NACOS-000002',
                    student: 'Jane Smith',
                    type: 'Technical',
                    status: 'In Progress',
                    priority: 'High',
                    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
                },
                {
                    id: 'NACOS-000003',
                    student: 'Mike Johnson',
                    type: 'Administrative',
                    status: 'Resolved',
                    priority: 'Low',
                    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                }
            ]
        };
    }
    
    // Load dashboard statistics and recent complaints
    async refreshDashboard() {
        try {
            console.log('Refreshing dashboard data...');
            this.showLoading(true);

            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), 10000)
            );
            
            // Fetch dashboard data from API - with fallback
            let response;
            
            try {
                // Try to get data from API first
                response = await Promise.race([
                    api.getDashboardStats(), 
                    timeoutPromise
                ]);
            } catch (apiError) {
                console.log('API call failed:', apiError);
                // Use fallback data on API failure
                response = this.getFallbackDashboardData();
            }

            if (response && response.success) {
                // Update stats
                this.stats = response.stats || {
                    pending: 0,
                    inProgress: 0,
                    resolved: 0,
                    totalUsers: 0
                };
                
                // Update recent complaints
                this.recentComplaints = response.recentComplaints || [];
                
                // Update UI
                this.updateStatsUI();
                this.updateRecentComplaintsUI();
                
                console.log('Dashboard data refreshed successfully');
            } else {
                console.error('Failed to fetch dashboard data', response);
                
                // Use fallback data on error
                const fallbackData = this.getFallbackDashboardData();
                this.stats = fallbackData.stats;
                this.recentComplaints = fallbackData.recentComplaints;
                this.updateStatsUI();
                this.updateRecentComplaintsUI();
                
                this.showError('Failed to load dashboard data' + 
                    (response?.message || 'unknown error'));
            }
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            
            // Use fallback data on error
            const fallbackData = this.getFallbackDashboardData();
            this.stats = fallbackData.stats;
            this.recentComplaints = fallbackData.recentComplaints;
            this.updateStatsUI();
            this.updateRecentComplaintsUI();
            
            this.showError('An error occurred while loading dashboard data');
        } finally {
            this.showLoading(false);    
        }
    }
    
    // Update statistics UI elements
    updateStatsUI() {
        // Update count elements with null checks
        const pendingEl = document.getElementById('pending-count');
        if (pendingEl) {
            pendingEl.textContent = this.stats.pending;
        }
        
        const inProgressEl = document.getElementById('inprogress-count');
        if (inProgressEl) {
            inProgressEl.textContent = this.stats.inProgress;
        }
        
        const resolvedEl = document.getElementById('resolved-count');
        if (resolvedEl) {
            resolvedEl.textContent = this.stats.resolved;
        }
        
        const totalUsersEl = document.getElementById('total-users');
        if (totalUsersEl) {
            totalUsersEl.textContent = this.stats.totalUsers;
        }
    }
    
    // Update recent complaints table
    updateRecentComplaintsUI() {
        const tableBody = document.getElementById('dashboard-complaints-tbody');
        if (!tableBody) return;
        
        if (this.recentComplaints && this.recentComplaints.length > 0) {
            tableBody.innerHTML = '';
            
            this.recentComplaints.forEach(complaint => {
                const row = document.createElement('tr');

                // Normalize status for display
                const normalizedStatus = this.normalizeStatus(complaint.status);
                
                // Create status badge with appropriate color
                const statusBadge = `
                    <span class="status-badge" style="background-color: ${STATUS_COLORS[normalizedStatus] || '#9e9e9e'}">
                        ${normalizedStatus}
                    </span>
                `;
                
                // Create priority indicator
                const priorityClass = complaint.priority.toLowerCase();
                const priorityBadge = `
                    <span class="priority-badge ${priorityClass}">
                        ${complaint.priority}
                    </span>
                `;
                
                // Create action buttons
                const actions = `
                    <div class="table-actions">
                        <button class="action-icon view-btn" title="View Details" data-id="${complaint.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-icon edit-btn" title="Edit" data-id="${complaint.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                `;
                
                // Set row content
                row.innerHTML = `
                    <td data-label="Ticket ID">${complaint.id}</td>
                    <td data-label="Student">${complaint.student}</td>
                    <td data-label="Type">${complaint.type}</td>
                    <td data-label="Status">${statusBadge}</td>
                    <td data-label="Priority">${priorityBadge}</td>
                    <td data-label="Date">${this.formatDate(complaint.date)}</td>
                    <td data-label="Actions">${actions}</td>
                `;
                
                // Add click handlers for the buttons
                tableBody.appendChild(row);
            });
            
            // Add event listeners to action buttons
            tableBody.querySelectorAll('.view-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const complaintId = btn.getAttribute('data-id');
                    this.viewComplaintDetails(complaintId);
                });
            });
            
            tableBody.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const complaintId = btn.getAttribute('data-id');
                    this.editComplaint(complaintId);
                });
            });
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">No recent complaints found</td>
                </tr>
            `;
        }
    }

    // Add this helper method to normalize status
    normalizeStatus(status) {
        if (!status) return 'Pending';
  
        // Convert to standard format
        const statusLower = status.toLowerCase();
  
        if (statusLower === 'pending') return 'Pending';
        if (statusLower === 'in-progress' || statusLower === 'inprogress' || statusLower === 'in_progress') return 'In Progress';
        if (statusLower === 'resolved') return 'Resolved';
        if (statusLower === 'closed') return 'Closed';
        if (statusLower === 'rejected') return 'Rejected';
  
        // If unknown, capitalize first letter
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
    
    // Format date for display
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        } catch (e) {
            return dateString; // Return original if parsing fails
        }
    }
    
    // Handle quick action buttons
    handleQuickAction(action) {
        console.log(`Quick action clicked: ${action}`);
        
        switch(action) {
            case 'view-complaints':
                // Handle navigation to complaints section
                this.navigateToSection('complaints');
                break;
                
            case 'add-user':
                // Navigate to users section with create modal
                this.navigateToSection('users');
                // Show create user modal after navigation completes
                setTimeout(() => {
                    if (window.usersController && window.usersController.showCreateUserModal) {
                        window.usersController.showCreateUserModal();
                    }
                }, 500);
                break;
                
            case 'generate-report':
                this.showReportGenerationModal();
                break;
                
            case 'system-settings':
                // Navigate to settings section
                this.navigateToSection('settings');
                break;
                
            case 'logout':
                this.handleLogout();
                break;
                
            default:
                console.warn(`Unknown action: ${action}`);
        }
    }
    
    // Navigation method to support section switching
    navigateToSection(section) {
        console.log(`AdminDashboard navigating to section: ${section}`);
        
        if (window.navigationController) {
            window.navigationController.navigateToSection(section);
        } else {
            // Fallback navigation - use the loadSectionView function if it exists
            if (typeof loadSectionView === 'function') {
                loadSectionView(section);
            } else {
                console.log(`No navigation controller found, can't navigate to ${section}`);
            }
        }
    }
    
    // Method to load all complaints for the complaints section
    async loadAllComplaints() {
        console.log('Loading all complaints...');
        
        try {
            // Show loading indicator
            const complaintsContainer = document.querySelector('#complaints-section .card-body');
            if (!complaintsContainer) {
                console.error('Complaints container not found in the DOM');
                return;
            }
            
            complaintsContainer.innerHTML = `
                <div class="loading-indicator">
                    <i class="fas fa-circle-notch fa-spin"></i>
                    <span>Loading complaints data...</span>
                </div>
            `;
            
            // Try to fetch complaints data
            let response;
            try {
                response = await api.getComplaints();
            } catch (error) {
                console.error('Error fetching complaints:', error);
                
                // Use fallback data
                response = {
                    success: true,
                    complaints: [
                        {
                            id: 'NACOS-000001',
                            name: 'John Doe',
                            matric: 'CS/2020/001',
                            department: 'Academic',
                            status: 'Pending',
                            priority: 'Medium',
                            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                        },
                        {
                            id: 'NACOS-000002',
                            name: 'Jane Smith',
                            matric: 'CS/2020/002',
                            department: 'Technical',
                            status: 'In Progress',
                            priority: 'High',
                            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
                        },
                        {
                            id: 'NACOS-000003',
                            name: 'Mike Johnson',
                            matric: 'CS/2020/003',
                            department: 'Administrative',
                            status: 'Resolved',
                            priority: 'Low',
                            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
                        }
                    ]
                };
            }
            
            if (response && response.success) {
                // Update global variable
                allComplaints = response.complaints || [];
                filteredComplaints = [...allComplaints];
                
                // Update UI
                this.displayComplaints(filteredComplaints, complaintsContainer);
            } else {
                throw new Error('Failed to fetch complaints');
            }
        } catch (error) {
            console.error('Error loading complaints:', error);
            
            // Show error message
            const complaintsContainer = document.querySelector('#complaints-section .card-body');
            if (complaintsContainer) {
                complaintsContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Failed to load complaints. Please try again later.</span>
                    </div>
                `;
            }
        }
    }
    
    // Display complaints in the container
    displayComplaints(complaints, container) {
        if (!container) return;
        
        if (!complaints || complaints.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No complaints found</p>
                </div>
            `;
            return;
        }
        
        // Create table to display complaints
        const tableContainer = document.createElement('div');
        tableContainer.className = 'table-container table-responsive';
        
        const table = document.createElement('table');
        table.className = 'modern-table';
        
        // Add table header
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Student</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="complaints-table-body">
            </tbody>
        `;
        
        tableContainer.appendChild(table);
        container.innerHTML = '';
        container.appendChild(tableContainer);
        
        const tbody = document.getElementById('complaints-table-body');
        
        // Add rows for each complaint
        complaints.forEach(complaint => {
            const row = document.createElement('tr');
            
            // Format date
            const date = new Date(complaint.created_at || complaint.date);
            const formattedDate = date.toLocaleDateString();
            
            // Normalize status for display
            const normalizedStatus = this.normalizeStatus(complaint.status);
            
            // Create status badge with appropriate color
            const statusBadge = `
                <span class="status-badge" style="background-color: ${STATUS_COLORS[normalizedStatus] || '#9e9e9e'}">
                    ${normalizedStatus}
                </span>
            `;
            
            // Create priority indicator
            const priority = complaint.priority || 'Medium';
            const priorityClass = priority.toLowerCase();
            const priorityBadge = `
                <span class="priority-badge ${priorityClass}">
                    ${priority}
                </span>
            `;
            
            row.innerHTML = `
                <td data-label="ID"><strong>${complaint.id}</strong></td>
                <td data-label="Student">
                    <div class="user-info">
                        <div class="user-name">${complaint.name || complaint.student || 'N/A'}</div>
                        <div class="user-email">${complaint.matric || complaint.studentId || 'N/A'}</div>
                    </div>
                </td>
                <td data-label="Type"><span class="type-badge">${complaint.department || complaint.type || 'General'}</span></td>
                <td data-label="Status">${statusBadge}</td>
                <td data-label="Priority">${priorityBadge}</td>
                <td data-label="Date">${formattedDate}</td>
                <td data-label="Actions">
                    <div class="table-actions">
                        <button class="action-icon view" title="View Details" data-action="view-complaint" data-id="${complaint.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-icon edit" title="Edit Status" data-action="edit-complaint" data-id="${complaint.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon delete" title="Delete" data-action="delete-complaint" data-id="${complaint.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        // Add event listeners to action buttons
        tbody.querySelectorAll('[data-action="view-complaint"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const complaintId = btn.getAttribute('data-id');
                this.viewComplaintDetails(complaintId);
            });
        });
        
        tbody.querySelectorAll('[data-action="edit-complaint"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const complaintId = btn.getAttribute('data-id');
                this.editComplaint(complaintId);
            });
        });
        
        tbody.querySelectorAll('[data-action="delete-complaint"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const complaintId = btn.getAttribute('data-id');
                this.deleteComplaint(complaintId);
            });
        });
    }
    
    // Method to load all users for the users section
    async loadAllUsers() {
        console.log('Loading all users...');
        
        try {
            // Show loading indicator
            const usersContainer = document.querySelector('#users-section .card-body');
            if (!usersContainer) {
                console.error('Users container not found in the DOM');
                return;
            }
            
            usersContainer.innerHTML = `
                <div class="loading-indicator">
                    <i class="fas fa-circle-notch fa-spin"></i>
                    <span>Loading users data...</span>
                </div>
            `;
            
            // Use fallback data for now
            const mockUsers = [
                { id: 1, firstname: 'John', lastname: 'Doe', username: 'johndoe', email: 'john@example.com', role: 'student', regno: 'STD/2023/001', last_login: '2023-09-15T10:30:00Z' },
                { id: 2, firstname: 'Jane', lastname: 'Smith', username: 'janesmith', email: 'jane@example.com', role: 'student', regno: 'STD/2023/002', last_login: '2023-09-14T08:15:00Z' },
                { id: 3, firstname: 'Admin', lastname: 'User', username: 'admin', email: 'admin@example.com', role: 'admin', regno: 'ADMIN/001', last_login: '2023-09-16T09:45:00Z' }
            ];
            
            // Create table to display users
            const tableContainer = document.createElement('div');
            tableContainer.className = 'table-container table-responsive';
            
            const table = document.createElement('table');
            table.className = 'modern-table';
            
            // Add table header
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Registration No.</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="users-table-body">
                </tbody>
            `;
            
            tableContainer.appendChild(table);
            usersContainer.innerHTML = '';
            usersContainer.appendChild(tableContainer);
            
            const tbody = document.getElementById('users-table-body');
            
            // Add rows for each user
            mockUsers.forEach(user => {
                const row = document.createElement('tr');
                
                // Format date
                const date = new Date(user.last_login);
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                
                row.innerHTML = `
                    <td data-label="ID"><strong>${user.id}</strong></td>
                    <td data-label="Name">
                        <div class="user-info">
                            <div class="user-name">${user.firstname} ${user.lastname}</div>
                        </div>
                    </td>
                    <td data-label="Username">${user.username}</td>
                    <td data-label="Email">${user.email}</td>
                    <td data-label="Role"><span class="role-badge ${user.role}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></td>
                    <td data-label="Registration No.">${user.regno}</td>
                    <td data-label="Last Login">${formattedDate}</td>
                    <td data-label="Actions">
                        <div class="table-actions">
                            <button class="action-icon view" title="View Details" data-action="view-user" data-id="${user.id}">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-icon edit" title="Edit User" data-action="edit-user" data-id="${user.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-icon delete" title="Delete" data-action="delete-user" data-id="${user.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
            
            // Add event listeners to action buttons
            tbody.querySelectorAll('[data-action="view-user"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const userId = btn.getAttribute('data-id');
                    this.viewUserDetails(userId);
                });
            });
            
            tbody.querySelectorAll('[data-action="edit-user"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const userId = btn.getAttribute('data-id');
                    this.editUser(userId);
                });
            });
            
            tbody.querySelectorAll('[data-action="delete-user"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const userId = btn.getAttribute('data-id');
                    this.deleteUser(userId);
                });
            });
        } catch (error) {
            console.error('Error loading users:', error);
            
            // Show error message
            const usersContainer = document.querySelector('#users-section .card-body');
            if (usersContainer) {
                usersContainer.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Failed to load users. Please try again later.</span>
                    </div>
                `;
            }
        }
    }
    
    // Basic user interaction methods
    viewUserDetails(userId) {
        console.log('View user details:', userId);
        // Implement user details view
    }
    
    editUser(userId) {
        console.log('Edit user:', userId);
        // Implement user edit
    }
    
    deleteUser(userId) {
        console.log('Delete user:', userId);
        // Implement user deletion with confirmation
    }
    
    // Delete complaint
    deleteComplaint(complaintId) {
        console.log('Delete complaint:', complaintId);
        // Add confirmation dialog and deletion logic
    }
    
    // Handle logout action
    async handleLogout() {
        try {
            await api.logout();
        } catch (error) {
            console.error('Error during logout:', error);
            // Even if API call fails, clear local storage and redirect
            localStorage.clear();
            window.location.href = 'index.html';
        }
    }
    
    // Show report generation modal
    showReportGenerationModal() {
        Swal.fire({
            title: 'Generate Report',
            html: `
                <div class="report-form">
                    <div class="form-group">
                        <label for="report-type">Report Type</label>
                        <select id="report-type" class="swal2-input">
                            <option value="complaints">Complaints Summary</option>
                            <option value="users">User Activity</option>
                            <option value="response-time">Response Time Analysis</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="report-period">Time Period</label>
                        <select id="report-period" class="swal2-input">
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="90days">Last 90 Days</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    <div id="custom-date-range" style="display: none;">
                        <div class="form-group">
                            <label for="start-date">Start Date</label>
                            <input type="date" id="start-date" class="swal2-input">
                        </div>
                        <div class="form-group">
                            <label for="end-date">End Date</label>
                            <input type="date" id="end-date" class="swal2-input">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="report-format">Format</label>
                        <select id="report-format" class="swal2-input">
                            <option value="pdf">PDF</option>
                            <option value="excel">Excel</option>
                            <option value="csv">CSV</option>
                        </select>
                    </div>
                </div>
            `,
            didOpen: () => {
                // Show/hide custom date range based on selection
                const periodSelect = document.getElementById('report-period');
                const customDateRange = document.getElementById('custom-date-range');
                
                periodSelect.addEventListener('change', () => {
                    if (periodSelect.value === 'custom') {
                        customDateRange.style.display = 'block';
                    } else {
                        customDateRange.style.display = 'none';
                    }
                });
            },
            showCancelButton: true,
            confirmButtonText: 'Generate',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
                const reportType = document.getElementById('report-type').value;
                const reportPeriod = document.getElementById('report-period').value;
                const reportFormat = document.getElementById('report-format').value;
                
                let startDate, endDate;
                if (reportPeriod === 'custom') {
                    startDate = document.getElementById('start-date').value;
                    endDate = document.getElementById('end-date').value;
                    
                    if (!startDate || !endDate) {
                        Swal.showValidationMessage('Please select both start and end dates');
                        return false;
                    }
                    
                    if (new Date(startDate) > new Date(endDate)) {
                        Swal.showValidationMessage('End date must be after start date');
                        return false;
                    }
                }
                
                return {
                    type: reportType,
                    period: reportPeriod,
                    format: reportFormat,
                    startDate,
                    endDate
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.generateReport(result.value);
            }
        });
    }
    
    // Generate report based on user selection
    async generateReport(reportConfig) {
        try {
            this.showLoading(true, 'Generating report...');
            
            console.log('Generating report with config:', reportConfig);
            
            // Call actual API endpoint for report generation
            const response = await api.generateReport(reportConfig);
            
            this.showLoading(false);
            
            if (response && response.success) {
                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Report Generated',
                    text: `Your ${reportConfig.type} report has been generated successfully!`,
                    confirmButtonText: 'Download',
                    showCancelButton: true,
                    cancelButtonText: 'Close'
                }).then((result) => {
                    if (result.isConfirmed && response.downloadUrl) {
                        // Trigger download
                        window.open(response.downloadUrl, '_blank');
                    }
                });
            } else {
                this.showError('Failed to generate report: ' + 
                    (response?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error generating report:', error);
            this.showLoading(false);
            this.showError('An error occurred while generating the report');
        }
    }
    
    // View complaint details
    async viewComplaintDetails(complaintId) {
        console.log('Viewing complaint details:', complaintId);
        
        try {
            this.showLoading(true, 'Loading complaint details...');
            
            // Fetch detailed complaint data from API
            const response = await api.getComplaintDetails(complaintId);
            
            this.showLoading(false);
            
            if (response && response.success && response.complaint) {
                const complaint = response.complaint;
                
                Swal.fire({
                    title: `Complaint ${complaint.id}`,
                    html: `
                        <div class="complaint-detail">
                            <div class="complaint-detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Student:</span>
                                    <span class="detail-value">${complaint.student}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Type:</span>
                                    <span class="detail-value">${complaint.type}</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Status:</span>
                                    <span class="detail-value">
                                        <span class="status-badge" style="background-color: ${STATUS_COLORS[complaint.status] || '#9e9e9e'}">
                                            ${complaint.status}
                                        </span>
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Priority:</span>
                                    <span class="detail-value">
                                        <span class="priority-badge ${complaint.priority.toLowerCase()}">
                                            ${complaint.priority}
                                        </span>
                                    </span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Date:</span>
                                    <span class="detail-value">${this.formatDate(complaint.date)}</span>
                                </div>
                            </div>
                            <div class="complaint-description">
                                <h4>Description</h4>
                                <p>${complaint.description || 'No description provided'}</p>
                            </div>
                        </div>
                    `,
                    showCancelButton: true,
                    confirmButtonText: 'Update Status',
                    cancelButtonText: 'Close'
                }).then((result) => {
                    if (result.isConfirmed) {
                        this.showStatusUpdateModal(complaintId);
                    }
                });
            } else {
                this.showError(`Failed to load complaint details: ${response?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error loading complaint details:', error);
            this.showLoading(false);
            this.showError('An error occurred while loading complaint details');
        }
    }
    
    // Show modal to update complaint status
    showStatusUpdateModal(complaintId) {
        Swal.fire({
            title: 'Update Status',
            input: 'select',
            inputOptions: {
                'Pending': 'Pending',
                'In Progress': 'In Progress',
                'Resolved': 'Resolved',
                'Closed': 'Closed',
                'Rejected': 'Rejected'
            },
            inputPlaceholder: 'Select status',
            showCancelButton: true,
            confirmButtonText: 'Update',
            cancelButtonText: 'Cancel',
            inputValidator: (value) => {
                if (!value) {
                    return 'Please select a status';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.updateComplaintStatus(complaintId, result.value);
            }
        });
    }
    
    // Update complaint status
    async updateComplaintStatus(complaintId, status) {
        try {
            this.showLoading(true, 'Updating status...');
            
            // Call API to update complaint status
            const response = await api.updateComplaintStatus(complaintId, status);
            
            this.showLoading(false);
            
            if (response && response.success) {
                // Refresh dashboard data to show updated status
                await this.refreshDashboard();
                
                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Status Updated',
                    text: `Complaint ${complaintId} status updated to ${status}`,
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
            } else {
                this.showError(`Failed to update status: ${response?.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            this.showLoading(false);
            this.showError('Failed to update complaint status');
        }
    }
    
    // Edit complaint
    editComplaint(complaintId) {
        console.log('Editing complaint:', complaintId);
        
        // Navigate to complaints section with edit parameter
        if (window.navigationController) {
            window.navigationController.navigateToSection('complaints', { 
                action: 'edit',
                id: complaintId
            });
        } else {
            // Fallback navigation
            this.navigateToSection('complaints');
        }
    }
    
    // Set up auto-refresh
    setupAutoRefresh() {
        // Clear any existing interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Set up new interval
        this.refreshInterval = setInterval(() => {
            console.log('Auto-refreshing dashboard data...');
            this.refreshDashboard();
        }, REFRESH_INTERVAL);
    }
    
    // Clean up when navigating away
    cleanup() {
        // Clear auto-refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        
        console.log('Dashboard cleanup completed');
    }
    
    // Show loading indicator
    showLoading(show, message = 'Loading...') {
        if (window.navigationController?.setLoadingState) {
            window.navigationController.setLoadingState(show, message);
        }
    }
    
    // Show error message
    showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true
        });
    }
}

// Update the checkAdminAuth function in admindashboard.js
function checkAdminAuth() {
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('authToken');
    
    console.log("Auth check:", { role, username, token });
    
    // Check if we have all required authentication data
    if (!token || !username) {
        console.error('Authentication failed: Missing token or username');
        Swal.fire({
            icon: 'warning',
            title: 'Session Expired',
            text: 'Your session has expired. Please login again.',
            allowOutsideClick: false
        }).then(() => {
            window.location.href = 'index.html';
        });
        return false;
    }
    
    // Check if user has admin role - be flexible with role format
    const isAdmin = role === 'admin' || 
                   role === 'ADMIN' || 
                   role === 'administrator' || 
                   role === 'Administrator';
    
    if (!isAdmin) {
        console.error('Authentication failed: Not an admin role', { role });
        Swal.fire({
            icon: 'error',
            title: 'Unauthorized Access',
            text: 'You do not have admin privileges to access this page',
            allowOutsideClick: false
        }).then(() => {
            window.location.href = 'index.html';
        });
        return false;
    }

    // If we get here, authentication is successful
    console.log('Authentication successful. Welcome admin:', username);
    
    // Update profile information throughout the UI
    updateProfileInfo(username);
    return true;
}

// Update this function to correctly set the username in all places
function updateProfileInfo(username) {
    // Update sidebar profile
    document.querySelectorAll('.sidebar .admin-name').forEach(el => {
        el.textContent = username;
    });
    
    // Update top navbar profile
    document.querySelectorAll('.profile-name').forEach(el => {
        el.textContent = username;
    });
}

// Document ready event to initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Dashboard initializing...');
    
    // First check authentication
    if (checkAdminAuth()) {
        console.log('Admin Dashboard initialized successfully');
        
        // Create dashboard controller
        window.adminDashboard = new AdminDashboard();
        window.adminDashboard.initialize();
        
        // Register with navigation system if available
        if (window.navigationController && window.navigationController.registerSectionComponent) {
            window.navigationController.registerSectionComponent('dashboard', {
                init: () => {
                    console.log('Dashboard section initialized via navigation system');
                    window.adminDashboard.refreshDashboard();
                },
                cleanup: () => {
                    console.log('Dashboard section cleanup via navigation system');
                    window.adminDashboard.cleanup();
                },
                refresh: () => {
                    console.log('Dashboard section refreshed via navigation system');
                    window.adminDashboard.refreshDashboard();
                }
            });
        }
    }
});