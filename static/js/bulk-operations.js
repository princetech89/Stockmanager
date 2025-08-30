// Bulk Operations Manager
class BulkOperationsManager {
    constructor() {
        this.selectedItems = new Set();
        this.currentPage = null;
        this.init();
    }

    init() {
        this.addBulkOperationStyles();
        this.setupBulkSelectionUI();
        this.detectCurrentPage();
    }

    detectCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('/inventory')) {
            this.currentPage = 'inventory';
            this.setupInventoryBulkOperations();
        } else if (path.includes('/orders')) {
            this.currentPage = 'orders';
            this.setupOrdersBulkOperations();
        }
    }

    addBulkOperationStyles() {
        const styles = document.createElement('style');
        styles.id = 'bulk-operations-styles';
        styles.textContent = `
            .bulk-operations-bar {
                position: sticky;
                top: var(--topbar-height);
                background: linear-gradient(135deg, #3b82f6, #1e40af);
                color: white;
                padding: 1rem 2rem;
                border-radius: 0 0 12px 12px;
                margin-bottom: 1rem;
                transform: translateY(-100%);
                opacity: 0;
                transition: all 0.3s ease;
                z-index: 100;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
            }

            .bulk-operations-bar.visible {
                transform: translateY(0);
                opacity: 1;
            }

            .bulk-operations-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
            }

            .bulk-selection-info {
                display: flex;
                align-items: center;
                gap: 1rem;
                font-weight: 500;
            }

            .bulk-actions {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }

            .bulk-btn {
                padding: 0.5rem 1rem;
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
            }

            .bulk-btn:hover {
                background: rgba(255, 255, 255, 0.3);
                border-color: rgba(255, 255, 255, 0.5);
            }

            .bulk-select-all {
                appearance: none;
                width: 20px;
                height: 20px;
                border: 2px solid #d1d5db;
                border-radius: 4px;
                cursor: pointer;
                position: relative;
                transition: all 0.2s ease;
            }

            .bulk-select-all:checked {
                background: #3b82f6;
                border-color: #3b82f6;
            }

            .bulk-select-all:checked::after {
                content: '✓';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 14px;
            }

            .row-selector {
                appearance: none;
                width: 18px;
                height: 18px;
                border: 2px solid #d1d5db;
                border-radius: 4px;
                cursor: pointer;
                position: relative;
                transition: all 0.2s ease;
            }

            .row-selector:checked {
                background: #3b82f6;
                border-color: #3b82f6;
            }

            .row-selector:checked::after {
                content: '✓';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 12px;
            }

            .table-row-selected {
                background: rgba(59, 130, 246, 0.1) !important;
                border-left: 3px solid #3b82f6 !important;
            }

            .bulk-progress {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 2rem;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                z-index: 10000;
                min-width: 300px;
                text-align: center;
            }

            .bulk-progress h3 {
                margin-bottom: 1rem;
                color: #374151;
            }

            .progress-bar {
                width: 100%;
                height: 8px;
                background: #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 1rem;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(135deg, #3b82f6, #1e40af);
                width: 0%;
                transition: width 0.3s ease;
            }

            .bulk-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.5);
                z-index: 9999;
            }
        `;
        document.head.appendChild(styles);
    }

    setupBulkSelectionUI() {
        // Create bulk operations bar
        const bulkBar = document.createElement('div');
        bulkBar.className = 'bulk-operations-bar';
        bulkBar.id = 'bulkOperationsBar';
        bulkBar.innerHTML = `
            <div class="bulk-operations-content">
                <div class="bulk-selection-info">
                    <span id="selectedCount">0 items selected</span>
                    <button class="bulk-btn" onclick="bulkOperations.clearSelection()">
                        <i class="fas fa-times"></i>
                        Clear Selection
                    </button>
                </div>
                <div class="bulk-actions" id="bulkActions">
                    <!-- Dynamic actions will be added here -->
                </div>
            </div>
        `;

        // Insert after topbar
        const topbar = document.querySelector('.topbar');
        if (topbar) {
            topbar.after(bulkBar);
        }
    }

    setupInventoryBulkOperations() {
        this.addTableSelectors('inventory');
        this.addInventoryBulkActions();
    }

    setupOrdersBulkOperations() {
        this.addTableSelectors('orders');
        this.addOrdersBulkActions();
    }

    addTableSelectors(type) {
        // Add select all checkbox to table header
        const table = document.querySelector('table');
        if (!table) return;

        const headerRow = table.querySelector('thead tr');
        if (headerRow) {
            const selectAllCell = document.createElement('th');
            selectAllCell.innerHTML = '<input type="checkbox" class="bulk-select-all" onchange="bulkOperations.toggleSelectAll(this)">';
            headerRow.insertBefore(selectAllCell, headerRow.firstChild);
        }

        // Add row selectors
        const bodyRows = table.querySelectorAll('tbody tr');
        bodyRows.forEach((row, index) => {
            const selectorCell = document.createElement('td');
            selectorCell.innerHTML = `<input type="checkbox" class="row-selector" data-id="${index}" onchange="bulkOperations.toggleRowSelection(this, ${index})">`;
            row.insertBefore(selectorCell, row.firstChild);
        });
    }

    addInventoryBulkActions() {
        const actionsContainer = document.getElementById('bulkActions');
        if (!actionsContainer) return;

        actionsContainer.innerHTML = `
            <button class="bulk-btn" onclick="bulkOperations.bulkUpdatePrices()">
                <i class="fas fa-tags"></i>
                Update Prices
            </button>
            <button class="bulk-btn" onclick="bulkOperations.bulkUpdateStock()">
                <i class="fas fa-warehouse"></i>
                Update Stock
            </button>
            <button class="bulk-btn" onclick="bulkOperations.bulkUpdateCategories()">
                <i class="fas fa-folder"></i>
                Update Categories
            </button>
            <button class="bulk-btn" onclick="bulkOperations.bulkExport()">
                <i class="fas fa-download"></i>
                Export Selected
            </button>
            <button class="bulk-btn" onclick="bulkOperations.bulkDelete()">
                <i class="fas fa-trash"></i>
                Delete
            </button>
        `;
    }

    addOrdersBulkActions() {
        const actionsContainer = document.getElementById('bulkActions');
        if (!actionsContainer) return;

        actionsContainer.innerHTML = `
            <button class="bulk-btn" onclick="bulkOperations.bulkUpdateStatus()">
                <i class="fas fa-check"></i>
                Update Status
            </button>
            <button class="bulk-btn" onclick="bulkOperations.bulkPrint()">
                <i class="fas fa-print"></i>
                Print Orders
            </button>
            <button class="bulk-btn" onclick="bulkOperations.bulkExport()">
                <i class="fas fa-download"></i>
                Export Selected
            </button>
            <button class="bulk-btn" onclick="bulkOperations.bulkCancel()">
                <i class="fas fa-ban"></i>
                Cancel Orders
            </button>
        `;
    }

    toggleSelectAll(checkbox) {
        const rowSelectors = document.querySelectorAll('.row-selector');
        const isChecked = checkbox.checked;
        
        rowSelectors.forEach(selector => {
            selector.checked = isChecked;
            this.toggleRowSelection(selector, parseInt(selector.dataset.id), false);
        });

        this.updateBulkOperationsBar();
    }

    toggleRowSelection(checkbox, id, updateBar = true) {
        const row = checkbox.closest('tr');
        
        if (checkbox.checked) {
            this.selectedItems.add(id);
            row.classList.add('table-row-selected');
        } else {
            this.selectedItems.delete(id);
            row.classList.remove('table-row-selected');
            
            // Uncheck select all if not all items are selected
            const selectAllCheckbox = document.querySelector('.bulk-select-all');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
            }
        }

        if (updateBar) {
            this.updateBulkOperationsBar();
        }
    }

    updateBulkOperationsBar() {
        const bulkBar = document.getElementById('bulkOperationsBar');
        const selectedCount = document.getElementById('selectedCount');
        
        if (this.selectedItems.size > 0) {
            bulkBar.classList.add('visible');
            selectedCount.textContent = `${this.selectedItems.size} item${this.selectedItems.size > 1 ? 's' : ''} selected`;
        } else {
            bulkBar.classList.remove('visible');
        }
    }

    clearSelection() {
        this.selectedItems.clear();
        
        // Uncheck all checkboxes
        document.querySelectorAll('.row-selector, .bulk-select-all').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Remove selection styling
        document.querySelectorAll('.table-row-selected').forEach(row => {
            row.classList.remove('table-row-selected');
        });
        
        this.updateBulkOperationsBar();
    }

    showProgress(title, progress = 0) {
        // Remove existing progress modal
        const existing = document.querySelector('.bulk-progress');
        if (existing) {
            existing.remove();
        }

        const overlay = document.createElement('div');
        overlay.className = 'bulk-overlay';
        
        const progressModal = document.createElement('div');
        progressModal.className = 'bulk-progress';
        progressModal.innerHTML = `
            <h3>${title}</h3>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <p id="progressText">Processing...</p>
        `;
        
        document.body.appendChild(overlay);
        document.body.appendChild(progressModal);
        
        return progressModal;
    }

    hideProgress() {
        const overlay = document.querySelector('.bulk-overlay');
        const progressModal = document.querySelector('.bulk-progress');
        
        if (overlay) overlay.remove();
        if (progressModal) progressModal.remove();
    }

    // Bulk Operations
    async bulkUpdatePrices() {
        if (this.selectedItems.size === 0) return;
        
        const newPrice = prompt('Enter new price for selected items:');
        if (!newPrice || isNaN(newPrice)) return;
        
        const progressModal = this.showProgress('Updating Prices');
        
        let completed = 0;
        const total = this.selectedItems.size;
        
        for (const itemId of this.selectedItems) {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 100));
            
            completed++;
            const progress = (completed / total) * 100;
            
            const progressFill = progressModal.querySelector('.progress-fill');
            const progressText = progressModal.querySelector('#progressText');
            
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `Updated ${completed} of ${total} items`;
        }
        
        this.hideProgress();
        showNotification(`Updated prices for ${total} items`, 'success');
        this.clearSelection();
    }

    async bulkUpdateStock() {
        if (this.selectedItems.size === 0) return;
        
        const stockChange = prompt('Enter stock change (use + or - for relative changes):');
        if (!stockChange) return;
        
        const progressModal = this.showProgress('Updating Stock');
        
        let completed = 0;
        const total = this.selectedItems.size;
        
        for (const itemId of this.selectedItems) {
            await new Promise(resolve => setTimeout(resolve, 100));
            
            completed++;
            const progress = (completed / total) * 100;
            
            const progressFill = progressModal.querySelector('.progress-fill');
            const progressText = progressModal.querySelector('#progressText');
            
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `Updated ${completed} of ${total} items`;
        }
        
        this.hideProgress();
        showNotification(`Updated stock for ${total} items`, 'success');
        this.clearSelection();
    }

    bulkUpdateCategories() {
        if (this.selectedItems.size === 0) return;
        
        const newCategory = prompt('Enter new category for selected items:');
        if (!newCategory) return;
        
        showNotification(`Category update for ${this.selectedItems.size} items initiated`, 'info');
        this.clearSelection();
    }

    bulkDelete() {
        if (this.selectedItems.size === 0) return;
        
        const confirmed = confirm(`Are you sure you want to delete ${this.selectedItems.size} items? This cannot be undone.`);
        if (!confirmed) return;
        
        showNotification(`Deleted ${this.selectedItems.size} items`, 'success');
        this.clearSelection();
    }

    bulkUpdateStatus() {
        if (this.selectedItems.size === 0) return;
        
        const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        const newStatus = prompt(`Enter new status (${statuses.join(', ')}):`);
        if (!newStatus || !statuses.includes(newStatus.toLowerCase())) {
            showNotification('Invalid status', 'error');
            return;
        }
        
        showNotification(`Updated status for ${this.selectedItems.size} orders`, 'success');
        this.clearSelection();
    }

    bulkExport() {
        if (this.selectedItems.size === 0) return;
        
        const data = Array.from(this.selectedItems).map(id => ({
            id: id,
            exported_at: new Date().toISOString()
        }));
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulk-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification(`Exported ${this.selectedItems.size} items`, 'success');
        this.clearSelection();
    }

    bulkPrint() {
        if (this.selectedItems.size === 0) return;
        
        // Open print dialog with selected items
        showNotification(`Printing ${this.selectedItems.size} orders`, 'info');
        this.clearSelection();
    }

    bulkCancel() {
        if (this.selectedItems.size === 0) return;
        
        const confirmed = confirm(`Are you sure you want to cancel ${this.selectedItems.size} orders?`);
        if (!confirmed) return;
        
        showNotification(`Cancelled ${this.selectedItems.size} orders`, 'success');
        this.clearSelection();
    }
}

// Initialize Bulk Operations Manager
const bulkOperations = new BulkOperationsManager();

// Export for use in other modules
window.BulkOperationsManager = BulkOperationsManager;
window.bulkOperations = bulkOperations;