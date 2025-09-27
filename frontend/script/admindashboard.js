// Global variables
let allComplaints = [];
let filteredComplaints = [];
let searchTimeout;

// Configuration constants
const CONFIG = {
  REFRESH_INTERVAL: 30000, // 30 seconds
  SEARCH_DEBOUNCE: 300,    // 300ms
  STATUS_FLOW: {
    'pending': 'in-progress',
    'in-progress': 'resolved', 
    'resolved': 'pending'
  },
  ACTION_TEXTS: {
    'pending': 'Start',
    'in-progress': 'Resolve',
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
    
    if (!role || !username) {
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

    // Display welcome message
    updateWelcomeMessage(username);
}

// Update welcome message
function updateWelcomeMessage(username) {
    const welcomeElement = document.querySelector('.dashboard-header h1');
    if (welcomeElement) {
        welcomeElement.textContent = `Welcome, ${username}`;
    }
}

// Enhanced dashboard initialization
const initializeDashboard = withLoading(async function() {
    try {
        await Promise.all([
            loadDashboardStats(),
            loadAllComplaints()
        ]);
        showSuccess('Dashboard loaded successfully');
    } catch (error) {
        showError('Failed to load dashboard data. Please refresh the page.');
        throw error;
    }
}, 'Loading dashboard...');

// Setup event listeners with enhanced functionality
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Enhanced search with debouncing
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearchDebounced);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch(e);
            }
        });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            initializeDashboard();
        });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

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
                complaint.title || '',
                complaint.description || complaint.message || '',
                complaint.username || complaint.user_name || '',
                complaint.status || '',
                complaint.id?.toString() || ''
            ];
            
            return searchableFields.some(field => 
                field.toLowerCase().includes(searchTerm)
            );
        });
    }
    
    displayComplaints(filteredComplaints);
    updateSearchStats(searchTerm, filteredComplaints.length);
}

// Update search statistics
function updateSearchStats(searchTerm, resultCount) {
    let statusText = '';
    if (searchTerm) {
        statusText = `Found ${resultCount} complaint${resultCount !== 1 ? 's' : ''} for "${searchTerm}"`;
    } else {
        statusText = `Showing all ${allComplaints.length} complaints`;
    }
    
    const statusElement = document.getElementById('searchStatus');
    if (statusElement) {
        statusElement.textContent = statusText;
    }
}

// Enhanced stats loading
const loadDashboardStats = withErrorHandling(async function() {
    const complaints = await api.getComplaints();
    
    const stats = {
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'pending').length,
        inProgress: complaints.filter(c => c.status === 'in-progress').length,
        resolved: complaints.filter(c => c.status === 'resolved').length
    };
    
    // Update stat cards with animation
    updateStatCard('totalComplaints', stats.total);
    updateStatCard('pendingComplaints', stats.pending);
    updateStatCard('resolvedComplaints', stats.resolved);
    
    // Additional stats
    updateStatCard('inProgressComplaints', stats.inProgress);
    
    return stats;
}, 'load dashboard statistics');

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

// Enhanced complaint loading
const loadAllComplaints = withErrorHandling(async function() {
    allComplaints = await api.getComplaints();
    filteredComplaints = [...allComplaints];
    displayComplaints(filteredComplaints);
    return allComplaints;
}, 'load complaints');

// Enhanced complaint display with better error handling
function displayComplaints(complaints) {
    const tbody = document.querySelector('#complaintsTable tbody');
    const emptyState = document.getElementById('emptyState');
    
    if (!tbody) {
        console.error('Complaints table body not found');
        return;
    }
    
    if (!complaints || complaints.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    tbody.innerHTML = complaints.map((complaint, index) => {
        const safeComplaint = {
            id: complaint.id || index,
            username: complaint.username || complaint.user_name || 'Unknown User',
            title: complaint.title || complaint.subject || 'No Title',
            description: complaint.description || complaint.message || 'No Description',
            created_at: complaint.created_at || complaint.date_created || new Date().toISOString(),
            status: complaint.status || 'pending'
        };
        
        return `
            <tr data-complaint-id="${safeComplaint.id}">
                <td>#${safeComplaint.id}</td>
                <td>${escapeHtml(safeComplaint.username)}</td>
                <td>${escapeHtml(safeComplaint.title)}</td>
                <td>${escapeHtml(truncateText(safeComplaint.description, 100))}</td>
                <td>${formatDate(safeComplaint.created_at)}</td>
                <td>
                    <span class="status-badge status-${safeComplaint.status}">
                        ${safeComplaint.status}
                    </span>
                </td>
                <td class="action-buttons">
                    <button class="action-btn" onclick="updateComplaintStatus(${safeComplaint.id}, '${getNextStatus(safeComplaint.status)}')">
                        ${getActionText(safeComplaint.status)}
                    </button>
                    <button class="action-btn view-btn" onclick="viewComplaint(${safeComplaint.id})">View</button>
                    <button class="action-btn delete" onclick="deleteComplaint(${safeComplaint.id})">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Add hover effects
    addTableInteractions();
}

// Add table interactions
function addTableInteractions() {
    const rows = document.querySelectorAll('#complaintsTable tbody tr');
    rows.forEach(row => {
        row.addEventListener('mouseenter', () => {
            row.style.backgroundColor = '#f8f9fa';
        });
        row.addEventListener('mouseleave', () => {
            row.style.backgroundColor = '';
        });
    });
}

// Enhanced status update with optimistic updates
const updateComplaintStatus = withErrorHandling(async function(complaintId, newStatus) {
    const result = await Swal.fire({
        title: 'Update Status',
        text: `Change complaint #${complaintId} status to "${newStatus}"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'Cancel'
    });
    
    if (result.isConfirmed) {
        // Optimistic update
        updateComplaintInList(complaintId, { status: newStatus });
        displayComplaints(filteredComplaints);
        
        try {
            await api.updateComplaintStatus(complaintId, newStatus);
            
            Swal.fire({
                icon: 'success',
                title: 'Status Updated',
                text: `Complaint #${complaintId} status changed to "${newStatus}"`,
                timer: 2000,
                showConfirmButton: false
            });
            
            // Refresh stats
            await loadDashboardStats();
        } catch (error) {
            // Revert optimistic update on failure
            await loadAllComplaints();
            throw error;
        }
    }
}, 'update complaint status');

// Update complaint in local list
function updateComplaintInList(complaintId, updates) {
    const index = allComplaints.findIndex(c => c.id == complaintId);
    if (index !== -1) {
        allComplaints[index] = { ...allComplaints[index], ...updates };
        filteredComplaints = [...allComplaints];
    }
}

// Enhanced complaint viewer
const viewComplaint = withErrorHandling(async function(complaintId) {
    const complaint = allComplaints.find(c => c.id == complaintId);
    if (!complaint) {
        showError('Complaint not found');
        return;
    }
    
    const modalHtml = `
        <div style="text-align: left; max-height: 400px; overflow-y: auto;">
            <div class="complaint-detail">
                <p><strong>ID:</strong> #${complaint.id}</p>
                <p><strong>User:</strong> ${escapeHtml(complaint.username || complaint.user_name || 'N/A')}</p>
                <p><strong>Email:</strong> ${escapeHtml(complaint.email || 'N/A')}</p>
                <p><strong>Date:</strong> ${formatDate(complaint.created_at || complaint.date_created)}</p>
                <p><strong>Status:</strong> 
                    <span class="status-badge status-${complaint.status || 'pending'}">
                        ${complaint.status || 'pending'}
                    </span>
                </p>
                <p><strong>Priority:</strong> ${complaint.priority || 'Medium'}</p>
                <hr>
                <p><strong>Title:</strong></p>
                <div class="complaint-title">${escapeHtml(complaint.title || complaint.subject || 'No title')}</div>
                <br>
                <p><strong>Description:</strong></p>
                <div class="complaint-description">
                    ${escapeHtml(complaint.description || complaint.message || 'No description provided').replace(/\n/g, '<br>')}
                </div>
            </div>
        </div>
    `;
    
    Swal.fire({
        title: `Complaint #${complaint.id}`,
        html: modalHtml,
        width: '700px',
        showCloseButton: true,
        showCancelButton: true,
        confirmButtonText: 'Update Status',
        cancelButtonText: 'Close',
        customClass: {
            popup: 'complaint-modal'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const nextStatus = getNextStatus(complaint.status);
            updateComplaintStatus(complaint.id, nextStatus);
        }
    });
}, 'view complaint details');

// Enhanced delete functionality
const deleteComplaint = withErrorHandling(async function(complaintId) {
    const result = await Swal.fire({
        title: 'Delete Complaint',
        text: `Are you sure you want to delete complaint #${complaintId}? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    });
    
    if (result.isConfirmed) {
        // Remove from local list optimistically
        allComplaints = allComplaints.filter(c => c.id != complaintId);
        filteredComplaints = filteredComplaints.filter(c => c.id != complaintId);
        displayComplaints(filteredComplaints);
        
        try {
            await api.deleteComplaint(complaintId);
            
            Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: `Complaint #${complaintId} has been deleted successfully`,
                timer: 2000,
                showConfirmButton: false
            });
            
            // Refresh stats
            await loadDashboardStats();
        } catch (error) {
            // Revert on failure
            await loadAllComplaints();
            throw error;
        }
    }
}, 'delete complaint');

// Enhanced logout with confirmation
function handleLogout() {
    api.logout(true);
}

// Auto-refresh functionality
function startAutoRefresh() {
    setInterval(async () => {
        try {
            await loadDashboardStats();
            await loadAllComplaints();
            console.log('Dashboard auto-refreshed');
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
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
            searchInput.value = '';
            handleSearch({ target: searchInput });
        }
    }
}

// Utility functions
function showLoading(show, message = 'Loading...') {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
        if (show && message) {
            const loadingText = spinner.querySelector('p');
            if (loadingText) loadingText.textContent = message;
        }
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
    
    console.error('Dashboard Error:', message);
}

function showSuccess(message) {
    Swal.fire({
        icon: 'success',
        title: 'Success',
        text: message,
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
        return 'Invalid Date';
    }
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

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

function getNextStatus(currentStatus) {
    return CONFIG.STATUS_FLOW[currentStatus] || 'in-progress';
}

function getActionText(status) {
    return CONFIG.ACTION_TEXTS[status] || 'Update';
}

// Refresh dashboard function (can be called externally)
async function refreshDashboard() {
    await initializeDashboard();
}

// Export functions for external use
window.adminDashboard = {
    refreshDashboard,
    loadAllComplaints,
    loadDashboardStats,
    updateComplaintStatus,
    deleteComplaint,
    viewComplaint
};