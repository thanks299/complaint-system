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
    
    // Load dashboard statistics and recent complaints
    async refreshDashboard() {
        try {
            console.log('Refreshing dashboard data...');
            this.showLoading(true);

            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
            );
            
            // Fetch dashboard data from API - no mock data
            const response = await Promise.race([
                api.getDashboardStats(), timeoutPromise
            ]);

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
                this.showError('Failed to load dashboard data' + 
                    (response?.message || 'unknown error'));
            }

        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            this.showError('An error occurred while loading dashboard data');
            this.showLoading(false);
        }
    }
    
    // Update statistics UI elements
    updateStatsUI() {
        // Update count elements
        document.getElementById('pending-count').textContent = this.stats.pending;
        document.getElementById('inprogress-count').textContent = this.stats.inProgress;
        document.getElementById('resolved-count').textContent = this.stats.resolved;
        document.getElementById('total-users').textContent = this.stats.totalUsers;
    }
    
    // Update recent complaints table
    updateRecentComplaintsUI() {
        const tableBody = document.getElementById('dashboard-complaints-tbody');
        if (!tableBody) return;
        
        if (this.recentComplaints && this.recentComplaints.length > 0) {
            tableBody.innerHTML = '';
            
            this.recentComplaints.forEach(complaint => {
                const row = document.createElement('tr');
                
                // Create status badge with appropriate color
                const statusBadge = `
                    <span class="status-badge" style="background-color: ${STATUS_COLORS[complaint.status] || '#9e9e9e'}">
                        ${complaint.status}
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
                    <td>${complaint.id}</td>
                    <td>${complaint.student}</td>
                    <td>${complaint.type}</td>
                    <td>${statusBadge}</td>
                    <td>${priorityBadge}</td>
                    <td>${this.formatDate(complaint.date)}</td>
                    <td>${actions}</td>
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
                // Navigate to complaints section
                if (window.navigationController) {
                    window.navigationController.navigateToSection('complaints');
                }
                break;
                
            case 'add-user':
                // Navigate to users section with create modal
                if (window.navigationController) {
                    window.navigationController.navigateToSection('users');
                    // Show create user modal after navigation completes
                    setTimeout(() => {
                        if (window.usersController && window.usersController.showCreateUserModal) {
                            window.usersController.showCreateUserModal();
                        }
                    }, 500);
                }
                break;
                
            case 'generate-report':
                this.showReportGenerationModal();
                break;
                
            case 'system-settings':
                // Navigate to settings section
                if (window.navigationController) {
                    window.navigationController.navigateToSection('settings');
                }
                break;
                
            case 'logout':
                this.handleLogout();
                break;
                
            default:
                console.warn(`Unknown action: ${action}`);
        }
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

// Check if user is authenticated as admin
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

// Update profile information in UI elements
function updateProfileInfo(username) {
    // Update sidebar profile
    const sidebarAdminName = document.querySelector('.sidebar .admin-name');
    if (sidebarAdminName) {
        sidebarAdminName.textContent = username;
    }
    
    // Update top navbar profile
    const topNavProfileName = document.querySelector('.profile-name');
    if (topNavProfileName) {
        topNavProfileName.textContent = username;
    }
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