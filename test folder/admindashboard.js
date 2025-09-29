/* =============================== 
   ADMIN DASHBOARD CONTROLLER
=============================== */

class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.isSidebarOpen = window.innerWidth > 1024;
        this.complaints = [];
        this.users = [];
        this.stats = {};
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.showSection('dashboard');
        
        // Initial responsive check
        this.handleResize();
        
        console.log('🚀 Admin Dashboard initialized successfully');
    }

    /* =============================== 
       EVENT LISTENERS
    =============================== */
    setupEventListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                if (section) {
                    this.showSection(section);
                }
            });
        });

        // Mobile menu toggle
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Sidebar toggle
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Profile dropdown
        const profileBtn = document.querySelector('.profile-btn');
        const dropdownMenu = document.querySelector('.dropdown-menu');
        
        if (profileBtn && dropdownMenu) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                dropdownMenu.classList.remove('show');
            });

            dropdownMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // Dropdown items
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = item.getAttribute('data-action');
                this.handleDropdownAction(action);
            });
        });

        // Search functionality
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Quick action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.getAttribute('data-action');
                if (action) {
                    this.handleQuickAction(action);
                }
            });
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Filter and sort functionality
        this.setupTableFilters();
        
        // Refresh data every 30 seconds
        setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.loadDashboardData();
            }
        }, 30000);
    }

    /* =============================== 
       NAVIGATION MANAGEMENT
    =============================== */
    showSection(sectionName) {
        console.log(`📋 Switching to section: ${sectionName}`);

        // Update current section
        this.currentSection = sectionName;

        // Hide all content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.updateBreadcrumb(sectionName);
        } else {
            console.warn(`⚠️ Section not found: ${sectionName}`);
            this.createSectionContent(sectionName);
        }

        // Update navigation active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`)?.closest('.nav-item');
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Load section-specific data
        this.loadSectionData(sectionName);

        // Close sidebar on mobile after navigation
        if (window.innerWidth <= 1024) {
            this.closeSidebar();
        }

        // Update page title
        this.updatePageTitle(sectionName);
    }

    createSectionContent(sectionName) {
        const contentWrapper = document.querySelector('.content-wrapper');
        if (!contentWrapper) return;

        // Remove existing section if it exists
        const existingSection = document.getElementById(`${sectionName}-section`);
        if (existingSection) {
            existingSection.remove();
        }

        // Create new section
        const section = document.createElement('div');
        section.id = `${sectionName}-section`;
        section.className = 'content-section active';

        // Generate content based on section type
        switch (sectionName) {
            case 'dashboard':
                section.innerHTML = this.generateDashboardContent();
                break;
            case 'complaints':
                section.innerHTML = this.generateComplaintsContent();
                break;
            case 'users':
                section.innerHTML = this.generateUsersContent();
                break;
            case 'analytics':
                section.innerHTML = this.generateAnalyticsContent();
                break;
            case 'settings':
                section.innerHTML = this.generateSettingsContent();
                break;
            default:
                section.innerHTML = this.generateDefaultContent(sectionName);
        }

        contentWrapper.appendChild(section);
        
        // Setup section-specific event listeners
        this.setupSectionEventListeners(sectionName);

        console.log(`✅ Created section: ${sectionName}`);
    }

    /* =============================== 
       CONTENT GENERATORS
    =============================== */
    generateDashboardContent() {
        return `
            <div class="section-header">
                <h1 class="section-title">
                    <i class="fas fa-chart-line"></i>
                    Dashboard Overview
                </h1>
                <p class="section-subtitle">Welcome back! Here's what's happening with your complaints system.</p>
            </div>

            <!-- Stats Grid -->
            <div class="stats-grid">
                <div class="stat-card primary">
                    <div class="stat-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number" id="pending-count">-</div>
                        <div class="stat-label">Pending Complaints</div>
                        <div class="stat-change positive">
                            <i class="fas fa-arrow-up"></i>
                            <span>+12% from last week</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card info">
                    <div class="stat-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number" id="inprogress-count">-</div>
                        <div class="stat-label">In Progress</div>
                        <div class="stat-change positive">
                            <i class="fas fa-arrow-up"></i>
                            <span>+8% from last week</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card success">
                    <div class="stat-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number" id="resolved-count">-</div>
                        <div class="stat-label">Resolved</div>
                        <div class="stat-change positive">
                            <i class="fas fa-arrow-up"></i>
                            <span>+24% from last week</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card warning">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number" id="total-users">-</div>
                        <div class="stat-label">Total Users</div>
                        <div class="stat-change positive">
                            <i class="fas fa-arrow-up"></i>
                            <span>+5% from last week</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
                <h3 class="subsection-title">
                    <i class="fas fa-bolt"></i>
                    Quick Actions
                </h3>
                <div class="action-grid">
                    <button class="action-btn primary" data-action="view-complaints">
                        <i class="fas fa-list"></i>
                        <span>View All Complaints</span>
                    </button>
                    <button class="action-btn secondary" data-action="add-user">
                        <i class="fas fa-user-plus"></i>
                        <span>Add New User</span>
                    </button>
                    <button class="action-btn tertiary" data-action="generate-report">
                        <i class="fas fa-chart-bar"></i>
                        <span>Generate Report</span>
                    </button>
                    <button class="action-btn quaternary" data-action="system-settings">
                        <i class="fas fa-cog"></i>
                        <span>System Settings</span>
                    </button>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="recent-activity">
                <div class="section-header">
                    <h3 class="subsection-title">
                        <i class="fas fa-history"></i>
                        Recent Complaints
                    </h3>
                    <button class="table-btn" data-action="view-all-complaints">
                        <i class="fas fa-eye"></i>
                        View All
                    </button>
                </div>
                <div class="table-container">
                    <div class="table-loading" id="dashboard-table-loading">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                        </div>
                        <p>Loading recent complaints...</p>
                    </div>
                    <div class="table-empty" id="dashboard-table-empty" style="display: none;">
                        <div class="empty-illustration">
                            <i class="fas fa-inbox"></i>
                        </div>
                        <h3>No Recent Complaints</h3>
                        <p>There are no complaints to display at the moment.</p>
                    </div>
                    <table class="modern-table" id="dashboard-complaints-table" style="display: none;">
                        <thead>
                            <tr>
                                <th>Ticket ID</th>
                                <th>Student</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="dashboard-complaints-tbody">
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    generateComplaintsContent() {
        return `
            <div class="section-header">
                <h1 class="section-title">
                    <i class="fas fa-exclamation-triangle"></i>
                    Complaints Management
                </h1>
                <p class="section-subtitle">Manage and track all student complaints in the system.</p>
            </div>

            <!-- Filter Bar -->
            <div class="filter-bar">
                <div class="filter-group">
                    <label class="filter-label">Status:</label>
                    <select class="filter-select" id="status-filter">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Type:</label>
                    <select class="filter-select" id="type-filter">
                        <option value="">All Types</option>
                        <option value="academic">Academic</option>
                        <option value="technical">Technical</option>
                        <option value="administrative">Administrative</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Priority:</label>
                    <select class="filter-select" id="priority-filter">
                        <option value="">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                <button class="filter-btn" data-action="apply-filters">
                    <i class="fas fa-filter"></i>
                    Apply Filters
                </button>
                <button class="filter-btn" data-action="clear-filters">
                    <i class="fas fa-times"></i>
                    Clear
                </button>
            </div>

            <!-- Complaints Table -->
            <div class="table-container">
                <div class="table-header">
                    <h3>All Complaints</h3>
                    <div class="table-actions">
                        <button class="table-btn" data-action="export-complaints">
                            <i class="fas fa-download"></i>
                            Export
                        </button>
                        <button class="table-btn" data-action="refresh-complaints">
                            <i class="fas fa-sync-alt"></i>
                            Refresh
                        </button>
                    </div>
                </div>
                
                <div class="table-loading" id="complaints-table-loading">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                    </div>
                    <p>Loading complaints...</p>
                </div>

                <div class="table-empty" id="complaints-table-empty" style="display: none;">
                    <div class="empty-illustration">
                        <i class="fas fa-inbox"></i>
                    </div>
                    <h3>No Complaints Found</h3>
                    <p>No complaints match your current filters.</p>
                </div>

                <table class="modern-table" id="complaints-table" style="display: none;">
                    <thead>
                        <tr>
                            <th>
                                <input type="checkbox" class="table-checkbox" id="select-all-complaints">
                            </th>
                            <th>Ticket ID</th>
                            <th>Student Info</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Date Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="complaints-tbody">
                    </tbody>
                </table>

                <div class="pagination-container" id="complaints-pagination" style="display: none;">
                    <div class="pagination-info">
                        Showing <span id="complaints-showing">0</span> of <span id="complaints-total">0</span> complaints
                    </div>
                    <div class="pagination-controls">
                        <button class="pagination-btn" id="complaints-prev" disabled>
                            <i class="fas fa-chevron-left"></i>
                            Previous
                        </button>
                        <div class="pagination-numbers" id="complaints-page-numbers">
                        </div>
                        <button class="pagination-btn" id="complaints-next">
                            Next
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    generateUsersContent() {
        return `
            <div class="section-header">
                <h1 class="section-title">
                    <i class="fas fa-users"></i>
                    User Management
                </h1>
                <p class="section-subtitle">Manage student and admin accounts in the system.</p>
            </div>

            <!-- User Stats -->
            <div class="stats-grid">
                <div class="stat-card primary">
                    <div class="stat-icon">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number" id="students-count">-</div>
                        <div class="stat-label">Total Students</div>
                    </div>
                </div>

                <div class="stat-card warning">
                    <div class="stat-icon">
                        <i class="fas fa-user-shield"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number" id="admins-count">-</div>
                        <div class="stat-label">Admin Users</div>
                    </div>
                </div>

                <div class="stat-card success">
                    <div class="stat-icon">
                        <i class="fas fa-user-check"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number" id="active-users">-</div>
                        <div class="stat-label">Active Users</div>
                    </div>
                </div>

                <div class="stat-card info">
                    <div class="stat-icon">
                        <i class="fas fa-user-plus"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-number" id="new-users">-</div>
                        <div class="stat-label">New This Month</div>
                    </div>
                </div>
            </div>

            <!-- Filter Bar -->
            <div class="filter-bar">
                <div class="filter-group">
                    <label class="filter-label">Role:</label>
                    <select class="filter-select" id="role-filter">
                        <option value="">All Roles</option>
                        <option value="student">Students</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Status:</label>
                    <select class="filter-select" id="user-status-filter">
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <button class="filter-btn" data-action="add-new-user">
                    <i class="fas fa-user-plus"></i>
                    Add New User
                </button>
            </div>

            <!-- Users Table -->
            <div class="table-container">
                <div class="table-header">
                    <h3>All Users</h3>
                    <div class="table-actions">
                        <button class="table-btn" data-action="export-users">
                            <i class="fas fa-download"></i>
                            Export
                        </button>
                        <button class="table-btn" data-action="refresh-users">
                            <i class="fas fa-sync-alt"></i>
                            Refresh
                        </button>
                    </div>
                </div>

                <div class="table-loading" id="users-table-loading">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                    </div>
                    <p>Loading users...</p>
                </div>

                <table class="modern-table" id="users-table" style="display: none;">
                    <thead>
                        <tr>
                            <th>
                                <input type="checkbox" class="table-checkbox" id="select-all-users">
                            </th>
                            <th>ID</th>
                            <th>User Info</th>
                            <th>Role</th>
                            <th>Registration</th>
                            <th>Last Login</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="users-tbody">
                    </tbody>
                </table>
            </div>
        `;
    }

    generateAnalyticsContent() {
        return `
            <div class="section-header">
                <h1 class="section-title">
                    <i class="fas fa-chart-bar"></i>
                    Analytics & Reports
                </h1>
                <p class="section-subtitle">Detailed insights and analytics for your complaint management system.</p>
            </div>

            <!-- Time Range Selector -->
            <div class="filter-bar">
                <div class="filter-group">
                    <label class="filter-label">Time Range:</label>
                    <select class="filter-select" id="time-range">
                        <option value="7">Last 7 days</option>
                        <option value="30" selected>Last 30 days</option>
                        <option value="90">Last 3 months</option>
                        <option value="365">Last year</option>
                    </select>
                </div>
                <button class="filter-btn" data-action="generate-report">
                    <i class="fas fa-file-pdf"></i>
                    Generate Report
                </button>
            </div>

            <!-- Charts Grid -->
            <div class="charts-grid">
                <div class="chart-card">
                    <div class="chart-header">
                        <h3>Complaints Trend</h3>
                        <div class="chart-actions">
                            <button class="table-btn" data-action="export-chart">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-container">
                        <canvas id="complaints-trend-chart"></canvas>
                    </div>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <h3>Status Distribution</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="status-distribution-chart"></canvas>
                    </div>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <h3>Complaint Types</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="types-chart"></canvas>
                    </div>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <h3>Resolution Time</h3>
                    </div>
                    <div class="chart-container">
                        <canvas id="resolution-time-chart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Analytics Summary -->
            <div class="analytics-summary">
                <h3 class="subsection-title">Key Metrics</h3>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="avg-resolution-time">-</div>
                            <div class="metric-label">Avg. Resolution Time</div>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="resolution-rate">-</div>
                            <div class="metric-label">Resolution Rate</div>
                        </div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-icon">
                            <i class="fas fa-star"></i>
                        </div>
                        <div class="metric-content">
                            <div class="metric-value" id="satisfaction-score">-</div>
                            <div class="metric-label">Satisfaction Score</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateSettingsContent() {
        return `
            <div class="section-header">
                <h1 class="section-title">
                    <i class="fas fa-cog"></i>
                    System Settings
                </h1>
                <p class="section-subtitle">Configure system preferences and administrative settings.</p>
            </div>

            <!-- Settings Tabs -->
            <div class="settings-tabs">
                <button class="tab-btn active" data-tab="general">
                    <i class="fas fa-sliders-h"></i>
                    General
                </button>
                <button class="tab-btn" data-tab="notifications">
                    <i class="fas fa-bell"></i>
                    Notifications
                </button>
                <button class="tab-btn" data-tab="security">
                    <i class="fas fa-shield-alt"></i>
                    Security
                </button>
                <button class="tab-btn" data-tab="backup">
                    <i class="fas fa-database"></i>
                    Backup
                </button>
            </div>

            <!-- General Settings -->
            <div class="settings-panel active" id="general-panel">
                <div class="settings-section">
                    <h3>System Configuration</h3>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <label>System Name</label>
                            <input type="text" class="setting-input" value="NACOS Complaint System">
                        </div>
                        <div class="setting-item">
                            <label>Default Language</label>
                            <select class="setting-select">
                                <option value="en">English</option>
                                <option value="fr">French</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <label>Timezone</label>
                            <select class="setting-select">
                                <option value="UTC">UTC</option>
                                <option value="WAT">West Africa Time</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <label>Auto-assign Complaints</label>
                            <div class="toggle-switch">
                                <input type="checkbox" id="auto-assign" checked>
                                <label for="auto-assign"></label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Notification Settings -->
            <div class="settings-panel" id="notifications-panel">
                <div class="settings-section">
                    <h3>Email Notifications</h3>
                    <div class="settings-grid">
                        <div class="setting-item">
                            <label>New Complaint Notifications</label>
                            <div class="toggle-switch">
                                <input type="checkbox" id="new-complaint-email" checked>
                                <label for="new-complaint-email"></label>
                            </div>
                        </div>
                        <div class="setting-item">
                            <label>Status Update Notifications</label>
                            <div class="toggle-switch">
                                <input type="checkbox" id="status-update-email" checked>
                                <label for="status-update-email"></label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Save Button -->
            <div class="settings-actions">
                <button class="btn-primary" data-action="save-settings">
                    <i class="fas fa-save"></i>
                    Save Settings
                </button>
                <button class="btn-secondary" data-action="reset-settings">
                    <i class="fas fa-undo"></i>
                    Reset to Default
                </button>
            </div>
        `;
    }

    generateDefaultContent(sectionName) {
        return `
            <div class="section-header">
                <h1 class="section-title">
                    <i class="fas fa-cube"></i>
                    ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}
                </h1>
                <p class="section-subtitle">This section is under development.</p>
            </div>

            <div class="empty-state">
                <div class="empty-illustration">
                    <i class="fas fa-hammer"></i>
                </div>
                <h3>Coming Soon</h3>
                <p>This feature is currently being developed and will be available soon.</p>
            </div>
        `;
    }

    /* =============================== 
       SIDEBAR MANAGEMENT
    =============================== */
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            if (window.innerWidth <= 1024) {
                // Mobile: Toggle visibility
                sidebar.classList.toggle('active');
                this.isSidebarOpen = sidebar.classList.contains('active');
            } else {
                // Desktop: Toggle collapsed state
                sidebar.classList.toggle('collapsed');
                this.isSidebarOpen = !sidebar.classList.contains('collapsed');
            }
        }
    }

    closeSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && window.innerWidth <= 1024) {
            sidebar.classList.remove('active');
            this.isSidebarOpen = false;
        }
    }

    handleResize() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        if (window.innerWidth <= 1024) {
            // Mobile: Hide sidebar by default
            sidebar.classList.remove('collapsed');
            if (!this.isSidebarOpen) {
                sidebar.classList.remove('active');
            }
        } else {
            // Desktop: Show sidebar
            sidebar.classList.remove('active');
            if (!this.isSidebarOpen) {
                sidebar.classList.add('collapsed');
            }
        }
    }

    /* =============================== 
       DATA LOADING
    =============================== */
    async loadDashboardData() {
        try {
            console.log('📊 Loading dashboard data...');
            
            // Show loading state
            this.showLoadingState('dashboard');

            // Simulate API calls (replace with actual API endpoints)
            const [complaintsData, usersData, statsData] = await Promise.all([
                this.fetchComplaints(),
                this.fetchUsers(),
                this.fetchStats()
            ]);

            this.complaints = complaintsData;
            this.users = usersData;
            this.stats = statsData;

            // Update dashboard statistics
            this.updateDashboardStats();
            
            // Update recent complaints table
            this.updateDashboardTable();

            console.log('✅ Dashboard data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            this.showErrorState('dashboard', 'Failed to load dashboard data');
        }
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'complaints':
                await this.loadComplaintsData();
                break;
            case 'users':
                await this.loadUsersData();
                break;
            case 'analytics':
                await this.loadAnalyticsData();
                break;
            default:
                console.log(`📋 No specific data loading required for ${sectionName}`);
        }
    }

    async loadComplaintsData() {
        try {
            console.log('📋 Loading complaints data...');
            this.showLoadingState('complaints');
            
            const complaints = await this.fetchComplaints();
            this.complaints = complaints;
            
            this.updateComplaintsTable();
            console.log('✅ Complaints data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading complaints:', error);
            this.showErrorState('complaints', 'Failed to load complaints');
        }
    }

    async loadUsersData() {
        try {
            console.log('👥 Loading users data...');
            this.showLoadingState('users');
            
            const users = await this.fetchUsers();
            this.users = users;
            
            this.updateUsersTable();
            this.updateUserStats();
            console.log('✅ Users data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading users:', error);
            this.showErrorState('users', 'Failed to load users');
        }
    }

    async loadAnalyticsData() {
        try {
            console.log('📊 Loading analytics data...');
            
            const analyticsData = await this.fetchAnalytics();
            this.updateAnalyticsCharts(analyticsData);
            
            console.log('✅ Analytics data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading analytics:', error);
        }
    }

    /* =============================== 
       API CALLS (Mock Data)
    =============================== */
    async fetchComplaints() {
        // Simulate API delay
        await this.delay(1000);
        
        // Mock data - replace with actual API call
        return [
            {
                id: 1,
                ticketNumber: 'NACOS-000001',
                studentName: 'John Doe',
                regNumber: 'CS/2020/001',
                email: 'john.doe@example.com',
                type: 'Academic',
                description: 'Unable to access course materials online',
                status: 'pending',
                priority: 'medium',
                createdAt: new Date('2024-01-15').toISOString(),
                updatedAt: new Date('2024-01-15').toISOString()
            },
            {
                id: 2,
                ticketNumber: 'NACOS-000002',
                studentName: 'Jane Smith',
                regNumber: 'CS/2020/002',
                email: 'jane.smith@example.com',
                type: 'Technical',
                description: 'Password reset not working',
                status: 'in_progress',
                priority: 'high',
                createdAt: new Date('2024-01-14').toISOString(),
                updatedAt: new Date('2024-01-16').toISOString()
            },
            {
                id: 3,
                ticketNumber: 'NACOS-000003',
                studentName: 'Mike Johnson',
                regNumber: 'CS/2020/003',
                email: 'mike.johnson@example.com',
                type: 'Administrative',
                description: 'Transcript request delay',
                status: 'resolved',
                priority: 'low',
                createdAt: new Date('2024-01-13').toISOString(),
                updatedAt: new Date('2024-01-17').toISOString()
            }
        ];
    }

    async fetchUsers() {
        await this.delay(800);
        
        return [
            {
                id: 1,
                username: 'johndoe',
                email: 'john.doe@example.com',
                firstName: 'John',
                lastName: 'Doe',
                regNumber: 'CS/2020/001',
                role: 'student',
                status: 'active',
                createdAt: new Date('2024-01-01').toISOString(),
                lastLogin: new Date('2024-01-15').toISOString()
            },
            {
                id: 2,
                username: 'admin',
                email: 'admin@nacos.com',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                status: 'active',
                createdAt: new Date('2023-12-01').toISOString(),
                lastLogin: new Date('2024-01-16').toISOString()
            }
        ];
    }

    async fetchStats() {
        await this.delay(500);
        
        return {
            totalComplaints: 156,
            pendingComplaints: 23,
            inProgressComplaints: 12,
            resolvedComplaints: 121,
            totalUsers: 89,
            totalStudents: 87,
            totalAdmins: 2,
            activeUsers: 78,
            newUsersThisMonth: 12
        };
    }

    async fetchAnalytics() {
        await this.delay(1200);
        
        return {
            complaintsOverTime: [
                { date: '2024-01-01', count: 5 },
                { date: '2024-01-02', count: 8 },
                { date: '2024-01-03', count: 12 },
                { date: '2024-01-04', count: 6 },
                { date: '2024-01-05', count: 9 }
            ],
            statusDistribution: {
                pending: 23,
                in_progress: 12,
                resolved: 121,
                closed: 0
            },
            typeDistribution: {
                academic: 45,
                technical: 32,
                administrative: 28,
                other: 51
            }
        };
    }

    /* =============================== 
       UI UPDATES
    =============================== */
    updateDashboardStats() {
        const stats = this.stats;
        
        // Update stat numbers
        this.updateElement('pending-count', stats.pendingComplaints || 0);
        this.updateElement('inprogress-count', stats.inProgressComplaints || 0);
        this.updateElement('resolved-count', stats.resolvedComplaints || 0);
        this.updateElement('total-users', stats.totalUsers || 0);
    }

    updateUserStats() {
        const stats = this.stats;
        
        this.updateElement('students-count', stats.totalStudents || 0);
        this.updateElement('admins-count', stats.totalAdmins || 0);
        this.updateElement('active-users', stats.activeUsers || 0);
        this.updateElement('new-users', stats.newUsersThisMonth || 0);
    }

    updateDashboardTable() {
        const tbody = document.getElementById('dashboard-complaints-tbody');
        const table = document.getElementById('dashboard-complaints-table');
        const loading = document.getElementById('dashboard-table-loading');
        const empty = document.getElementById('dashboard-table-empty');

        if (!tbody) return;

        // Hide loading
        if (loading) loading.style.display = 'none';

        if (this.complaints.length === 0) {
            if (empty) empty.style.display = 'flex';
            if (table) table.style.display = 'none';
            return;
        }

        // Show table
        if (empty) empty.style.display = 'none';
        if (table) table.style.display = 'table';

        // Clear existing rows
        tbody.innerHTML = '';

        // Add recent complaints (limit to 5)
        const recentComplaints = this.complaints.slice(0, 5);
        
        recentComplaints.forEach(complaint => {
            const row = this.createComplaintRow(complaint);
            tbody.appendChild(row);
        });
    }

    updateComplaintsTable() {
        const tbody = document.getElementById('complaints-tbody');
        const table = document.getElementById('complaints-table');
        const loading = document.getElementById('complaints-table-loading');
        const empty = document.getElementById('complaints-table-empty');

        if (!tbody) return;

        // Hide loading
        if (loading) loading.style.display = 'none';

        if (this.complaints.length === 0) {
            if (empty) empty.style.display = 'flex';
            if (table) table.style.display = 'none';
            return;
        }

        // Show table
        if (empty) empty.style.display = 'none';
        if (table) table.style.display = 'table';

        // Clear and populate
        tbody.innerHTML = '';
        this.complaints.forEach(complaint => {
            const row = this.createComplaintRow(complaint, true);
            tbody.appendChild(row);
        });
    }

    updateUsersTable() {
        const tbody = document.getElementById('users-tbody');
        const table = document.getElementById('users-table');
        const loading = document.getElementById('users-table-loading');

        if (!tbody) return;

        // Hide loading
        if (loading) loading.style.display = 'none';
        if (table) table.style.display = 'table';

        // Clear and populate
        tbody.innerHTML = '';
        this.users.forEach(user => {
            const row = this.createUserRow(user);
            tbody.appendChild(row);
        });
    }

    createComplaintRow(complaint, includeCheckbox = false) {
        const row = document.createElement('tr');
        row.innerHTML = `
            ${includeCheckbox ? '<td><input type="checkbox" class="table-checkbox"></td>' : ''}
            <td><strong>${complaint.ticketNumber}</strong></td>
            <td>
                <div class="user-info">
                    <div class="user-name">${complaint.studentName}</div>
                    <div class="user-email">${complaint.regNumber}</div>
                </div>
            </td>
            <td><span class="type-badge">${complaint.type}</span></td>
            ${includeCheckbox ? `<td class="description-cell">${this.truncateText(complaint.description, 50)}</td>` : ''}
            <td><span class="status-badge ${complaint.status}">${this.formatStatus(complaint.status)}</span></td>
            <td><span class="priority-badge ${complaint.priority}">${complaint.priority}</span></td>
            <td>${this.formatDate(complaint.createdAt)}</td>
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
        
        return row;
    }

    createUserRow(user) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="table-checkbox"></td>
            <td><strong>#${user.id}</strong></td>
            <td>
                <div class="user-info">
                    <div class="user-name">${user.firstName} ${user.lastName}</div>
                    <div class="user-email">${user.email}</div>
                    ${user.regNumber ? `<div class="user-regno">${user.regNumber}</div>` : ''}
                </div>
            </td>
            <td><span class="role-badge ${user.role}">${user.role}</span></td>
            <td>${this.formatDate(user.createdAt)}</td>
            <td>${user.lastLogin ? this.formatDate(user.lastLogin) : 'Never'}</td>
            <td><span class="status-badge ${user.status}">${user.status}</span></td>
            <td>
                <div class="table-actions">
                    <button class="action-icon view" title="View Profile" data-action="view-user" data-id="${user.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-icon edit" title="Edit User" data-action="edit-user" data-id="${user.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-icon delete" title="Delete User" data-action="delete-user" data-id="${user.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        return row;
    }

    /* =============================== 
       EVENT HANDLERS
    =============================== */
    setupSectionEventListeners(sectionName) {
        // Setup action buttons
        document.querySelectorAll(`#${sectionName}-section .action-btn`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.getAttribute('data-action');
                this.handleSectionAction(sectionName, action, btn);
            });
        });

        // Setup table action buttons
        document.querySelectorAll(`#${sectionName}-section .action-icon`).forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const action = btn.getAttribute('data-action');
                const id = btn.getAttribute('data-id');
                this.handleTableAction(action, id);
            });
        });

        // Setup filters
        if (sectionName === 'complaints') {
            this.setupComplaintFilters();
        }
    }

    setupTableFilters() {
        // This will be called when filters are set up
        console.log('🔍 Setting up table filters...');
    }

    setupComplaintFilters() {
        const statusFilter = document.getElementById('status-filter');
        const typeFilter = document.getElementById('type-filter');
        const priorityFilter = document.getElementById('priority-filter');

        [statusFilter, typeFilter, priorityFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => {
                    this.applyComplaintFilters();
                });
            }
        });
    }

    applyComplaintFilters() {
        const statusFilter = document.getElementById('status-filter')?.value || '';
        const typeFilter = document.getElementById('type-filter')?.value || '';
        const priorityFilter = document.getElementById('priority-filter')?.value || '';

        let filteredComplaints = [...this.complaints];

        if (statusFilter) {
            filteredComplaints = filteredComplaints.filter(c => c.status === statusFilter);
        }
        if (typeFilter) {
            filteredComplaints = filteredComplaints.filter(c => c.type.toLowerCase() === typeFilter);
        }
        if (priorityFilter) {
            filteredComplaints = filteredComplaints.filter(c => c.priority === priorityFilter);
        }

        // Update table with filtered data
        this.updateComplaintsTableWithData(filteredComplaints);
    }

    updateComplaintsTableWithData(data) {
        const tbody = document.getElementById('complaints-tbody');
        const table = document.getElementById('complaints-table');
        const empty = document.getElementById('complaints-table-empty');

        if (!tbody) return;

        if (data.length === 0) {
            if (empty) empty.style.display = 'flex';
            if (table) table.style.display = 'none';
            return;
        }

        if (empty) empty.style.display = 'none';
        if (table) table.style.display = 'table';

        tbody.innerHTML = '';
        data.forEach(complaint => {
            const row = this.createComplaintRow(complaint, true);
            tbody.appendChild(row);
        });
    }

    handleQuickAction(action) {
        console.log(`⚡ Quick action: ${action}`);
        
        switch (action) {
            case 'view-complaints':
                this.showSection('complaints');
                break;
            case 'add-user':
                this.showAddUserModal();
                break;
            case 'generate-report':
                this.generateReport();
                break;
            case 'system-settings':
                this.showSection('settings');
                break;
            default:
                this.showNotification(`Action "${action}" clicked`, 'info');
        }
    }

    handleSectionAction(section, action, element) {
        console.log(`🎯 Section action: ${section} -> ${action}`);
        
        switch (action) {
            case 'refresh-complaints':
                this.loadComplaintsData();
                break;
            case 'refresh-users':
                this.loadUsersData();
                break;
            case 'export-complaints':
                this.exportData('complaints');
                break;
            case 'export-users':
                this.exportData('users');
                break;
            case 'apply-filters':
                this.applyComplaintFilters();
                break;
            case 'clear-filters':
                this.clearFilters();
                break;
            default:
                this.showNotification(`${action} feature coming soon!`, 'info');
        }
    }

    handleTableAction(action, id) {
        console.log(`📋 Table action: ${action} for ID: ${id}`);
        
        switch (action) {
            case 'view-complaint':
                this.showComplaintDetails(id);
                break;
            case 'edit-complaint':
                this.showEditComplaintModal(id);
                break;
            case 'delete-complaint':
                this.confirmDeleteComplaint(id);
                break;
            case 'view-user':
                this.showUserDetails(id);
                break;
            case 'edit-user':
                this.showEditUserModal(id);
                break;
            case 'delete-user':
                this.confirmDeleteUser(id);
                break;
            default:
                this.showNotification(`${action} feature coming soon!`, 'info');
        }
    }

    handleDropdownAction(action) {
        console.log(`📤 Dropdown action: ${action}`);
        
        switch (action) {
            case 'profile':
                this.showProfile();
                break;
            case 'settings':
                this.showSection('settings');
                break;
            case 'logout':
                this.handleLogout();
                break;
            default:
                this.showNotification(`${action} feature coming soon!`, 'info');
        }
    }

    handleSearch(query) {
        console.log(`🔍 Search query: ${query}`);
        
        if (query.length < 2) return;
        
        // Implement search logic based on current section
        switch (this.currentSection) {
            case 'complaints':
                this.searchComplaints(query);
                break;
            case 'users':
                this.searchUsers(query);
                break;
            default:
                console.log('Search not implemented for this section');
        }
    }

    /* =============================== 
       UTILITY FUNCTIONS
    =============================== */
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    updateBreadcrumb(section) {
        const breadcrumb = document.querySelector('.breadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = `
                <span class="breadcrumb-item">
                    <i class="fas fa-home"></i>
                    Dashboard
                </span>
                <i class="fas fa-chevron-right"></i>
                <span class="breadcrumb-item active">${this.formatSectionName(section)}</span>
            `;
        }
    }

    updatePageTitle(section) {
        document.title = `${this.formatSectionName(section)} - NACOS Admin`;
    }

    formatSectionName(section) {
        return section.charAt(0).toUpperCase() + section.slice(1);
    }

    formatStatus(status) {
        switch (status) {
            case 'in_progress':
                return 'In Progress';
            default:
                return status.charAt(0).toUpperCase() + status.slice(1);
        }
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    truncateText(text, length) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    showLoadingState(section) {
        const loading = document.getElementById(`${section}-table-loading`);
        const table = document.getElementById(`${section}-table`);
        const dashboardTable = document.getElementById(`dashboard-complaints-table`);
        
        if (loading) loading.style.display = 'flex';
        if (table) table.style.display = 'none';
        if (dashboardTable && section === 'dashboard') dashboardTable.style.display = 'none';
    }

    showErrorState(section, message) {
        console.error(`❌ ${section} error: ${message}`);
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#fee2e2' : type === 'success' ? '#d1fae5' : '#dbeafe'};
            color: ${type === 'error' ? '#dc2626' : type === 'success' ? '#059669' : '#2563eb'};
            padding: 16px 20px;
            border-radius: 12px;
            border: 1px solid ${type === 'error' ? '#fecaca' : type === 'success' ? '#a7f3d0' : '#bfdbfe'};
            box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 500;
            backdrop-filter: blur(10px);
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        console.log(`📢 Notification: ${message} (${type})`);
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /* =============================== 
       PLACEHOLDER FUNCTIONS
    =============================== */
    showComplaintDetails(id) {
        this.showNotification(`Viewing complaint details for ID: ${id}`, 'info');
    }

    showEditComplaintModal(id) {
        this.showNotification(`Edit complaint modal for ID: ${id}`, 'info');
    }

    confirmDeleteComplaint(id) {
        if (confirm('Are you sure you want to delete this complaint?')) {
            this.showNotification(`Complaint ${id} deleted successfully`, 'success');
        }
    }

    showUserDetails(id) {
        this.showNotification(`Viewing user details for ID: ${id}`, 'info');
    }

    showEditUserModal(id) {
        this.showNotification(`Edit user modal for ID: ${id}`, 'info');
    }

    confirmDeleteUser(id) {
        if (confirm('Are you sure you want to delete this user?')) {
            this.showNotification(`User ${id} deleted successfully`, 'success');
        }
    }

    showAddUserModal() {
        this.showNotification('Add user modal opening...', 'info');
    }

    generateReport() {
        this.showNotification('Generating report...', 'info');
    }

    exportData(type) {
        this.showNotification(`Exporting ${type} data...`, 'info');
    }

    clearFilters() {
        // Reset all filter selects
        document.querySelectorAll('.filter-select').forEach(select => {
            select.value = '';
        });
        
        // Reload original data
        this.updateComplaintsTableWithData(this.complaints);
        this.showNotification('Filters cleared', 'success');
    }

    searchComplaints(query) {
        const filtered = this.complaints.filter(complaint => 
            complaint.studentName.toLowerCase().includes(query.toLowerCase()) ||
            complaint.ticketNumber.toLowerCase().includes(query.toLowerCase()) ||
            complaint.description.toLowerCase().includes(query.toLowerCase())
        );
        
        this.updateComplaintsTableWithData(filtered);
    }

    searchUsers(query) {
        const filtered = this.users.filter(user => 
            user.firstName.toLowerCase().includes(query.toLowerCase()) ||
            user.lastName.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase()) ||
            (user.regNumber && user.regNumber.toLowerCase().includes(query.toLowerCase()))
        );
        
        // Update users table with filtered data (implement similar to complaints)
        console.log('Filtered users:', filtered);
    }

    showProfile() {
        this.showNotification('Profile page opening...', 'info');
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            console.log('🚪 Logging out...');
            // Implement logout logic
            window.location.href = '/login.html';
        }
    }

    updateAnalyticsCharts(data) {
        // Placeholder for chart updates
        console.log('📊 Updating analytics charts with data:', data);
        this.showNotification('Analytics charts updated', 'success');
    }
}

/* =============================== 
   INITIALIZE DASHBOARD
=============================== */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Admin Dashboard...');
    
    // Initialize the dashboard
    window.adminDashboard = new AdminDashboard();
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(300px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Admin Dashboard ready!');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboard;
}