// Complaints Management functionality
class ComplaintsManager {
    constructor() {
        this.complaints = [];
        this.filteredComplaints = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.sortBy = 'created_at';
        this.sortOrder = 'desc';
        this.filters = {
            status: '',
            priority: '',
            category: '',
            search: ''
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadComplaints();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filters.search = searchInput.value;
                this.applyFilters();
            }, 300));
        }

        // Filter dropdowns
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.filters.status = statusFilter.value;
                this.applyFilters();
            });
        }

        const priorityFilter = document.getElementById('priorityFilter');
        if (priorityFilter) {
            priorityFilter.addEventListener('change', () => {
                this.filters.priority = priorityFilter.value;
                this.applyFilters();
            });
        }

        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.filters.category = categoryFilter.value;
                this.applyFilters();
            });
        }

        // Sort functionality
        document.querySelectorAll('[data-sort]').forEach(element => {
            element.addEventListener('click', (e) => {
                const sortBy = e.target.getAttribute('data-sort');
                this.sortComplaints(sortBy);
            });
        });

        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-link')) {
                e.preventDefault();
                const page = parseInt(e.target.getAttribute('data-page'));
                if (page) {
                    this.goToPage(page);
                }
            }
        });

        // Bulk actions
        const selectAllCheckbox = document.getElementById('selectAll');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        const bulkActionSelect = document.getElementById('bulkAction');
        if (bulkActionSelect) {
            bulkActionSelect.addEventListener('change', (e) => {
                this.executeBulkAction(e.target.value);
            });
        }
    }

    async loadComplaints() {
        try {
            this.showLoading(true);
            
            const response = await api.getComplaints({
                ...this.filters,
                page: this.currentPage,
                limit: this.itemsPerPage,
                sortBy: this.sortBy,
                sortOrder: this.sortOrder
            });

            this.complaints = response.complaints || response;
            this.filteredComplaints = [...this.complaints];
            
            this.renderComplaintsTable();
            this.updatePagination(response.total || this.complaints.length);
            this.updateStats();

        } catch (error) {
            console.error('Error loading complaints:', error);
            app.showToast(api.handleError(error), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    renderComplaintsTable() {
        const tbody = document.getElementById('complaintsTable');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.filteredComplaints.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-3x mb-3 d-block"></i>
                        <h5>No complaints found</h5>
                        <p>Try adjusting your filters or create a new complaint.</p>
                        <button class="btn btn-primary" onclick="app.showSection('new-complaint')">
                            <i class="fas fa-plus me-1"></i>Create New Complaint
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        this.filteredComplaints.forEach(complaint => {
            const row = this.createComplaintRow(complaint);
            tbody.appendChild(row);
        });
    }

    createComplaintRow(complaint) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="form-check">
                    <input class="form-check-input complaint-checkbox" 
                           type="checkbox" 
                           value="${complaint.id}"
                           onchange="complaintsManager.updateBulkActions()">
                </div>
            </td>
            <td>
                <span class="badge bg-light text-dark">#${complaint.id}</span>
            </td>
            <td>
                <div class="complaint-title">
                    <div class="fw-bold text-truncate-2" title="${complaint.title}">
                        ${complaint.title}
                    </div>
                    <small class="text-muted">
                        ${complaint.description.substring(0, 100)}${complaint.description.length > 100 ? '...' : ''}
                    </small>
                </div>
            </td>
            <td>
                <span class="badge bg-secondary">${complaint.category}</span>
            </td>
            <td>
                <span class="badge badge-status-${complaint.status}">
                    ${complaint.status.replace('_', ' ').toUpperCase()}
                </span>
            </td>
            <td>
                <span class="badge badge-priority-${complaint.priority}">
                    ${complaint.priority.toUpperCase()}
                </span>
            </td>
            <td>
                <div class="d-flex flex-column">
                    <small class="text-muted">
                        ${this.formatDate(complaint.created_at)}
                    </small>
                    ${complaint.updated_at !== complaint.created_at ? `
                        <small class="text-muted">
                            Updated: ${this.formatDate(complaint.updated_at)}
                        </small>
                    ` : ''}
                </div>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="complaintsManager.viewComplaint(${complaint.id})" 
                            title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" 
                            onclick="complaintsManager.editComplaint(${complaint.id})" 
                            title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info" 
                            onclick="complaintsManager.updateStatus(${complaint.id})" 
                            title="Update Status">
                        <i class="fas fa-sync"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" 
                            onclick="complaintsManager.deleteComplaint(${complaint.id})" 
                            title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    applyFilters() {
        this.filteredComplaints = this.complaints.filter(complaint => {
            // Status filter
            if (this.filters.status && complaint.status !== this.filters.status) {
                return false;
            }

            // Priority filter
            if (this.filters.priority && complaint.priority !== this.filters.priority) {
                return false;
            }

            // Category filter
            if (this.filters.category && complaint.category !== this.filters.category) {
                return false;
            }

            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const searchableText = `${complaint.title} ${complaint.description} ${complaint.email}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });

        this.currentPage = 1;
        this.renderComplaintsTable();
        this.updatePagination(this.filteredComplaints.length);
    }

    sortComplaints(sortBy) {
        if (this.sortBy === sortBy) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = sortBy;
            this.sortOrder = 'asc';
        }

        this.filteredComplaints.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // Handle date sorting
            if (sortBy.includes('_at')) {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            }

            // Handle string sorting
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (this.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        this.renderComplaintsTable();
        this.updateSortIndicators();
    }

    updateSortIndicators() {
        document.querySelectorAll('[data-sort]').forEach(element => {
            const sortBy = element.getAttribute('data-sort');
            const icon = element.querySelector('i');
            
            if (icon) {
                icon.className = 'fas fa-sort';
                if (sortBy === this.sortBy) {
                    icon.className = this.sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
                }
            }
        });
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadComplaints();
    }

    updatePagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const paginationContainer = document.getElementById('pagination');
        
        if (!paginationContainer) return;

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let paginationHTML = '<nav><ul class="pagination justify-content-center">';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
            if (startPage > 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        paginationHTML += '</ul></nav>';
        paginationContainer.innerHTML = paginationHTML;
    }

    updateStats() {
        const stats = {
            total: this.complaints.length,
            open: this.complaints.filter(c => c.status === 'open').length,
            inProgress: this.complaints.filter(c => c.status === 'in_progress').length,
            resolved: this.complaints.filter(c => c.status === 'resolved').length,
            closed: this.complaints.filter(c => c.status === 'closed').length
        };

        // Update stats display if elements exist
        Object.keys(stats).forEach(key => {
            const element = document.getElementById(`complaints${key.charAt(0).toUpperCase() + key.slice(1)}`);
            if (element) {
                element.textContent = stats[key];
            }
        });
    }

    async viewComplaint(id) {
        try {
            this.showLoading(true);
            const complaint = await api.getComplaint(id);
            this.showComplaintDetailModal(complaint);
        } catch (error) {
            console.error('Error loading complaint:', error);
            app.showToast(api.handleError(error), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showComplaintDetailModal(complaint) {
        const modal = document.getElementById('complaintDetailModal');
        const content = document.getElementById('complaintDetailContent');
        
        content.innerHTML = `
            <div class="row">
                <div class="col-md-8">
                    <h4>${complaint.title}</h4>
                    <div class="d-flex gap-2 mb-3">
                        <span class="badge badge-status-${complaint.status}">
                            ${complaint.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span class="badge badge-priority-${complaint.priority}">
                            ${complaint.priority.toUpperCase()}
                        </span>
                        <span class="badge bg-secondary">${complaint.category}</span>
                    </div>
                    <p class="text-muted">
                        <i class="fas fa-calendar me-1"></i>
                        Created: ${this.formatDate(complaint.created_at)}
                        ${complaint.updated_at !== complaint.created_at ? `
                            <br><i class="fas fa-edit me-1"></i>
                            Updated: ${this.formatDate(complaint.updated_at)}
                        ` : ''}
                    </p>
                    <hr>
                    <h6>Description:</h6>
                    <p class="text-justify">${complaint.description}</p>
                    
                    ${complaint.attachments && complaint.attachments.length > 0 ? `
                        <h6>Attachments:</h6>
                        <div class="row">
                            ${complaint.attachments.map(attachment => `
                                <div class="col-md-4 mb-2">
                                    <div class="card">
                                        <div class="card-body text-center">
                                            <i class="fas fa-file fa-2x mb-2"></i>
                                            <p class="card-text small">${attachment.filename}</p>
                                            <a href="${attachment.url}" class="btn btn-sm btn-outline-primary" target="_blank">
                                                <i class="fas fa-download me-1"></i>Download
                                            </a>
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
                            <p><strong>Email:</strong> ${complaint.email}</p>
                            <p><strong>Status:</strong> 
                                <span class="badge badge-status-${complaint.status}">
                                    ${complaint.status.replace('_', ' ')}
                                </span>
                            </p>
                            <p><strong>Priority:</strong> 
                                <span class="badge badge-priority-${complaint.priority}">
                                    ${complaint.priority}
                                </span>
                            </p>
                            <p><strong>Category:</strong> ${complaint.category}</p>
                        </div>
                    </div>
                    
                    ${complaint.statusHistory && complaint.statusHistory.length > 0 ? `
                        <div class="card mt-3">
                            <div class="card-header">
                                <h6 class="mb-0">Status History</h6>
                            </div>
                            <div class="card-body">
                                <div class="status-timeline">
                                    ${complaint.statusHistory.map(history => `
                                        <div class="status-timeline-item ${history.status === complaint.status ? 'current' : 'completed'}">
                                            <div class="d-flex justify-content-between">
                                                <span class="fw-bold">${history.status.replace('_', ' ')}</span>
                                                <small class="text-muted">${this.formatDate(history.created_at)}</small>
                                            </div>
                                            ${history.comment ? `<p class="small text-muted mb-0">${history.comment}</p>` : ''}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        this.currentComplaintId = complaint.id;
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    async editComplaint(id) {
        try {
            this.showLoading(true);
            const complaint = await api.getComplaint(id);
            this.showEditComplaintModal(complaint);
        } catch (error) {
            console.error('Error loading complaint for edit:', error);
            app.showToast(api.handleError(error), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showEditComplaintModal(complaint) {
        // This would open an edit modal similar to the new complaint form
        // but pre-populated with the complaint data
        app.showToast('Edit functionality coming soon!', 'info');
    }

    async updateStatus(id) {
        this.currentComplaintId = id;
        const modal = document.getElementById('statusUpdateModal');
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    async deleteComplaint(id) {
        if (!confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
            return;
        }

        try {
            this.showLoading(true);
            await api.deleteComplaint(id);
            app.showToast('Complaint deleted successfully!', 'success');
            this.loadComplaints();
        } catch (error) {
            console.error('Error deleting complaint:', error);
            app.showToast(api.handleError(error), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    toggleSelectAll(checked) {
        document.querySelectorAll('.complaint-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updateBulkActions();
    }

    updateBulkActions() {
        const selectedCheckboxes = document.querySelectorAll('.complaint-checkbox:checked');
        const bulkActionContainer = document.getElementById('bulkActionContainer');
        
        if (bulkActionContainer) {
            if (selectedCheckboxes.length > 0) {
                bulkActionContainer.classList.remove('d-none');
            } else {
                bulkActionContainer.classList.add('d-none');
            }
        }
    }

    async executeBulkAction(action) {
        const selectedCheckboxes = document.querySelectorAll('.complaint-checkbox:checked');
        const selectedIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));

        if (selectedIds.length === 0) {
            app.showToast('Please select complaints to perform bulk action', 'warning');
            return;
        }

        try {
            this.showLoading(true);
            
            switch (action) {
                case 'delete':
                    await this.bulkDelete(selectedIds);
                    break;
                case 'update_status':
                    await this.bulkUpdateStatus(selectedIds);
                    break;
                case 'export':
                    await this.bulkExport(selectedIds);
                    break;
                default:
                    app.showToast('Unknown bulk action', 'error');
            }
        } catch (error) {
            console.error('Error executing bulk action:', error);
            app.showToast(api.handleError(error), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async bulkDelete(ids) {
        if (!confirm(`Are you sure you want to delete ${ids.length} complaint(s)?`)) {
            return;
        }

        const promises = ids.map(id => api.deleteComplaint(id));
        await Promise.all(promises);
        
        app.showToast(`${ids.length} complaint(s) deleted successfully!`, 'success');
        this.loadComplaints();
    }

    async bulkUpdateStatus(ids) {
        const newStatus = prompt('Enter new status (open, in_progress, resolved, closed):');
        if (!newStatus) return;

        const promises = ids.map(id => api.updateComplaintStatus(id, newStatus));
        await Promise.all(promises);
        
        app.showToast(`Status updated for ${ids.length} complaint(s)!`, 'success');
        this.loadComplaints();
    }

    async bulkExport(ids) {
        try {
            const response = await api.exportComplaints('csv', { ids });
            
            const blob = new Blob([response], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `complaints-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            app.showToast('Complaints exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting complaints:', error);
            app.showToast('Error exporting complaints', 'error');
        }
    }

    showLoading(show) {
        const loadingElement = document.getElementById('complaintsLoading');
        if (loadingElement) {
            if (show) {
                loadingElement.classList.remove('d-none');
            } else {
                loadingElement.classList.add('d-none');
            }
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor(diffInHours * 60);
            return `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            const diffInHoursRounded = Math.floor(diffInHours);
            return `${diffInHoursRounded}h ago`;
        } else if (diffInHours < 168) { // 7 days
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
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

// Create global complaints manager instance
const complaintsManager = new ComplaintsManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComplaintsManager;
}
