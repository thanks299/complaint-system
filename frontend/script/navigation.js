/* =============================== 
   NAVIGATION CONTROLLER
=============================== */
class NavigationController {
    constructor() {
        this.currentSection = 'dashboard';
        this.isSidebarOpen = window.innerWidth > 1024;
        this.sectionCache = {}; // Cache loaded sections
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.handleResize();
        
        console.log('🚀 Navigation system initialized');
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
                    this.navigateToSection(section);
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

        // Quick actions
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.getAttribute('data-action');
                if (action === 'view-complaints') {
                    this.navigateToSection('complaints');
                } else if (action === 'system-settings') {
                    this.navigateToSection('settings');
                }
            });
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /* =============================== 
       NAVIGATION METHODS
    =============================== */
    async navigateToSection(sectionName) {
        console.log(`📋 Navigating to section: ${sectionName}`);

        if (this.currentSection === sectionName) {
            console.log('Already on this section');
            return;
        }

        // Update current section
        this.currentSection = sectionName;
        
        // Update navigation active state
        this.updateActiveNavItem(sectionName);
        
        // Update breadcrumb
        this.updateBreadcrumb(sectionName);

        // Load section content
        await this.loadSectionContent(sectionName);

        // Close sidebar on mobile after navigation
        if (window.innerWidth <= 1024) {
            this.closeSidebar();
        }

        // Update page title
        this.updatePageTitle(sectionName);

        // Update URL without page reload (optional)
        history.pushState({section: sectionName}, '', `#${sectionName}`);
    }

    async loadSectionContent(sectionName) {
        const contentContainer = document.getElementById('content-container');
        if (!contentContainer) return;

        try {
            // Show loading state
            contentContainer.innerHTML = `
                <div class="section-loading">
                    <div class="spinner"></div>
                    <p>Loading ${sectionName}...</p>
                </div>
            `;

            let content;

            // Check if we have cached the section content
            if (this.sectionCache[sectionName]) {
                content = this.sectionCache[sectionName];
                console.log(`📋 Using cached content for ${sectionName}`);
            } else {
                // Fetch the section content
                const response = await fetch(`./${sectionName}.html`);
                
                if (!response.ok) {
                    throw new Error(`Failed to load ${sectionName} content`);
                }
                
                content = await response.text();
                
                // Cache the content for future use
                this.sectionCache[sectionName] = content;
            }

            // Insert the content into the container
            contentContainer.innerHTML = content;

            // Initialize section-specific controllers
            if (sectionName === 'settings' && window.initializeSettings) {
            window.initializeSettings();
            }
            
            // Setup section-specific event handlers
            this.setupSectionEventListeners(sectionName);
            
            console.log(`✅ Loaded ${sectionName} content`);

        } catch (error) {
            console.error(`❌ Error loading section content: ${error.message}`);
            contentContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Content</h3>
                    <p>${error.message}</p>
                    <button class="btn-secondary" onclick="window.location.reload()">
                        <i class="fas fa-sync-alt"></i> Reload Page
                    </button>
                </div>
            `;
        }
    }

    setupSectionEventListeners(sectionName) {
        // This will be implemented for each section's specific functionality
        console.log(`Setting up event listeners for ${sectionName}`);
        
        // Example: Setup settings tabs
        if (sectionName === 'settings') {
            document.querySelectorAll('.tab-btn').forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetTab = tab.getAttribute('data-tab');
                    this.switchSettingsTab(targetTab);
                });
            });
        }

        // Add more section-specific event listeners as needed
    }

    switchSettingsTab(tabName) {
        // Remove active class from all tabs and panels
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Activate selected tab and panel
        document.querySelector(`.tab-btn[data-tab="${tabName}"]`)?.classList.add('active');
        document.getElementById(`${tabName}-panel`)?.classList.add('active');
    }

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
            
            // Reset main content margin
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.style.marginLeft = '0';
            }
        } else {
            // Desktop: Show sidebar
            sidebar.classList.remove('active');
            if (!this.isSidebarOpen) {
                sidebar.classList.add('collapsed');
                
                // Adjust main content margin for collapsed state
                const mainContent = document.querySelector('.main-content');
                if (mainContent) {
                    mainContent.style.marginLeft = '80px';
                }
            } else {
                // Adjust main content margin for expanded state
                const mainContent = document.querySelector('.main-content');
                if (mainContent) {
                    mainContent.style.marginLeft = 'var(--sidebar-width)';
                }
            }
        }
    }

    /* =============================== 
       UTILITY METHODS
    =============================== */
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
                
                // Add click event to the dashboard link
                const dashboardLink = breadcrumb.querySelector('[data-section="dashboard"]');
                if (dashboardLink) {
                    dashboardLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.navigateToSection('dashboard');
                    });
                }
            }
        }
    }

    updatePageTitle(section) {
        document.title = `${this.formatSectionName(section)} - NACOS Complaint System`;
    }

    formatSectionName(section) {
        return section.charAt(0).toUpperCase() + section.slice(1);
    }

    showNotification(message, type = 'info') {
        // Create notification element
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

        // Add to the DOM
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.remove();
            });
        }
    }
}

/* =============================== 
   INITIALIZE NAVIGATION
=============================== */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Navigation Controller...');
    
    // Initialize the navigation system
    window.navigationController = new NavigationController();
    
    // Check URL hash for direct navigation
    const hash = window.location.hash.substring(1);
    if (hash) {
        window.navigationController.navigateToSection(hash);
    }
    
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
        
        .section-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 0;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(74, 124, 89, 0.2);
            border-top: 4px solid var(--primary-color, #4a7c59);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .error-state {
            text-align: center;
            padding: 40px 20px;
            color: #ef4444;
        }
        
        .error-state i {
            font-size: 48px;
            margin-bottom: 20px;
        }
    `;
    document.head.appendChild(style);
    
    console.log('✅ Navigation Controller ready!');
});