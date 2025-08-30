/**
 * Main JavaScript file for Stock Inventory Management System
 * Handles core UI functionality, navigation, and common utilities
 */

class StockManagementApp {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.mainContent = document.getElementById('mainContent');
        this.globalSearch = document.getElementById('globalSearch');
        this.notificationBadge = document.getElementById('notificationBadge');
        
        this.initializeApp();
        this.bindEvents();
    }

    initializeApp() {
        // Check sidebar state from localStorage
        const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (sidebarCollapsed) {
            this.sidebar.classList.add('collapsed');
        }

        // Initialize notification count
        this.updateNotificationCount();

        // Set active navigation item
        this.setActiveNavigation();

        // Initialize tooltips for collapsed sidebar
        this.initializeTooltips();
    }

    bindEvents() {
        // Sidebar toggle
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Global search
        if (this.globalSearch) {
            this.globalSearch.addEventListener('input', (e) => {
                this.handleGlobalSearch(e.target.value);
            });
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Auto-close functionality
        document.addEventListener('click', (e) => {
            // Close modal on backdrop click
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
            
            // Auto-close sidebar on outside click (mobile)
            if (window.innerWidth <= 1024) {
                if (!this.sidebar.contains(e.target) && !this.sidebarToggle.contains(e.target)) {
                    if (!this.sidebar.classList.contains('collapsed')) {
                        this.collapseSidebar();
                    }
                }
            }
            
            // Auto-close side panels on outside click
            const sidePanel = document.querySelector('.side-panel.active');
            if (sidePanel && !sidePanel.contains(e.target) && !e.target.closest('.btn-primary')) {
                if (window.inventoryManager && window.inventoryManager.closeSidePanel) {
                    window.inventoryManager.closeSidePanel();
                }
            }
        });

        // Enhanced ESC key handling
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close modals first
                this.closeModal();
                
                // Close side panels
                const sidePanel = document.querySelector('.side-panel.active');
                if (sidePanel && window.inventoryManager && window.inventoryManager.closeSidePanel) {
                    window.inventoryManager.closeSidePanel();
                }
                
                // Collapse sidebar on mobile
                if (window.innerWidth <= 1024 && !this.sidebar.classList.contains('collapsed')) {
                    this.collapseSidebar();
                }
            }
        });

        // Profile menu dropdown with animation
        const profileMenu = document.querySelector('.profile-menu');
        if (profileMenu) {
            profileMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleProfileDropdown();
            });
        }

        // Close profile dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const profileMenu = document.querySelector('.profile-menu');
            if (profileMenu && !profileMenu.contains(e.target)) {
                profileMenu.classList.remove('active');
            }
        });

        // Auto-close on inactivity (optional)
        let inactivityTimer;
        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                // Auto-collapse sidebar after 5 minutes of inactivity on desktop
                if (window.innerWidth > 1024 && !this.sidebar.classList.contains('collapsed')) {
                    this.collapseSidebar();
                }
            }, 300000); // 5 minutes
        };

        // Reset timer on user activity
        document.addEventListener('mousemove', resetInactivityTimer);
        document.addEventListener('keypress', resetInactivityTimer);
        document.addEventListener('click', resetInactivityTimer);
        
        resetInactivityTimer(); // Initialize timer
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('collapsed');
        const isCollapsed = this.sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
        
        // Add smooth animation
        this.sidebar.style.transform = isCollapsed ? 'translateX(-10px)' : 'scale(1.02)';
        setTimeout(() => {
            this.sidebar.style.transform = '';
        }, 200);
        
        // Update tooltips
        this.updateTooltips();
    }

    collapseSidebar() {
        this.sidebar.classList.add('collapsed');
        localStorage.setItem('sidebarCollapsed', 'true');
        
        // Add smooth animation
        this.sidebar.style.transform = 'scale(0.98)';
        setTimeout(() => {
            this.sidebar.style.transform = '';
        }, 300);
        
        this.updateTooltips();
    }

    expandSidebar() {
        this.sidebar.classList.remove('collapsed');
        localStorage.setItem('sidebarCollapsed', 'false');
        
        // Add smooth animation  
        this.sidebar.style.transform = 'scale(1.02)';
        setTimeout(() => {
            this.sidebar.style.transform = '';
        }, 300);
        
        this.updateTooltips();
    }

    setActiveNavigation() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
    }

    initializeTooltips() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const text = link.querySelector('.nav-text')?.textContent;
            if (text) {
                link.setAttribute('title', text);
            }
        });
    }

    updateTooltips() {
        const isCollapsed = this.sidebar.classList.contains('collapsed');
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            if (isCollapsed) {
                const text = link.querySelector('.nav-text')?.textContent;
                link.setAttribute('title', text || '');
            } else {
                link.removeAttribute('title');
            }
        });
    }

    handleGlobalSearch(query) {
        if (query.length < 2) return;

        // Emit custom event for page-specific search handling
        const searchEvent = new CustomEvent('globalSearch', {
            detail: { query }
        });
        document.dispatchEvent(searchEvent);
    }

    handleResize() {
        // Comprehensive device detection and responsive behavior
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Remove all device classes first
        document.body.classList.remove('mobile-device', 'tablet-device', 'desktop-device', 'landscape-mode');
        this.sidebar.classList.remove('mobile');
        
        if (width <= 479) {
            // Small mobile
            document.body.classList.add('mobile-device');
            this.sidebar.classList.add('collapsed');
            this.adjustForSmallMobile();
        } else if (width <= 767) {
            // Large mobile
            document.body.classList.add('mobile-device');
            this.sidebar.classList.add('collapsed');
            this.adjustForMobile();
        } else if (width <= 1023) {
            // Tablet
            document.body.classList.add('tablet-device');
            this.sidebar.classList.add('mobile');
            this.adjustForTablet();
        } else {
            // Desktop
            document.body.classList.add('desktop-device');
            this.sidebar.classList.remove('mobile', 'open');
            this.adjustForDesktop();
        }
        
        // Handle orientation for mobile devices
        if (width <= 768) {
            const isLandscape = width > height;
            document.body.classList.toggle('landscape-mode', isLandscape);
        }
        
        // Update touch targets and interface elements
        this.updateInterfaceForDevice();
    }

    updateNotificationCount() {
        if (!this.notificationBadge) return;

        // Check if DataStorage is available
        if (typeof DataStorage === 'undefined' || !DataStorage) {
            console.warn('DataStorage not yet available for notification count');
            // Set default values while waiting
            this.notificationBadge.textContent = '0';
            this.notificationBadge.style.display = 'none';
            return;
        }

        // Get low stock count from storage
        window.DataStorage.getDashboardStats().then(stats => {
            const count = stats.low_stock_count || 0;
            this.notificationBadge.textContent = count;
            this.notificationBadge.style.display = count > 0 ? 'block' : 'none';
        }).catch(error => {
            console.warn('Failed to get dashboard stats for notifications:', error);
            this.notificationBadge.textContent = '0';
            this.notificationBadge.style.display = 'none';
        });
    }

    toggleProfileDropdown() {
        // Future implementation for profile dropdown
        console.log('Profile menu clicked');
    }

    // Modal Management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId = null) {
        if (modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('active');
            }
        } else {
            // Close all modals
            const activeModals = document.querySelectorAll('.modal.active');
            activeModals.forEach(modal => {
                modal.classList.remove('active');
            });
        }
        document.body.style.overflow = '';
    }

    createModal(title, content, actions = []) {
        const modalId = 'modal-' + Date.now();
        const modalHTML = `
            <div class="modal" id="${modalId}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <button class="modal-close" onclick="app.closeModal('${modalId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${actions.length > 0 ? `
                        <div class="modal-footer">
                            ${actions.map(action => `
                                <button class="btn ${action.class || 'btn-primary'}" onclick="${action.onclick}">
                                    ${action.icon ? `<i class="${action.icon}"></i>` : ''}
                                    ${action.text}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        const modalContainer = document.getElementById('modalContainer');
        modalContainer.innerHTML = modalHTML;
        this.openModal(modalId);
        return modalId;
    }

    // Notification System
    showNotification(message, type = 'info', duration = 5000) {
        const notificationContainer = document.getElementById('notificationContainer');
        if (!notificationContainer) return;

        const notificationId = 'notification-' + Date.now();
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const notificationHTML = `
            <div class="notification ${type}" id="${notificationId}">
                <i class="notification-icon ${iconMap[type]}"></i>
                <div class="notification-content">
                    ${message}
                </div>
                <button class="notification-close" onclick="app.closeNotification('${notificationId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        notificationContainer.insertAdjacentHTML('beforeend', notificationHTML);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.closeNotification(notificationId);
            }, duration);
        }
    }

    closeNotification(notificationId) {
        const notification = document.getElementById(notificationId);
        if (notification) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }

    // Data Table Utilities
    sortTable(tableId, columnIndex, dataType = 'string') {
        const table = document.getElementById(tableId);
        if (!table) return;

        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        // Get current sort state
        const header = table.querySelectorAll('th')[columnIndex];
        const currentSort = header.getAttribute('data-sort') || 'none';
        const newSort = currentSort === 'asc' ? 'desc' : 'asc';

        // Clear all sort indicators
        table.querySelectorAll('th').forEach(th => {
            th.removeAttribute('data-sort');
            const icon = th.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-sort';
            }
        });

        // Set new sort indicator
        header.setAttribute('data-sort', newSort);
        const icon = header.querySelector('i');
        if (icon) {
            icon.className = newSort === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
        }

        // Sort rows
        rows.sort((a, b) => {
            const aValue = a.cells[columnIndex].textContent.trim();
            const bValue = b.cells[columnIndex].textContent.trim();

            let comparison = 0;
            switch (dataType) {
                case 'number':
                    comparison = parseFloat(aValue) - parseFloat(bValue);
                    break;
                case 'date':
                    comparison = new Date(aValue) - new Date(bValue);
                    break;
                default:
                    comparison = aValue.localeCompare(bValue);
            }

            return newSort === 'asc' ? comparison : -comparison;
        });

        // Reorder rows in table
        tbody.innerHTML = '';
        rows.forEach(row => tbody.appendChild(row));
    }

    filterTable(tableId, filterValue, columnIndex = null) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const rows = table.querySelectorAll('tbody tr');
        const filter = filterValue.toLowerCase();

        rows.forEach(row => {
            let show = false;
            
            if (columnIndex !== null) {
                // Filter specific column
                const cell = row.cells[columnIndex];
                if (cell && cell.textContent.toLowerCase().includes(filter)) {
                    show = true;
                }
            } else {
                // Filter all columns
                Array.from(row.cells).forEach(cell => {
                    if (cell.textContent.toLowerCase().includes(filter)) {
                        show = true;
                    }
                });
            }

            row.style.display = show || filter === '' ? '' : 'none';
        });

        // Update pagination if exists
        this.updatePaginationAfterFilter(tableId);
    }

    updatePaginationAfterFilter(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;

        const visibleRows = table.querySelectorAll('tbody tr:not([style*="display: none"])');
        const totalVisible = visibleRows.length;

        // Update pagination info
        const paginationInfo = table.closest('.table-container').nextElementSibling?.querySelector('.pagination-info');
        if (paginationInfo) {
            const start = totalVisible > 0 ? 1 : 0;
            const end = totalVisible;
            paginationInfo.innerHTML = `Showing ${start} to ${end} of ${totalVisible} entries`;
        }
    }

    // Export Utilities
    exportTableToCSV(tableId, filename = 'export.csv') {
        const table = document.getElementById(tableId);
        if (!table) return;

        const rows = table.querySelectorAll('tr');
        const csv = [];

        rows.forEach(row => {
            const cols = row.querySelectorAll('td, th');
            const rowData = [];
            cols.forEach(col => {
                // Clean text and handle commas
                let text = col.textContent.trim();
                text = text.replace(/"/g, '""'); // Escape quotes
                if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                    text = `"${text}"`;
                }
                rowData.push(text);
            });
            csv.push(rowData.join(','));
        });

        const csvContent = csv.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Form Utilities
    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;

        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.showFieldError(field, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(field);
            }
        });

        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        field.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.color = 'var(--danger-color)';
        errorDiv.style.fontSize = '0.75rem';
        errorDiv.style.marginTop = '0.25rem';
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    clearFormErrors(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.querySelectorAll('.field-error').forEach(error => error.remove());
        form.querySelectorAll('.error').forEach(field => field.classList.remove('error'));
    }

    // Loading States
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.disabled = true;
            element.innerHTML = '<span class="loading"></span> Loading...';
        }
    }

    hideLoading(elementId, originalText) {
        const element = document.getElementById(elementId);
        if (element) {
            element.disabled = false;
            element.innerHTML = originalText;
        }
    }

    // Utility Functions
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

    formatCurrency(amount) {
        if (typeof DataStorage !== 'undefined' && DataStorage) {
            return window.DataStorage.formatCurrency(amount);
        }
        return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    }

    formatDate(dateString) {
        if (typeof DataStorage !== 'undefined' && DataStorage) {
            return window.DataStorage.formatDate(dateString);
        }
        return new Date(dateString).toLocaleDateString('en-GB');
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    toggleProfileDropdown() {
        const profileMenu = document.querySelector('.profile-menu');
        if (profileMenu) {
            profileMenu.classList.toggle('active');
            console.log('Profile dropdown toggled:', profileMenu.classList.contains('active'));
        }
    }

    // Device-specific adjustments
    adjustForSmallMobile() {
        // Optimizations for small mobile devices (≤479px)
        const sidebar = this.sidebar;
        if (sidebar) {
            sidebar.style.width = '100%';
            sidebar.classList.add('collapsed');
        }
        
        // Adjust font sizes and spacing for small screens
        document.documentElement.style.setProperty('--base-font-size', '14px');
        document.documentElement.style.setProperty('--button-padding', '8px 12px');
    }

    adjustForMobile() {
        // Optimizations for mobile devices (480px-767px)
        const sidebar = this.sidebar;
        if (sidebar) {
            sidebar.style.width = '280px';
            sidebar.classList.add('collapsed');
        }
        
        // Standard mobile font and spacing
        document.documentElement.style.setProperty('--base-font-size', '15px');
        document.documentElement.style.setProperty('--button-padding', '10px 16px');
    }

    adjustForTablet() {
        // Optimizations for tablet devices (768px-1023px)
        const sidebar = this.sidebar;
        if (sidebar) {
            sidebar.style.width = '250px';
            sidebar.classList.remove('collapsed');
        }
        
        // Tablet-friendly sizing
        document.documentElement.style.setProperty('--base-font-size', '16px');
        document.documentElement.style.setProperty('--button-padding', '12px 20px');
    }

    adjustForDesktop() {
        // Optimizations for desktop devices (≥1024px)
        const sidebar = this.sidebar;
        if (sidebar) {
            sidebar.style.width = '';
            sidebar.classList.remove('collapsed');
        }
        
        // Desktop standard sizing
        document.documentElement.style.setProperty('--base-font-size', '16px');
        document.documentElement.style.setProperty('--button-padding', '12px 24px');
        
        // Restore sidebar state from localStorage
        const sidebarCollapsed = localStorage.getItem('sidebarCollapsed');
        if (sidebarCollapsed === 'true') {
            sidebar.classList.add('collapsed');
        }
    }

    updateInterfaceForDevice() {
        // Update touch targets and interface elements based on device
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isTouchDevice) {
            document.body.classList.add('touch-device');
            // Increase touch target sizes
            document.documentElement.style.setProperty('--touch-target-size', '44px');
        } else {
            document.body.classList.remove('touch-device');
            document.documentElement.style.setProperty('--touch-target-size', '32px');
        }
        
        // Update tooltips visibility
        this.updateTooltips();
    }
}

// Global functions for backward compatibility
function showNotification(message, type = 'info', duration = 5000) {
    if (window.app) {
        window.app.showNotification(message, type, duration);
    }
}

function sortTable(columnIndex, tableId = null) {
    if (window.app && tableId) {
        window.app.sortTable(tableId, columnIndex);
    }
}

function exportTableToCSV(tableId, filename) {
    if (window.app) {
        window.app.exportTableToCSV(tableId, filename);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.app = new StockManagementApp();
    
    // Refresh notification count periodically, with a delay to ensure DataStorage is available
    setTimeout(() => {
        setInterval(() => {
            if (window.app) {
                window.app.updateNotificationCount();
            }
        }, 30000); // Every 30 seconds
        
        // Initial call after delay
        if (window.app) {
            window.app.updateNotificationCount();
        }
    }, 2000); // Wait 2 seconds for DataStorage to be ready
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .field-error {
        color: var(--danger-color);
        font-size: 0.75rem;
        margin-top: 0.25rem;
    }
    
    .form-control.error {
        border-color: var(--danger-color);
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
`;
document.head.appendChild(style);
