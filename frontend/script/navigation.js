/**
 * Navigation Controller for the NACOS Complaint System
 * Manages page navigation, content loading, and UI state
 */
class NavigationController {
    constructor() {
        // Initialize properties
        this.currentSection = null;
        this.sectionCache = {};
        this.cacheTimestamps = {};  // Track when sections were cached
        this.cacheTTL = 5 * 60 * 1000;  // 5 minutes cache TTL
        this.isSidebarOpen = true;
        this.isLoading = false;
        this.sectionComponents = {}; // Registry for section components
        this.loadingTimer = null;
        
        // Initialize navigation
        this.initNavigation();
    }
    
    /**
     * Initialize navigation functionality
     */
    initNavigation() {
        document.addEventListener('DOMContentLoaded', () => {
            // Check if user is authenticated
            this.checkAuth();
            
            // Load sidebar content
            this.loadSidebar().then(() => {
                console.log('Sidebar loaded');
                
                // Initialize event listeners
                this.setupEventListeners();
                
                // Initialize loading indicator
                this.createLoadingIndicator();
                
                // Handle initial navigation
                this.handleInitialNavigation();
            }).catch(error => {
                this.handleError('Failed to load sidebar', error);
            });
        });

        // Set up error boundary at window level
        window.addEventListener('error', this.globalErrorHandler.bind(this));
        window.addEventListener('unhandledrejection', this.unhandledRejectionHandler.bind(this));
    }
    
    /**
     * Create global loading indicator
     */
    createLoadingIndicator() {
        // Create loading indicator if it doesn't exist
        let loadingEl = document.getElementById('globalLoadingIndicator');
        
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.id = 'globalLoadingIndicator';
            loadingEl.className = 'global-loading-indicator';
            loadingEl.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <p class="loading-message">Loading...</p>
            `;
            document.body.appendChild(loadingEl);
        }
    }
    
    /**
     * Show/hide global loading state with message
     */
    setLoadingState(isLoading, message = 'Loading...') {
        this.isLoading = isLoading;
        const loadingEl = document.getElementById('globalLoadingIndicator');
        
        // Clear any existing loading timer
        if (this.loadingTimer) {
            clearTimeout(this.loadingTimer);
            this.loadingTimer = null;
        }
        
        if (loadingEl) {
            const messageEl = loadingEl.querySelector('.loading-message');
            if (messageEl) {
                messageEl.textContent = message;
            }
            
            if (isLoading) {
                loadingEl.classList.add('active');
                
                // Set a timeout to hide loading indicator if it takes too long
                this.loadingTimer = setTimeout(() => {
                    this.setLoadingState(false);
                    this.showNotification('warning', 'Operation taking longer than expected');
                }, 30000); // 30 seconds timeout
            } else {
                loadingEl.classList.remove('active');
            }
        }
    }
    
    /**
     * Register a section component with initialization and cleanup functions
     */
    registerSectionComponent(sectionName, { init, cleanup, refresh }) {
        this.sectionComponents[sectionName] = { init, cleanup, refresh };
        console.log(`📦 Registered component for section: ${sectionName}`);
        return this;
    }
    
    /**
     * Initialize a section's component if registered
     */
    initSectionComponent(sectionName) {
        const component = this.sectionComponents[sectionName];
        if (component && typeof component.init === 'function') {
            try {
                component.init();
                console.log(`✅ Initialized component for ${sectionName}`);
            } catch (error) {
                this.handleError(`Failed to initialize ${sectionName} component`, error);
            }
        }
    }
    
    /**
     * Clean up a section's component if registered
     */
    cleanupSectionComponent(sectionName) {
        const component = this.sectionComponents[sectionName];
        if (component && typeof component.cleanup === 'function') {
            try {
                component.cleanup();
                console.log(`🧹 Cleaned up component for ${sectionName}`);
            } catch (error) {
                console.error(`Error cleaning up ${sectionName} component:`, error);
            }
        }
    }
    
    /**
     * Refresh a section's component if registered
     */
    refreshSectionComponent(sectionName) {
        const component = this.sectionComponents[sectionName];
        if (component && typeof component.refresh === 'function') {
            try {
                component.refresh();
                console.log(`🔄 Refreshed component for ${sectionName}`);
            } catch (error) {
                this.handleError(`Failed to refresh ${sectionName} component`, error);
            }
        }
    }
    
    /**
     * Check if user is authenticated
     */
    checkAuth() {
        const token = localStorage.getItem('authToken');
        const role = localStorage.getItem('role');
        
        if (!token || !role) {
            console.warn('🔒 User not authenticated, redirecting to login');
            window.location.href = 'index.html';
        }
    }
    
    /**
     * Load sidebar content
     */
    async loadSidebar() {
        try {
            const sidebarContainer = document.getElementById('sidebar-container');
            if (sidebarContainer) {
                const response = await fetch('./sidebar.html');
                const sidebarContent = await response.text();
                sidebarContainer.innerHTML = sidebarContent;
                
                // Set admin name in sidebar
                const adminName = localStorage.getItem('username');
                if (adminName) {
                    const adminNameElem = document.querySelector('.admin-name');
                    if (adminNameElem) {
                        adminNameElem.textContent = adminName;
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load sidebar:', error);
            throw error;
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for clicks on navigation links
        document.addEventListener('click', (event) => {
            // Navigation links
            if (event.target.closest('.nav-link')) {
                const link = event.target.closest('.nav-link');
                const section = link.getAttribute('data-section');
                
                if (section) {
                    event.preventDefault();
                    this.navigateToSection(section);
                }
            }
            
            // Mobile menu toggle
            if (event.target.closest('.mobile-menu-btn')) {
                event.preventDefault();
                this.toggleSidebar();
            }
            
            // Sidebar toggle
            if (event.target.closest('.sidebar-toggle')) {
                event.preventDefault();
                this.toggleSidebar();
            }
            
            // Logout button
            if (event.target.closest('[data-action="logout"]')) {
                event.preventDefault();
                this.handleLogout();
            }
            
            // Breadcrumb links
            if (event.target.closest('.breadcrumb-item[data-section]')) {
                const link = event.target.closest('.breadcrumb-item');
                const section = link.getAttribute('data-section');
                
                if (section) {
                    event.preventDefault();
                    this.navigateToSection(section);
                }
            }
        });
        
        // Listen for popstate (browser back/forward)
        window.addEventListener('popstate', (event) => {
            const section = event.state?.section || 'dashboard';
            this.navigateToSection(section, false);
        });
        
        // Set up keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });
    }
    
    /**
     * Handle initial navigation based on URL hash
     */
    handleInitialNavigation() {
        // Get section from URL hash or default to dashboard
        let sectionName = 'dashboard';
        
        const hash = window.location.hash;
        if (hash && hash !== '#') {
            sectionName = hash.substring(1);
        }
        
        this.navigateToSection(sectionName, false);
    }
    
    /**
     * Navigate to a specific section
     */
    async navigateToSection(sectionName, addToHistory = true) {
        try {
            console.log(`📋 Navigating to section: ${sectionName}`);
            
            // Show loading state
            this.setLoadingState(true, `Loading ${this.formatSectionName(sectionName)}...`);
            
            // Clean up previous section if exists
            if (this.currentSection && this.currentSection !== sectionName) {
                this.cleanupSectionComponent(this.currentSection);
            }
            
            // Update current section
            this.currentSection = sectionName;
            
            // Update UI state
            this.updateActiveNavItem(sectionName);
            this.updatePageTitle(sectionName);
            this.updateBreadcrumb(sectionName);
            
            // On mobile, close sidebar after navigation
            if (window.innerWidth <= 1024 && this.isSidebarOpen) {
                this.toggleSidebar();
            }
            
            // Add to browser history if needed
            if (addToHistory) {
                history.pushState({section: sectionName}, '', `#${sectionName}`);
            }
            
            // Load section content
            await this.loadSectionContent(sectionName);
            
            // Hide loading state
            this.setLoadingState(false);
            
            // Scroll to top
            window.scrollTo(0, 0);
            
            // Track page view (for analytics)
            this.trackPageView(sectionName);
        } catch (error) {
            this.handleError(`Failed to navigate to ${sectionName}`, error);
            
            // Hide loading state
            this.setLoadingState(false);
            
            // Try to fall back to dashboard if not already there
            if (sectionName !== 'dashboard') {
                this.showNotification('error', `Failed to load ${this.formatSectionName(sectionName)}. Falling back to Dashboard.`);
                this.navigateToSection('dashboard', true);
            }
        }
    }
    
    /**
     * Check if a cache entry is still valid
     */
    isCacheValid(sectionName) {
        const timestamp = this.cacheTimestamps[sectionName];
        if (!timestamp) return false;
        
        const now = Date.now();
        const age = now - timestamp;
        
        // Special cache rules for different sections
        if (sectionName === 'dashboard' || sectionName === 'analytics') {
            // These sections change frequently, shorter TTL (1 minute)
            return age < 60 * 1000;
        }
        
        // Default TTL from instance property
        return age < this.cacheTTL;
    }
    
    /**
     * Invalidate cache for a section
     */
    invalidateCache(sectionName = null) {
        if (sectionName) {
            // Invalidate specific section
            delete this.sectionCache[sectionName];
            delete this.cacheTimestamps[sectionName];
            console.log(`🗑️ Cache invalidated for section: ${sectionName}`);
        } else {
            // Invalidate all sections
            this.sectionCache = {};
            this.cacheTimestamps = {};
            console.log(`🗑️ Cache invalidated for all sections`);
        }
    }
    
    /**
     * Load section content from HTML file or cache
     */
    async loadSectionContent(sectionName) {
        const contentContainer = document.querySelector('.content-wrapper');
        if (!contentContainer) return;
        
        let content;
        
        // Check if we have a valid cached version
        if (this.sectionCache[sectionName] && this.isCacheValid(sectionName)) {
            console.log(`📦 Using cached content for ${sectionName}`);
            content = this.sectionCache[sectionName];
        } else {
            console.log(`🔄 Fetching content for ${sectionName}`);
            
            try {
                // Fetch the section content
                const response = await fetch(`./${sectionName}.html`);
                
                if (!response.ok) {
                    throw new Error(`Failed to load ${sectionName}.html: ${response.status} ${response.statusText}`);
                }
                
                content = await response.text();
                
                // Cache the content with timestamp
                this.sectionCache[sectionName] = content;
                this.cacheTimestamps[sectionName] = Date.now();
            } catch (error) {
                console.error(`Error loading ${sectionName} content:`, error);
                throw error;
            }
        }
        
        // Insert the content into the container
        contentContainer.innerHTML = content;
        
        // Initialize section-specific controllers
        this.initSectionComponent(sectionName);
        
        // Legacy initializers for backward compatibility
        if (sectionName === 'settings' && window.initializeSettings) {
            window.initializeSettings();
        } else if (sectionName === 'analytics' && window.initializeAnalytics) {
            window.initializeAnalytics();
        }
        
        // Setup section-specific event listeners
        this.setupSectionEventListeners(sectionName);
        
        console.log(`✅ Loaded ${sectionName} content`);
    }
    
    /**
     * Set up section-specific event listeners
     */
    setupSectionEventListeners(sectionName) {
        // Add section-specific event handlers here
        if (sectionName === 'dashboard') {
            // Example: Set up dashboard-specific event listeners
            const refreshBtn = document.querySelector('#refresh-dashboard');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => {
                    this.refreshSectionComponent('dashboard');
                });
            }
        }
        
        // Common refresh button handling
        const refreshButtons = document.querySelectorAll('[data-action="refresh"]');
        refreshButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.invalidateCache(sectionName);
                this.refreshSectionComponent(sectionName);
            });
        });
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + / to open keyboard shortcut help
        if ((event.ctrlKey || event.metaKey) && event.key === '/') {
            event.preventDefault();
            this.showKeyboardShortcutsHelp();
            return;
        }
        
        // Ctrl/Cmd + 1-5 for quick navigation
        if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '5') {
            event.preventDefault();
            
            const sections = ['dashboard', 'complaints', 'users', 'analytics', 'settings'];
            const index = parseInt(event.key) - 1;
            
            if (sections[index]) {
                this.navigateToSection(sections[index]);
            }
            
            return;
        }
        
        // F5 or Ctrl+R to refresh current section
        if (event.key === 'F5' || ((event.ctrlKey || event.metaKey) && event.key === 'r')) {
            if (this.currentSection) {
                event.preventDefault();
                this.invalidateCache(this.currentSection);
                this.navigateToSection(this.currentSection, false);
            }
        }
    }
    
    /**
     * Show keyboard shortcuts help
     */
    showKeyboardShortcutsHelp() {
        Swal.fire({
            title: 'Keyboard Shortcuts',
            html: `
                <div class="shortcuts-container">
                    <div class="shortcut-group">
                        <h3>Navigation</h3>
                        <div class="shortcut-item">
                            <div class="shortcut-keys">
                                <kbd>Ctrl</kbd> + <kbd>1</kbd>
                            </div>
                            <div class="shortcut-description">Dashboard</div>
                        </div>
                        <div class="shortcut-item">
                            <div class="shortcut-keys">
                                <kbd>Ctrl</kbd> + <kbd>2</kbd>
                            </div>
                            <div class="shortcut-description">Complaints</div>
                        </div>
                        <div class="shortcut-item">
                            <div class="shortcut-keys">
                                <kbd>Ctrl</kbd> + <kbd>3</kbd>
                            </div>
                            <div class="shortcut-description">Users</div>
                        </div>
                        <div class="shortcut-item">
                            <div class="shortcut-keys">
                                <kbd>Ctrl</kbd> + <kbd>4</kbd>
                            </div>
                            <div class="shortcut-description">Analytics</div>
                        </div>
                        <div class="shortcut-item">
                            <div class="shortcut-keys">
                                <kbd>Ctrl</kbd> + <kbd>5</kbd>
                            </div>
                            <div class="shortcut-description">Settings</div>
                        </div>
                    </div>
                    <div class="shortcut-group">
                        <h3>Actions</h3>
                        <div class="shortcut-item">
                            <div class="shortcut-keys">
                                <kbd>F5</kbd> or <kbd>Ctrl</kbd> + <kbd>R</kbd>
                            </div>
                            <div class="shortcut-description">Refresh current page</div>
                        </div>
                        <div class="shortcut-item">
                            <div class="shortcut-keys">
                                <kbd>Ctrl</kbd> + <kbd>/</kbd>
                            </div>
                            <div class="shortcut-description">Open this help</div>
                        </div>
                    </div>
                </div>
            `,
            width: 600,
            confirmButtonText: 'Got it!',
            showClass: {
                popup: 'animate__animated animate__fadeIn animate__faster'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOut animate__faster'
            }
        });
    }
    
    /**
     * Toggle sidebar visibility/collapse
     */
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
                
                // Adjust main content margin
                const mainContent = document.querySelector('.main-content');
                if (mainContent) {
                    if (sidebar.classList.contains('collapsed')) {
                        mainContent.style.marginLeft = '80px'; // Collapsed sidebar width
                    } else {
                        mainContent.style.marginLeft = 'var(--sidebar-width)';
                    }
                }
            }
        }
    }
    
    /**
     * Handle logout
     */
    handleLogout() {
        Swal.fire({
            title: 'Logout',
            text: 'Are you sure you want to logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, logout'
        }).then((result) => {
            if (result.isConfirmed) {
                // Clear session data
                localStorage.removeItem('authToken');
                localStorage.removeItem('role');
                localStorage.removeItem('username');
                localStorage.removeItem('userId');
                
                // Redirect to login page
                window.location.href = 'index.html';
            }
        });
    }
    
    /**
     * Update active nav item in sidebar
     */
    updateActiveNavItem(sectionName) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current section's nav item
        const activeNavItem = document.querySelector(`.nav-link[data-section="${sectionName}"]`)?.closest('.nav-item');
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
    }
    
    /**
     * Update page title based on section
     */
    updatePageTitle(sectionName) {
        document.title = `${this.formatSectionName(sectionName)} - NACOS Complaint System`;
    }
    
    /**
     * Update breadcrumb navigation
     */
    updateBreadcrumb(section) {
        const breadcrumb = document.querySelector('.breadcrumb');
        if (breadcrumb) {
            if (section === 'dashboard') {
                breadcrumb.innerHTML = `
                    <span class="breadcrumb-item active">
                        <i class="fas fa-home"></i>
                        Dashboard
                    </span>
                `;
            } else {
                breadcrumb.innerHTML = `
                    <a href="#dashboard" class="breadcrumb-item" data-section="dashboard">
                        <i class="fas fa-home"></i>
                        Dashboard
                    </a>
                    <i class="fas fa-chevron-right"></i>
                    <span class="breadcrumb-item active">${this.formatSectionName(section)}</span>
                `;
            }
        }
    }
    
    /**
     * Format section name for display
     */
    formatSectionName(sectionName) {
        if (!sectionName) return '';
        return sectionName.charAt(0).toUpperCase() + sectionName.slice(1);
    }
    
    /**
     * Track page view for analytics
     */
    trackPageView(sectionName) {
        // Implement analytics tracking here if needed
        console.log(`📊 Page view tracked: ${sectionName}`);
        
        // Example: If you have Google Analytics
        // if (window.gtag) {
        //     gtag('event', 'page_view', {
        //         page_title: this.formatSectionName(sectionName),
        //         page_path: `#${sectionName}`
        //     });
        // }
    }
    
    /**
     * Show notification message
     */
    showNotification(type, message) {
        Swal.fire({
            icon: type,
            title: type.charAt(0).toUpperCase() + type.slice(1),
            text: message,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    }
    
    /**
     * Handle global error
     */
    globalErrorHandler(event) {
        console.error('Global error caught:', event.error);
        
        // Prevent the browser from showing its own error
        event.preventDefault();
        
        // Show a user-friendly message
        this.showNotification('error', 'An unexpected error occurred');
        
        // Log to server (if implemented)
        this.logErrorToServer({
            type: 'error',
            message: event.message,
            stack: event.error?.stack,
            location: window.location.href,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Handle unhandled promise rejection
     */
    unhandledRejectionHandler(event) {
        console.error('Unhandled promise rejection:', event.reason);
        
        // Prevent the browser from showing its own error
        event.preventDefault();
        
        // Show a user-friendly message
        this.showNotification('error', 'An operation failed unexpectedly');
        
        // Log to server (if implemented)
        this.logErrorToServer({
            type: 'rejection',
            message: event.reason?.message || 'Unknown promise rejection',
            stack: event.reason?.stack,
            location: window.location.href,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Handle error with user feedback
     */
    handleError(message, error) {
        console.error(message, error);
        
        // Show user-friendly error
        this.showNotification('error', message);
        
        // Log to server (if implemented)
        this.logErrorToServer({
            type: 'handled',
            message: message,
            details: error?.message,
            stack: error?.stack,
            location: window.location.href,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Log error to server for tracking
     */
    logErrorToServer(errorData) {
        // Implement error logging to your backend
        // Example:
        // fetch('/api/error-log', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(errorData)
        // }).catch(err => console.error('Failed to log error to server', err));
        
        // For now, just log to console
        console.group('Error Details:');
        console.error('Type:', errorData.type);
        console.error('Message:', errorData.message);
        console.error('Stack:', errorData.stack);
        console.error('Location:', errorData.location);
        console.error('Timestamp:', errorData.timestamp);
        console.groupEnd();
    }
}

// Initialize navigation controller on page load
document.addEventListener('DOMContentLoaded', () => {
    window.navigationController = new NavigationController();
    
    // Example component registration
    // This shows how different sections can register their init/cleanup/refresh functions
    if (window.navigationController) {
        // Register dashboard component
        window.navigationController.registerSectionComponent('dashboard', {
            init: () => {
                console.log('Initializing dashboard component');
                if (window.adminDashboard && window.adminDashboard.refreshDashboard) {
                    window.adminDashboard.refreshDashboard();
                }
            },
            cleanup: () => {
                console.log('Cleaning up dashboard component');
                // Cancel any pending requests, remove event listeners, etc.
            },
            refresh: () => {
                console.log('Refreshing dashboard component');
                if (window.adminDashboard && window.adminDashboard.refreshDashboard) {
                    window.adminDashboard.refreshDashboard();
                }
            }
        });
        
        // Register analytics component
        window.navigationController.registerSectionComponent('analytics', {
            init: () => {
                console.log('Initializing analytics component');
                if (window.initializeAnalytics) {
                    window.initializeAnalytics();
                }
            },
            cleanup: () => {
                console.log('Cleaning up analytics component');
                // Cleanup code here
            },
            refresh: () => {
                console.log('Refreshing analytics component');
                if (window.analyticsController && window.analyticsController.refreshAnalytics) {
                    window.analyticsController.refreshAnalytics();
                }
            }
        });
        
        // Register settings component
        window.navigationController.registerSectionComponent('settings', {
            init: () => {
                console.log('Initializing settings component');
                if (window.initializeSettings) {
                    window.initializeSettings();
                }
            },
            cleanup: () => {
                console.log('Cleaning up settings component');
                // Cleanup code here
            },
            refresh: () => {
                console.log('Refreshing settings component');
                if (window.settingsController && window.settingsController.loadSettings) {
                    window.settingsController.loadSettings();
                }
            }
        });
    }
});