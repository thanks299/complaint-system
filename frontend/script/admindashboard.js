// Global variables
let allComplaints = [];
let filteredComplaints = [];
let searchTimeout;

// Configuration constants
const CONFIG = {
  REFRESH_INTERVAL: 30000, // 30 seconds
  SEARCH_DEBOUNCE: 300,    // 300ms
  STATUS_FLOW: {
    'pending': 'in_progress',
    'in_progress': 'resolved', 
    'resolved': 'pending'
  },
  ACTION_TEXTS: {
    'pending': 'Start',
    'in_progress': 'Resolve',
    'resolved': 'Reopen'
  }
};

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    initializeDashboard();
    setupEventListeners();
    startAutoRefresh();
});

// Enhanced error wrapper
function withErrorHandling(asyncFunction, context = '') {
  return async function(...args) {
    try {
      return await asyncFunction.apply(this, args);
    } catch (error) {
      console.error(`Error in ${context}:`, error);
      showError(`Failed to ${context.toLowerCase()}. Please try again.`);
    }
  };
}

// Enhanced loading wrapper
function withLoading(asyncFunction, loadingMessage = 'Loading...') {
  return async function(...args) {
    showLoading(true, loadingMessage);
    try {
      return await asyncFunction.apply(this, args);
    } finally {
      showLoading(false);
    }
  };
}

// Check if user is authenticated as admin
function checkAdminAuth() {
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    const token = localStorage.getItem('authToken');
    
    if (!token || !role || !username) {
        Swal.fire({
            icon: 'warning',
            title: 'Access Denied',
            text: 'Please login to access the admin dashboard'
        }).then(() => {
            window.location.href = 'index.html';
        });
        return;
    }
    
    if (role !== 'admin') {
        Swal.fire({
            icon: 'error',
            title: 'Unauthorized Access',
            text: 'You do not have admin privileges to access this page'
        }).then(() => {
            window.location.href = 'index.html';
        });
        return;
    }

    // Update profile information
    updateProfileInfo(username);
}

// Update profile information in sidebar and header
function updateProfileInfo(username) {
    // Update admin name in sidebar
    const adminNameElem = document.querySelector('.admin-name');
    if (adminNameElem) {
        adminNameElem.textContent = username;
    }
    
    // Update profile name in header
    const profileNameElem = document.querySelector('.profile-name');
    if (profileNameElem) {
        profileNameElem.textContent = username;
    }
}

// Enhanced dashboard initialization
const initializeDashboard = withLoading(async function() {
    try {
        // Load dashboard statistics first
        const dashboardData = await loadDashboardStats();
        
        // Update dashboard statistics with the data
        updateDashboardStats(dashboardData);
        
        // Load complaints
        await loadAllComplaints();
        
        showSuccess('Dashboard loaded successfully');
    } catch (error) {
        showError('Failed to load dashboard data. Please refresh the page.');
        console.error('Dashboard initialization error:', error);
        throw error;
    }
}, 'Loading dashboard...');

// Update dashboard statistics
function updateDashboardStats(stats) {
    if (!stats) {
        console.warn('No dashboard stats available to update');
        return;
    }
    
    // Update counter values with animation
    updateStatCard('pending-count', stats.pendingCount || 0);
    updateStatCard('inprogress-count', stats.inProgressCount || 0);
    updateStatCard('resolved-count', stats.resolvedCount || 0);
    updateStatCard('total-users', stats.totalUsers || 0);
}

// Setup event listeners
function setupEventListeners() {
    // Navigation links
    setupNavigationEvents();
    
    // Search functionality
    setupSearchFunctionality();
    
    // Profile dropdown toggle
    setupProfileDropdown();
    
    // Quick action buttons
    setupQuickActionButtons();
    
    // Table action buttons (will be set up when table is populated)
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Set up navigation events
function setupNavigationEvents() {
    // Sidebar nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const section = link.getAttribute('data-section');
            if (section) {
                e.preventDefault();
                activateNavItem(section);
            }
        });
    });
    
    // Sidebar toggle
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('collapsed');
            document.querySelector('.main-content').classList.toggle('expanded');
        });
    }
    
    // Mobile menu button
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }
    
    // Logout functionality
    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
        btn.addEventListener('click', handleLogout);
    });
}

// Set active navigation item
function activateNavItem(section) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected nav item
    const navItem = document.querySelector(`.nav-link[data-section="${section}"]`).parentNode;
    if (navItem) {
        navItem.classList.add('active');
    }
    
    // Update breadcrumb
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
        breadcrumb.innerHTML = `
            <span class="breadcrumb-item">
                <i class="fas fa-home"></i>
                <a href="#dashboard">Dashboard</a>
            </span>
            ${section !== 'dashboard' ? `
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-item active">
                ${section.charAt(0).toUpperCase() + section.slice(1)}
            </span>` : ''}
        `;
    }
}

// Set up search functionality
function setupSearchFunctionality() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchDebounced);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch(e);
            }
        });
    }
}

// Set up profile dropdown
function setupProfileDropdown() {
    const profileBtn = document.querySelector('.profile-btn');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (profileBtn && dropdownMenu) {
        profileBtn.addEventListener('click', () => {
            dropdownMenu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
    }
}

// Set up quick action buttons
function setupQuickActionButtons() {
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
            handleQuickAction(action);
        });
    });
}

// Handle quick action clicks
function handleQuickAction(action) {
    console.log(`Quick action: ${action}`);
    
    switch(action) {
        case 'view-complaints':
            activateNavItem('complaints');
            break;
        case 'add-user':
            activateNavItem('users');
            showAddUserModal();
            break;
        case 'generate-report':
            activateNavItem('analytics');
            showGenerateReportModal();
            break;
        case 'system-settings':
            activateNavItem('settings');
            break;
        default:
            console.warn(`Unknown action: ${action}`);
    }
}

// Show add user modal
function showAddUserModal() {
    Swal.fire({
        title: 'Add New User',
        html: `
            <form id="add-user-form">
                <div class="swal2-input-container">
                    <input id="name" class="swal2-input" placeholder="Full Name">
                    <input id="email" class="swal2-input" placeholder="Email Address">
                    <select id="role" class="swal2-select">
                        <option value="">Select Role</option>
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                    </select>
                    <input id="password" type="password" class="swal2-input" placeholder="Password">
                </div>
            </form>
        `,
        showCancelButton: true,
        confirmButtonText: 'Add User',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const role = document.getElementById('role').value;
            const password = document.getElementById('password').value;
            
            if (!name || !email || !role || !password) {
                Swal.showValidationMessage('Please fill all fields');
                return false;
            }
            
            return { name, email, role, password };
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            // Call API to create user
            createUser(result.value);
        }
    });
}

// Create new user
const createUser = withErrorHandling(async function(userData) {
    await api.createUser(userData);
    
    Swal.fire({
        icon: 'success',
        title: 'User Created',
        text: `User ${userData.name} has been created successfully`,
        timer: 2000,
        showConfirmButton: false
    });
}, 'create user');

// Show generate report modal
function showGenerateReportModal() {
    Swal.fire({
        title: 'Generate Report',
        html: `
            <form id="report-form">
                <div class="swal2-input-container">
                    <select id="report-type" class="swal2-select">
                        <option value="">Select Report Type</option>
                        <option value="complaints">Complaints Report</option>
                        <option value="users">Users Report</option>
                        <option value="analytics">Analytics Report</option>
                    </select>
                    <select id="report-format" class="swal2-select">
                        <option value="pdf">PDF</option>
                        <option value="csv">CSV</option>
                        <option value="excel">Excel</option>
                    </select>
                    <div class="date-range-container">
                        <label for="start-date">Start Date</label>
                        <input id="start-date" type="date" class="swal2-input">
                        <label for="end-date">End Date</label>
                        <input id="end-date" type="date" class="swal2-input">
                    </div>
                </div>
            </form>
        `,
        showCancelButton: true,
        confirmButtonText: 'Generate',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            const reportType = document.getElementById('report-type').value;
            const reportFormat = document.getElementById('report-format').value;
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            
            if (!reportType || !reportFormat) {
                Swal.showValidationMessage('Please select report type and format');
                return false;
            }
            
            return { reportType, reportFormat, startDate, endDate };
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            // Call API to generate report
            generateReport(result.value);
        }
    });
}

// Generate report
const generateReport = withErrorHandling(async function(reportData) {
    // Show generating message
    Swal.fire({
        title: 'Generating Report',
        text: 'Please wait while we generate your report...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        // Call API to generate report
        const result = await api.generateReport(reportData.reportFormat, {
            type: reportData.reportType,
            startDate: reportData.startDate,
            endDate: reportData.endDate
        });
        
        // Show success and provide download link
        Swal.fire({
            icon: 'success',
            title: 'Report Generated',
            html: `
                <p>Your report has been generated successfully.</p>
                <a href="${result.downloadUrl}" class="download-link" target="_blank">
                    <i class="fas fa-download"></i> Download Report
                </a>
            `,
            confirmButtonText: 'Close'
        });
    } catch (error) {
        throw error;
    }
}, 'generate report');

// Debounced search handler
function handleSearchDebounced(event) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        handleSearch(event);
    }, CONFIG.SEARCH_DEBOUNCE);
}

// Enhanced search functionality
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredComplaints = [...allComplaints];
    } else {
        filteredComplaints = allComplaints.filter(complaint => {
            const searchableFields = [
                complaint.title || complaint.subject || '',
                complaint.description || complaint.message || '',
                complaint.username || complaint.studentName || '',
                complaint.status || '',
                complaint.id?.toString() || complaint.ticketId || ''
            ];
            
            return searchableFields.some(field => 
                field.toLowerCase().includes(searchTerm)
            );
        });
    }
    
    displayComplaints(filteredComplaints);
}

// Animated stat card update
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        const currentValue = parseInt(element.textContent) || 0;
        animateCounter(element, currentValue, value, 1000);
    }
}

// Counter animation
function animateCounter(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

// Enhanced complaint loading with better error handling
const loadAllComplaints = withErrorHandling(async function() {
    try {
        // Get complaints from API
        allComplaints = await api.getComplaints();
        filteredComplaints = [...allComplaints];
        
        // Update the dashboard complaints table
        updateDashboardComplaintsTable(allComplaints);
        
        return allComplaints;
    } catch (error) {
        console.error('Error loading complaints:', error);
        // Initialize with empty arrays if API fails
        allComplaints = [];
        filteredComplaints = [];
        
        // Update table to show empty state
        updateDashboardComplaintsTable([]);
        
        throw error;
    }
}, 'load complaints');

// Update the dashboard complaints table
function updateDashboardComplaintsTable(complaints) {
    const tbody = document.getElementById('dashboard-complaints-tbody');
    if (!tbody) return;
    
    // Clear current content
    tbody.innerHTML = '';
    
    // If no complaints, show empty state
    if (!complaints || complaints.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-table-message">
                    <div class="table-empty">
                        <div class="empty-illustration">
                            <i class="fas fa-inbox"></i>
                        </div>
                        <h4>No complaints found</h4>
                        <p>There are no complaints to display at this time.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    // Add complaints to table
    complaints.slice(0, 5).forEach(complaint => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><strong>${complaint.ticketId || `NACOS-${String(complaint.id).padStart(6, '0')}`}</strong></td>
            <td>
                <div class="user-info">
                    <div class="user-name">${escapeHtml(complaint.studentName || complaint.username || 'Unknown')}</div>
                    <div class="user-email">${escapeHtml(complaint.studentId || complaint.email || 'N/A')}</div>
                </div>
            </td>
            <td><span class="type-badge">${complaint.type || 'General'}</span></td>
            <td><span class="status-badge ${complaint.status || 'pending'}">${complaint.status || 'pending'}</span></td>
            <td><span class="priority-badge ${complaint.priority || 'medium'}">${complaint.priority || 'medium'}</span></td>
            <td>${formatDate(complaint.dateCreated || complaint.created_at)}</td>
            <td>
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
    
    // Add event listeners to the newly created buttons
    setupTableActionButtons();
}

// Set up table action buttons
function setupTableActionButtons() {
    // View buttons
    document.querySelectorAll('[data-action="view-complaint"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            viewComplaint(id);
        });
    });
    
    // Edit buttons
    document.querySelectorAll('[data-action="edit-complaint"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            editComplaintStatus(id);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('[data-action="delete-complaint"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            deleteComplaint(id);
        });
    });
}

// View complaint details with improved error handling
const viewComplaint = withErrorHandling(async function(complaintId) {
    // Show loading
    showLoading(true, 'Loading complaint details...');
    
    try {
        // Try to get complaint from API
        const complaint = await api.getComplaintById(complaintId);
        showComplaintModal(complaint);
    } catch (error) {
        console.error('Error fetching complaint details:', error);
        
        // Try to find complaint in local data as fallback
        const localComplaint = allComplaints.find(c => c.id == complaintId);
        
        if (localComplaint) {
            console.warn('Using locally cached complaint data as fallback');
            showComplaintModal(localComplaint);
        } else {
            throw new Error('Complaint not found');
        }
    } finally {
        showLoading(false);
    }
}, 'view complaint details');

// Show complaint details in a modal
function showComplaintModal(complaint) {
    Swal.fire({
        title: `Complaint Details`,
        html: `
            <div class="complaint-detail-grid">
                <div class="detail-group">
                    <label>ID:</label>
                    <div>${complaint.ticketId || `NACOS-${String(complaint.id).padStart(6, '0')}`}</div>
                </div>
                <div class="detail-group">
                    <label>Student:</label>
                    <div>${escapeHtml(complaint.studentName || complaint.username || 'N/A')}</div>
                </div>
                <div class="detail-group">
                    <label>Student ID:</label>
                    <div>${escapeHtml(complaint.studentId || 'N/A')}</div>
                </div>
                <div class="detail-group">
                    <label>Date:</label>
                    <div>${formatDate(complaint.dateCreated || complaint.created_at)}</div>
                </div>
                <div class="detail-group">
                    <label>Type:</label>
                    <div><span class="type-badge">${complaint.type || 'General'}</span></div>
                </div>
                <div class="detail-group">
                    <label>Status:</label>
                    <div><span class="status-badge ${complaint.status || 'pending'}">${complaint.status || 'pending'}</span></div>
                </div>
                <div class="detail-group">
                    <label>Priority:</label>
                    <div><span class="priority-badge ${complaint.priority || 'medium'}">${complaint.priority || 'medium'}</span></div>
                </div>
                <div class="detail-group full-width">
                    <label>Subject:</label>
                    <div>${escapeHtml(complaint.subject || complaint.title || 'N/A')}</div>
                </div>
                <div class="detail-group full-width">
                    <label>Description:</label>
                    <div class="complaint-description">${escapeHtml(complaint.description || complaint.message || 'No description provided').replace(/\n/g, '<br>')}</div>
                </div>
            </div>
        `,
        width: 700,
        showCloseButton: true,
        showCancelButton: true,
        confirmButtonText: 'Update Status',
        cancelButtonText: 'Close'
    }).then((result) => {
        if (result.isConfirmed) {
            editComplaintStatus(complaint.id);
        }
    });
}

// Edit complaint status with improved error handling
const editComplaintStatus = withErrorHandling(async function(complaintId) {
    let complaint;
    
    try {
        // Try to get complaint from API
        complaint = await api.getComplaintById(complaintId);
    } catch (error) {
        console.error('Error fetching complaint for editing:', error);
        
        // Try to find complaint in local data as fallback
        complaint = allComplaints.find(c => c.id == complaintId);
        
        if (!complaint) {
            throw new Error('Complaint not found');
        }
    }
    
    // Show edit status modal
    Swal.fire({
        title: 'Update Complaint Status',
        html: `
            <form id="edit-status-form">
                <div class="form-group">
                    <label>Status:</label>
                    <select class="swal2-select" id="status-select">
                        <option value="pending" ${(complaint.status === 'pending') ? 'selected' : ''}>Pending</option>
                        <option value="in_progress" ${(complaint.status === 'in_progress') ? 'selected' : ''}>In Progress</option>
                        <option value="resolved" ${(complaint.status === 'resolved') ? 'selected' : ''}>Resolved</option>
                        <option value="closed" ${(complaint.status === 'closed') ? 'selected' : ''}>Closed</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Priority:</label>
                    <select class="swal2-select" id="priority-select">
                        <option value="low" ${(complaint.priority === 'low') ? 'selected' : ''}>Low</option>
                        <option value="medium" ${(complaint.priority === 'medium') ? 'selected' : ''}>Medium</option>
                        <option value="high" ${(complaint.priority === 'high') ? 'selected' : ''}>High</option>
                        <option value="urgent" ${(complaint.priority === 'urgent') ? 'selected' : ''}>Urgent</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Resolution Note:</label>
                    <textarea class="swal2-textarea" id="resolution-note" rows="4" 
                        placeholder="Add notes about the resolution or status change">${complaint.resolutionNote || ''}</textarea>
                </div>
            </form>
        `,
        showCancelButton: true,
        confirmButtonText: 'Update',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            const status = document.getElementById('status-select').value;
            const priority = document.getElementById('priority-select').value;
            const resolutionNote = document.getElementById('resolution-note').value;
            
            return { status, priority, resolutionNote };
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            updateComplaint(complaintId, result.value);
        }
    });
}, 'edit complaint status');

// Update complaint
const updateComplaint = withErrorHandling(async function(complaintId, updates) {
    try {
        // Update complaint via API
        await api.updateComplaint(complaintId, updates);
        
        // Update local data
        updateLocalComplaint(complaintId, updates);
        
        // Show success message
        showSuccess('Complaint updated successfully');
        
        // Refresh dashboard data
        await loadDashboardStats();
        updateDashboardComplaintsTable(allComplaints);
    } catch (error) {
        throw error;
    }
}, 'update complaint');

// Update local complaint data
function updateLocalComplaint(complaintId, updates) {
    // Find and update complaint in allComplaints array
    const index = allComplaints.findIndex(c => c.id == complaintId);
    if (index !== -1) {
        allComplaints[index] = {
            ...allComplaints[index],
            ...updates
        };
    }
}

// Delete complaint
const deleteComplaint = withErrorHandling(async function(complaintId) {
    // Confirm deletion
    const result = await Swal.fire({
        title: 'Delete Complaint',
        text: 'Are you sure you want to delete this complaint? This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel'
    });
    
    if (result.isConfirmed) {
        try {
            // Delete from API
            await api.deleteComplaint(complaintId);
            
            // Remove from local data
            allComplaints = allComplaints.filter(c => c.id != complaintId);
            filteredComplaints = filteredComplaints.filter(c => c.id != complaintId);
            
            // Show success message
            showSuccess('Complaint deleted successfully');
            
            // Refresh data
            updateDashboardComplaintsTable(allComplaints);
            await loadDashboardStats();
        } catch (error) {
            throw error;
        }
    }
}, 'delete complaint');

// Load dashboard stats with improved error handling
const loadDashboardStats = withErrorHandling(async function() {
    try {
        // Try to get stats from API
        const stats = await api.getDashboardStats();
        updateDashboardStats(stats);
        return stats;
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Provide minimal fallback stats to prevent UI errors
        const fallbackStats = {
            pendingCount: 0,
            inProgressCount: 0,
            resolvedCount: 0,
            totalUsers: 0
        };
        
        updateDashboardStats(fallbackStats);
        return fallbackStats;
    }
}, 'load dashboard statistics');

// Enhanced logout with confirmation
function handleLogout() {
    api.logout(true);
}

// Auto-refresh functionality
function startAutoRefresh() {
    setInterval(async () => {
        try {
            const stats = await api.getDashboardStats();
            updateDashboardStats(stats);
            console.log('Dashboard stats auto-refreshed');
        } catch (error) {
            console.warn('Auto-refresh failed:', error);
        }
    }, CONFIG.REFRESH_INTERVAL);
}

// Keyboard shortcuts
function handleKeyboardShortcuts(event) {
    // Ctrl/Cmd + R for refresh
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        initializeDashboard();
    }
    
    // Escape key to clear search
    if (event.key === 'Escape') {
        const searchInput = document.querySelector('.search-input');
        if (searchInput && searchInput.value) {
            searchInput.value = '';
            handleSearch({ target: searchInput });
        }
    }
}

// Show loading indicator
function showLoading(show, message = 'Loading...') {
    // Create loading indicator if it doesn't exist
    let loadingEl = document.getElementById('loadingIndicator');
    
    if (!loadingEl && show) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'loadingIndicator';
        loadingEl.className = 'loading-indicator';
        loadingEl.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
            <p class="loading-message">${message}</p>
        `;
        document.body.appendChild(loadingEl);
    }
    
    if (loadingEl) {
        if (show) {
            loadingEl.classList.add('active');
            const messageEl = loadingEl.querySelector('.loading-message');
            if (messageEl) {
                messageEl.textContent = message;
            }
        } else {
            loadingEl.classList.remove('active');
            setTimeout(() => {
                if (loadingEl && loadingEl.parentNode) {
                    loadingEl.parentNode.removeChild(loadingEl);
                }
            }, 300);
        }
    }
}

// Show error message
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        toast: true,
        position: 'top-end',
        timer: 5000,
        timerProgressBar: true,
        showConfirmButton: false
    });
}

// Show success message
function showSuccess(message) {
    Swal.fire({
        icon: 'success',
        title: 'Success',
        text: message,
        toast: true,
        position: 'top-end',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false
    });
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return 'Invalid Date';
    }
}

// Truncate text
function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Get next status in workflow
function getNextStatus(currentStatus) {
    return CONFIG.STATUS_FLOW[currentStatus] || 'in_progress';
}

// Get action text based on status
function getActionText(status) {
    return CONFIG.ACTION_TEXTS[status] || 'Update';
}

// Display complaints function for search results
function displayComplaints(complaints) {
    updateDashboardComplaintsTable(complaints);
}

// Export functions for external use
window.adminDashboard = {
    refreshDashboard: initializeDashboard,
    loadAllComplaints,
    loadDashboardStats,
    updateComplaint,
    deleteComplaint,
    viewComplaint,
    editComplaintStatus
};