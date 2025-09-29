/* =============================== 
   SETTINGS CONTROLLER
=============================== */
class SettingsController {
    constructor() {
        this.init();
    }

    init() {
        console.log('🔧 Initializing Settings Controller...');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(tab.getAttribute('data-tab'));
            });
        });

        // Save settings button
        const saveBtn = document.querySelector('[data-action="save-settings"]');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                this.saveSettings();
            });
        }

        // Reset settings button
        const resetBtn = document.querySelector('[data-action="reset-settings"]');
        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                this.resetSettings();
            });
        }

        // Toggle switches
        document.querySelectorAll('.toggle-switch input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                this.handleToggleChange(toggle);
            });
        });
    }

    switchTab(tabName) {
        console.log(`📂 Switching to ${tabName} tab`);
        
        // Deactivate all tabs and panels
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Activate selected tab and panel
        document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-panel`).classList.add('active');
    }

    saveSettings() {
        // Create a settings object with all form values
        const settings = {
            general: {
                systemName: document.querySelector('.setting-input[value="NACOS Complaint System"]').value,
                language: document.querySelector('select[class="setting-select"]').value,
                timezone: document.querySelectorAll('select[class="setting-select"]')[1].value,
                autoAssign: document.getElementById('auto-assign').checked
            },
            notifications: {
                newComplaintEmail: document.getElementById('new-complaint-email').checked,
                statusUpdateEmail: document.getElementById('status-update-email').checked
            },
            security: {
                twoFactorAuth: document.getElementById('two-factor-auth')?.checked || false,
                passwordExpiry: document.querySelector('.setting-input[type="number"]')?.value || "90"
            },
            backup: {
                autoBackup: document.getElementById('auto-backup')?.checked || true,
                backupFrequency: document.querySelectorAll('select[class="setting-select"]')[2]?.value || "weekly"
            }
        };

        console.log('💾 Saving settings:', settings);
        
        // In a real application, you'd send this to your server
        // For now, we'll simulate a successful save
        this.showNotification('Settings saved successfully!', 'success');
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default values?')) {
            console.log('🔄 Resetting settings to defaults');
            
            // Reset form values
            document.querySelector('.setting-input[value="NACOS Complaint System"]').value = "NACOS Complaint System";
            document.querySelector('select[class="setting-select"]').value = "en";
            document.querySelectorAll('select[class="setting-select"]')[1].value = "WAT";
            document.getElementById('auto-assign').checked = true;
            document.getElementById('new-complaint-email').checked = true;
            document.getElementById('status-update-email').checked = true;
            
            if (document.getElementById('two-factor-auth')) {
                document.getElementById('two-factor-auth').checked = false;
            }
            
            if (document.querySelector('.setting-input[type="number"]')) {
                document.querySelector('.setting-input[type="number"]').value = "90";
            }
            
            if (document.getElementById('auto-backup')) {
                document.getElementById('auto-backup').checked = true;
            }
            
            if (document.querySelectorAll('select[class="setting-select"]')[2]) {
                document.querySelectorAll('select[class="setting-select"]')[2].value = "weekly";
            }
            
            this.showNotification('Settings reset to default values', 'info');
        }
    }

    handleToggleChange(toggle) {
        const settingName = toggle.id;
        const isEnabled = toggle.checked;
        
        console.log(`🔄 Setting "${settingName}" changed to: ${isEnabled}`);
        
        // You could trigger specific actions based on toggle changes
        if (settingName === 'two-factor-auth' && isEnabled) {
            // In a real app, you might show a QR code for 2FA setup here
            console.log('Two-factor authentication enabled - would show setup instructions');
        }
    }

    showNotification(message, type = 'info') {
        // Check if the notification system is available from the parent
        if (window.navigationController && typeof window.navigationController.showNotification === 'function') {
            window.navigationController.showNotification(message, type);
        } else {
            // Fallback notification
            alert(message);
        }
    }
}

// Initialize when the page content has loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if this page is being loaded directly or via the navigation system
    if (!window.navigationController) {
        console.log('💡 Settings page loaded directly');
        window.settingsController = new SettingsController();
    } else {
        // The navigation system will handle initialization
        console.log('💡 Settings page loaded via navigation system');
    }
});

// Export the controller for use by the navigation system
if (typeof window !== 'undefined') {
    window.initializeSettings = function() {
        // Only initialize if not already initialized
        if (!window.settingsController) {
            console.log('🔧 Initializing Settings Controller');
            window.settingsController = new SettingsController();
        } else {
            console.log('🔧 Settings Controller already initialized');
        }
        return window.settingsController;
    };
}