// Global variables
let allComplaints = [];
let filteredComplaints = [];

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
    initializeDashboard();
    setupEventListeners();
});

// Check if user is authenticated as admin
function checkAdminAuth() {
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    
    if (!role || !username) {
        window.location.href = 'index.html';
        return;
    }
    
    if (role !== 'admin') {
        Swal.fire({
            icon: 'error',
            title: 'Access Denied',
            text: 'You do not have admin privileges'
        }).then(() => {
            window.location.href = 'index.html';
        });
        return;
    }
}

// Initialize dashboard data
async function initializeDashboard() {
    showLoading(true);
    try {
        await loadDashboardStats();
        await loadAllComplaints();
    } catch (error) {
        showError('Failed to load dashboard data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    // Refresh button (if you add one)
    // document.getElementById('refreshBtn').addEventListener('click', refreshDashboard);
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const complaints = await api.getComplaints();
        
        const totalComplaints = complaints.length;
        const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
        const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
        
        // Update stat cards
        document.getElementById('totalComplaints').textContent = totalComplaints;
        document.getElementById('pendingComplaints').textContent = pendingComplaints;
        document.getElementById('resolvedComplaints').textContent = resolvedComplaints;
        
        // You can also load user stats if you have that endpoint
        // const users = await api.getAllUsers();
        // document.getElementById('totalUsers').textContent = users.length;
        
    } catch (error) {
        console.error('Error loading stats:', error);
        throw error;
    }
}

// Load all complaints
async function loadAllComplaints() {
    try {
        allComplaints = await api.getComplaints();
        filteredComplaints = [...allComplaints];
        displayComplaints(filteredComplaints);
    } catch (error) {
        console.error('Error loading complaints:', error);
        throw error;
    }
}

// Display complaints in table
function displayComplaints(complaints) {
    const tbody = document.querySelector('#complaintsTable tbody');
    const emptyState = document.getElementById('emptyState');
    
    if (!complaints || complaints.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    tbody.innerHTML = complaints.map(complaint => `
        <tr>
            <td>#${complaint.id}</td>
            <td>${complaint.username || complaint.user_name || 'N/A'}</td>
            <td>${complaint.title || complaint.subject || 'No Title'}</td>
            <td>${truncateText(complaint.description || complaint.message || 'No Description', 100)}</td>
            <td>${formatDate(complaint.created_at || complaint.date_created)}</td>
            <td>
                <span class="status-badge status-${complaint.status || 'pending'}">
                    ${complaint.status || 'pending'}
                </span>
            </td>
            <td>
                <button class="action-btn" onclick="updateComplaintStatus(${complaint.id}, '${getNextStatus(complaint.status)}')">
                    ${getActionText(complaint.status)}
                </button>
                <button class="action-btn" onclick="viewComplaint(${complaint.id})">View</button>
                <button class="action-btn delete" onclick="deleteComplaint(${complaint.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Search functionality
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredComplaints = [...allComplaints];
    } else {
        filteredComplaints = allComplaints.filter(complaint => 
            (complaint.title || '').toLowerCase().includes(searchTerm) ||
            (complaint.description || '').toLowerCase().includes(searchTerm) ||
            (complaint.username || '').toLowerCase().includes(searchTerm) ||
            (complaint.status || '').toLowerCase().includes(searchTerm)
        );
    }
    
    displayComplaints(filteredComplaints);
}

// Update complaint status
async function updateComplaintStatus(complaintId, newStatus) {
    try {
        const result = await Swal.fire({
            title: 'Update Status',
            text: `Change complaint status to "${newStatus}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, update it!'
        });
        
        if (result.isConfirmed) {
            await api.updateComplaintStatus(complaintId, newStatus);
            
            Swal.fire({
                icon: 'success',
                title: 'Status Updated',
                text: `Complaint status changed to "${newStatus}"`,
                timer: 2000
            });
            
            // Refresh data
            await loadDashboardStats();
            await loadAllComplaints();
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Update Failed',
            text: 'Failed to update complaint status: ' + error.message
        });
    }
}

// View complaint details
async function viewComplaint(complaintId) {
    try {
        const complaint = allComplaints.find(c => c.id === complaintId);
        if (!complaint) return;
        
        Swal.fire({
            title: complaint.title || 'Complaint Details',
            html: `
                <div style="text-align: left;">
                    <p><strong>ID:</strong> #${complaint.id}</p>
                    <p><strong>User:</strong> ${complaint.username || 'N/A'}</p>
                    <p><strong>Email:</strong> ${complaint.email || 'N/A'}</p>
                    <p><strong>Date:</strong> ${formatDate(complaint.created_at)}</p>
                    <p><strong>Status:</strong> ${complaint.status || 'pending'}</p>
                    <p><strong>Description:</strong></p>
                    <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-top: 10px;">
                        ${complaint.description || complaint.message || 'No description provided'}
                    </div>
                </div>
            `,
            width: '600px',
            confirmButtonText: 'Close'
        });
    } catch (error) {
        console.error('Error viewing complaint:', error);
    }
}

// Delete complaint
async function deleteComplaint(complaintId) {
    try {
        const result = await Swal.fire({
            title: 'Delete Complaint',
            text: 'Are you sure you want to delete this complaint? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Yes, delete it!'
        });
        
        if (result.isConfirmed) {
            await api.deleteComplaint(complaintId);
            
            Swal.fire({
                icon: 'success',
                title: 'Deleted',
                text: 'Complaint has been deleted successfully',
                timer: 2000
            });
            
            // Refresh data
            await loadDashboardStats();
            await loadAllComplaints();
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: 'Failed to delete complaint: ' + error.message
        });
    }
}

// Logout functionality
function handleLogout() {
    api.logout(true);
}

// Utility functions
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function truncateText(text, maxLength) {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function getNextStatus(currentStatus) {
    const statusFlow = {
        'pending': 'in-progress',
        'in-progress': 'resolved',
        'resolved': 'pending'
    };
    return statusFlow[currentStatus] || 'in-progress';
}

function getActionText(status) {
    const actionTexts = {
        'pending': 'Start',
        'in-progress': 'Resolve',
        'resolved': 'Reopen'
    };
    return actionTexts[status] || 'Update';
}

// Refresh dashboard data
async function refreshDashboard() {
    await initializeDashboard();
}