// Quick Actions Toolbar and Keyboard Shortcuts
class QuickActionsManager {
    constructor() {
        this.shortcuts = {};
        this.currentPage = null;
        this.isQuickActionsVisible = false;
        this.init();
    }

    init() {
        this.detectCurrentPage();
        this.setupKeyboardShortcuts();
        this.createQuickActionsToolbar();
        this.addQuickActionsStyles();
        this.setupGlobalShortcuts();
    }

    detectCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('/inventory') || path === '/inventory') {
            this.currentPage = 'inventory';
        } else if (path.includes('/orders') || path === '/orders') {
            this.currentPage = 'orders';
        } else if (path.includes('/billing') || path === '/billing') {
            this.currentPage = 'billing';
        } else if (path.includes('/dashboard') || path === '/dashboard' || path === '/') {
            this.currentPage = 'dashboard';
        }
    }

    addQuickActionsStyles() {
        const styles = document.createElement('style');
        styles.id = 'quick-actions-styles';
        styles.textContent = `
            .quick-actions-fab {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #3b82f6, #1e40af);
                border-radius: 50%;
                box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
                border: none;
                cursor: pointer;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 1.5rem;
                transition: all 0.3s ease;
                animation: pulse 2s infinite;
            }

            .quick-actions-fab:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(59, 130, 246, 0.6);
            }

            .quick-actions-fab.active {
                transform: rotate(45deg);
            }

            .quick-actions-menu {
                position: fixed;
                bottom: 100px;
                right: 30px;
                display: flex;
                flex-direction: column;
                gap: 15px;
                opacity: 0;
                transform: scale(0.8);
                transition: all 0.3s ease;
                pointer-events: none;
                z-index: 999;
            }

            .quick-actions-menu.visible {
                opacity: 1;
                transform: scale(1);
                pointer-events: all;
            }

            .quick-action-item {
                display: flex;
                align-items: center;
                background: white;
                border: none;
                padding: 12px 20px;
                border-radius: 30px;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                transition: all 0.2s ease;
                color: #374151;
                text-decoration: none;
                white-space: nowrap;
                transform: translateX(100px);
                animation: slideInRight 0.3s ease forwards;
            }

            .quick-action-item:nth-child(1) { animation-delay: 0.1s; }
            .quick-action-item:nth-child(2) { animation-delay: 0.2s; }
            .quick-action-item:nth-child(3) { animation-delay: 0.3s; }
            .quick-action-item:nth-child(4) { animation-delay: 0.4s; }
            .quick-action-item:nth-child(5) { animation-delay: 0.5s; }

            .quick-action-item:hover {
                transform: translateX(0) scale(1.05);
                box-shadow: 0 6px 20px rgba(0,0,0,0.15);
            }

            .quick-action-item i {
                margin-right: 10px;
                width: 20px;
                text-align: center;
                color: #3b82f6;
            }

            .keyboard-shortcuts-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .keyboard-shortcuts-modal.visible {
                opacity: 1;
                visibility: visible;
            }

            .shortcuts-content {
                background: white;
                border-radius: 12px;
                padding: 2rem;
                max-width: 600px;
                max-height: 70vh;
                overflow-y: auto;
                transform: scale(0.9);
                transition: transform 0.3s ease;
            }

            .keyboard-shortcuts-modal.visible .shortcuts-content {
                transform: scale(1);
            }

            .shortcuts-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
                margin-top: 1rem;
            }

            .shortcut-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem;
                background: #f8fafc;
                border-radius: 8px;
                border-left: 3px solid #3b82f6;
            }

            .shortcut-key {
                background: #374151;
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 0.875rem;
                font-weight: bold;
            }

            .keyboard-hint {
                position: fixed;
                bottom: 120px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-size: 0.875rem;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
                z-index: 1001;
            }

            .keyboard-hint.visible {
                opacity: 1;
            }

            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            /* Dark mode styles */
            .dark-mode .quick-action-item {
                background: var(--bg-primary);
                color: var(--text-primary);
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            }

            .dark-mode .shortcuts-content {
                background: var(--bg-primary);
                color: var(--text-primary);
            }

            .dark-mode .shortcut-item {
                background: var(--bg-tertiary);
            }
        `;
        document.head.appendChild(styles);
    }

    createQuickActionsToolbar() {
        // Create FAB button
        const fab = document.createElement('button');
        fab.className = 'quick-actions-fab';
        fab.id = 'quickActionsFab';
        fab.innerHTML = '<i class="fas fa-plus"></i>';
        fab.addEventListener('click', () => this.toggleQuickActions());
        
        // Create quick actions menu
        const menu = document.createElement('div');
        menu.className = 'quick-actions-menu';
        menu.id = 'quickActionsMenu';
        
        // Add page-specific actions
        menu.innerHTML = this.getQuickActionsForPage();
        
        document.body.appendChild(fab);
        document.body.appendChild(menu);

        // Create keyboard hint
        const hint = document.createElement('div');
        hint.className = 'keyboard-hint';
        hint.id = 'keyboardHint';
        hint.textContent = 'Press Ctrl+K for shortcuts';
        document.body.appendChild(hint);

        // Show hint briefly
        setTimeout(() => {
            hint.classList.add('visible');
            setTimeout(() => hint.classList.remove('visible'), 3000);
        }, 2000);
    }

    getQuickActionsForPage() {
        const actions = {
            dashboard: [
                { icon: 'fas fa-plus-circle', text: 'Add Product', action: 'addProduct', shortcut: 'Alt+P' },
                { icon: 'fas fa-shopping-cart', text: 'New Order', action: 'newOrder', shortcut: 'Alt+O' },
                { icon: 'fas fa-file-invoice', text: 'Create Invoice', action: 'createInvoice', shortcut: 'Alt+I' },
                { icon: 'fas fa-chart-bar', text: 'View Reports', action: 'viewReports', shortcut: 'Alt+R' },
                { icon: 'fas fa-search', text: 'Search', action: 'focusSearch', shortcut: 'Ctrl+K' }
            ],
            inventory: [
                { icon: 'fas fa-plus-circle', text: 'Add Product', action: 'addProduct', shortcut: 'Alt+P' },
                { icon: 'fas fa-qrcode', text: 'Scan Barcode', action: 'scanBarcode', shortcut: 'Alt+S' },
                { icon: 'fas fa-warehouse', text: 'Update Stock', action: 'updateStock', shortcut: 'Alt+U' },
                { icon: 'fas fa-download', text: 'Export Data', action: 'exportData', shortcut: 'Ctrl+E' },
                { icon: 'fas fa-filter', text: 'Filter Products', action: 'showFilters', shortcut: 'Alt+F' }
            ],
            orders: [
                { icon: 'fas fa-plus-circle', text: 'New Order', action: 'newOrder', shortcut: 'Alt+O' },
                { icon: 'fas fa-print', text: 'Print Orders', action: 'printOrders', shortcut: 'Ctrl+P' },
                { icon: 'fas fa-check', text: 'Mark Complete', action: 'markComplete', shortcut: 'Alt+C' },
                { icon: 'fas fa-download', text: 'Export Orders', action: 'exportOrders', shortcut: 'Ctrl+E' },
                { icon: 'fas fa-search', text: 'Search Orders', action: 'focusSearch', shortcut: 'Ctrl+K' }
            ],
            billing: [
                { icon: 'fas fa-file-invoice', text: 'New Invoice', action: 'newInvoice', shortcut: 'Alt+I' },
                { icon: 'fas fa-qrcode', text: 'Generate QR', action: 'generateQR', shortcut: 'Alt+Q' },
                { icon: 'fas fa-print', text: 'Print Invoice', action: 'printInvoice', shortcut: 'Ctrl+P' },
                { icon: 'fas fa-calculator', text: 'GST Calculator', action: 'gstCalculator', shortcut: 'Alt+G' },
                { icon: 'fas fa-history', text: 'Invoice History', action: 'invoiceHistory', shortcut: 'Alt+H' }
            ]
        };

        const pageActions = actions[this.currentPage] || actions.dashboard;
        
        return pageActions.map(action => `
            <button class="quick-action-item" onclick="quickActions.executeAction('${action.action}')" title="${action.shortcut}">
                <i class="${action.icon}"></i>
                ${action.text}
            </button>
        `).join('');
    }

    toggleQuickActions() {
        const fab = document.getElementById('quickActionsFab');
        const menu = document.getElementById('quickActionsMenu');
        
        if (this.isQuickActionsVisible) {
            fab.classList.remove('active');
            menu.classList.remove('visible');
            this.isQuickActionsVisible = false;
        } else {
            fab.classList.add('active');
            menu.classList.add('visible');
            this.isQuickActionsVisible = true;
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K - Show shortcuts modal
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.showShortcutsModal();
                return;
            }

            // Global shortcuts
            if (e.altKey) {
                switch (e.key) {
                    case 'p':
                        e.preventDefault();
                        this.executeAction('addProduct');
                        break;
                    case 'o':
                        e.preventDefault();
                        this.executeAction('newOrder');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.executeAction('createInvoice');
                        break;
                    case 'r':
                        e.preventDefault();
                        this.executeAction('viewReports');
                        break;
                    case 's':
                        e.preventDefault();
                        this.executeAction('scanBarcode');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.executeAction('updateStock');
                        break;
                    case 'f':
                        e.preventDefault();
                        this.executeAction('showFilters');
                        break;
                    case 'c':
                        e.preventDefault();
                        this.executeAction('markComplete');
                        break;
                    case 'q':
                        e.preventDefault();
                        this.executeAction('generateQR');
                        break;
                    case 'g':
                        e.preventDefault();
                        this.executeAction('gstCalculator');
                        break;
                    case 'h':
                        e.preventDefault();
                        this.executeAction('invoiceHistory');
                        break;
                }
            }

            // Ctrl shortcuts
            if (e.ctrlKey) {
                switch (e.key) {
                    case 'e':
                        e.preventDefault();
                        this.executeAction('exportData');
                        break;
                    case 'p':
                        e.preventDefault();
                        this.executeAction('printOrders');
                        break;
                }
            }

            // ESC to close quick actions
            if (e.key === 'Escape') {
                if (this.isQuickActionsVisible) {
                    this.toggleQuickActions();
                }
                this.hideShortcutsModal();
            }
        });
    }

    setupGlobalShortcuts() {
        // Focus search on Ctrl+K or /
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey && e.key === 'k') || e.key === '/') {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.focusSearch();
                }
            }
        });
    }

    executeAction(action) {
        // Close quick actions menu
        if (this.isQuickActionsVisible) {
            this.toggleQuickActions();
        }

        switch (action) {
            case 'addProduct':
                this.addProduct();
                break;
            case 'newOrder':
                this.newOrder();
                break;
            case 'createInvoice':
                this.createInvoice();
                break;
            case 'viewReports':
                this.viewReports();
                break;
            case 'scanBarcode':
                this.scanBarcode();
                break;
            case 'updateStock':
                this.updateStock();
                break;
            case 'exportData':
                this.exportData();
                break;
            case 'showFilters':
                this.showFilters();
                break;
            case 'printOrders':
                this.printOrders();
                break;
            case 'markComplete':
                this.markComplete();
                break;
            case 'focusSearch':
                this.focusSearch();
                break;
            case 'generateQR':
                this.generateQR();
                break;
            case 'gstCalculator':
                this.gstCalculator();
                break;
            case 'invoiceHistory':
                this.invoiceHistory();
                break;
        }
    }

    // Action implementations
    addProduct() {
        showNotification('Opening Add Product form...', 'info');
        // Navigate or show modal
        const addProductBtn = document.querySelector('[onclick*="addProduct"], .btn-primary');
        if (addProductBtn) {
            addProductBtn.click();
        } else {
            window.location.href = '/inventory';
        }
    }

    newOrder() {
        showNotification('Creating new order...', 'info');
        window.location.href = '/orders';
    }

    createInvoice() {
        showNotification('Opening invoice creation...', 'info');
        window.location.href = '/billing';
    }

    viewReports() {
        showNotification('Opening reports...', 'info');
        window.location.href = '/reports';
    }

    scanBarcode() {
        if (window.barcodeScanner) {
            barcodeScanner.startScanning((barcode) => {
                showNotification(`Barcode scanned: ${barcode}`, 'success');
                // Handle barcode result
            });
        } else {
            showNotification('Barcode scanner not available', 'error');
        }
    }

    updateStock() {
        showNotification('Opening stock update...', 'info');
        // Show bulk stock update modal or navigate to inventory
        window.location.href = '/inventory';
    }

    exportData() {
        showNotification('Exporting data...', 'info');
        // Trigger export functionality
        if (window.bulkOperations) {
            bulkOperations.bulkExport();
        }
    }

    showFilters() {
        const filterBtn = document.querySelector('[data-filter], .filter-btn');
        if (filterBtn) {
            filterBtn.click();
        } else {
            showNotification('Filters not available on this page', 'warning');
        }
    }

    printOrders() {
        window.print();
    }

    markComplete() {
        showNotification('Mark complete functionality coming soon!', 'info');
    }

    focusSearch() {
        const searchInput = document.querySelector('#globalSearch, .search-box input, [type="search"]');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        } else {
            showNotification('Search not available on this page', 'warning');
        }
    }

    generateQR() {
        showNotification('QR code generation coming soon!', 'info');
    }

    gstCalculator() {
        this.showGSTCalculator();
    }

    invoiceHistory() {
        showNotification('Opening invoice history...', 'info');
        window.location.href = '/billing';
    }

    showGSTCalculator() {
        const modal = document.createElement('div');
        modal.className = 'keyboard-shortcuts-modal visible';
        modal.innerHTML = `
            <div class="shortcuts-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h2>GST Calculator</h2>
                    <button onclick="this.closest('.keyboard-shortcuts-modal').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                <div style="display: grid; gap: 1rem;">
                    <div>
                        <label>Amount (₹):</label>
                        <input type="number" id="gstAmount" placeholder="Enter amount" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div>
                        <label>GST Rate (%):</label>
                        <select id="gstRate" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18" selected>18%</option>
                            <option value="28">28%</option>
                        </select>
                    </div>
                    <div>
                        <label>State:</label>
                        <select id="gstState" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="same">Same State (CGST + SGST)</option>
                            <option value="different">Different State (IGST)</option>
                        </select>
                    </div>
                    <button onclick="quickActions.calculateGST()" style="padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Calculate</button>
                    <div id="gstResult" style="padding: 1rem; background: #f8fafc; border-radius: 4px; margin-top: 1rem; display: none;">
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    calculateGST() {
        const amount = parseFloat(document.getElementById('gstAmount').value);
        const rate = parseFloat(document.getElementById('gstRate').value);
        const state = document.getElementById('gstState').value;

        if (!amount || amount <= 0) {
            showNotification('Please enter a valid amount', 'error');
            return;
        }

        const gstAmount = (amount * rate) / 100;
        const totalAmount = amount + gstAmount;

        let breakdown;
        if (state === 'same') {
            const cgst = gstAmount / 2;
            const sgst = gstAmount / 2;
            breakdown = `
                <h4>GST Breakdown:</h4>
                <p><strong>Base Amount:</strong> ₹${amount.toFixed(2)}</p>
                <p><strong>CGST (${rate/2}%):</strong> ₹${cgst.toFixed(2)}</p>
                <p><strong>SGST (${rate/2}%):</strong> ₹${sgst.toFixed(2)}</p>
                <p><strong>Total GST:</strong> ₹${gstAmount.toFixed(2)}</p>
                <p><strong>Total Amount:</strong> ₹${totalAmount.toFixed(2)}</p>
            `;
        } else {
            breakdown = `
                <h4>GST Breakdown:</h4>
                <p><strong>Base Amount:</strong> ₹${amount.toFixed(2)}</p>
                <p><strong>IGST (${rate}%):</strong> ₹${gstAmount.toFixed(2)}</p>
                <p><strong>Total Amount:</strong> ₹${totalAmount.toFixed(2)}</p>
            `;
        }

        const result = document.getElementById('gstResult');
        result.innerHTML = breakdown;
        result.style.display = 'block';
    }

    showShortcutsModal() {
        const modal = document.createElement('div');
        modal.className = 'keyboard-shortcuts-modal';
        modal.innerHTML = `
            <div class="shortcuts-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h2>Keyboard Shortcuts</h2>
                    <button onclick="quickActions.hideShortcutsModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                <div class="shortcuts-grid">
                    <div class="shortcut-item">
                        <span>Add Product</span>
                        <span class="shortcut-key">Alt + P</span>
                    </div>
                    <div class="shortcut-item">
                        <span>New Order</span>
                        <span class="shortcut-key">Alt + O</span>
                    </div>
                    <div class="shortcut-item">
                        <span>Create Invoice</span>
                        <span class="shortcut-key">Alt + I</span>
                    </div>
                    <div class="shortcut-item">
                        <span>View Reports</span>
                        <span class="shortcut-key">Alt + R</span>
                    </div>
                    <div class="shortcut-item">
                        <span>Scan Barcode</span>
                        <span class="shortcut-key">Alt + S</span>
                    </div>
                    <div class="shortcut-item">
                        <span>Update Stock</span>
                        <span class="shortcut-key">Alt + U</span>
                    </div>
                    <div class="shortcut-item">
                        <span>Export Data</span>
                        <span class="shortcut-key">Ctrl + E</span>
                    </div>
                    <div class="shortcut-item">
                        <span>Print</span>
                        <span class="shortcut-key">Ctrl + P</span>
                    </div>
                    <div class="shortcut-item">
                        <span>Search</span>
                        <span class="shortcut-key">Ctrl + K</span>
                    </div>
                    <div class="shortcut-item">
                        <span>Show Filters</span>
                        <span class="shortcut-key">Alt + F</span>
                    </div>
                    <div class="shortcut-item">
                        <span>GST Calculator</span>
                        <span class="shortcut-key">Alt + G</span>
                    </div>
                    <div class="shortcut-item">
                        <span>Close Dialog</span>
                        <span class="shortcut-key">Escape</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('visible');
        }, 10);
    }

    hideShortcutsModal() {
        const modal = document.querySelector('.keyboard-shortcuts-modal');
        if (modal) {
            modal.classList.remove('visible');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }
}

// Initialize Quick Actions Manager
const quickActions = new QuickActionsManager();

// Export for use in other modules
window.QuickActionsManager = QuickActionsManager;
window.quickActions = quickActions;