// Modern Side Panel System - Reliable and Simple
class ModernSidePanel {
    constructor() {
        this.isOpen = false;
        this.currentMode = 'add';
        this.currentData = null;
        this.overlay = null;
        this.panel = null;
        this.escHandler = null;
        this.overlayClickHandler = null;
    }

    open(mode = 'add', data = null) {
        console.log('Opening modern side panel in', mode, 'mode');
        
        // Close any existing panel first
        this.close();
        
        this.currentMode = mode;
        this.currentData = data;
        
        this.createPanel();
        this.setupEventListeners();
        this.show();
        
        this.isOpen = true;
    }

    createPanel() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'modern-panel-overlay';
        this.overlay.id = 'modernPanelOverlay';
        
        // Create panel
        this.panel = document.createElement('div');
        this.panel.className = 'modern-side-panel';
        this.panel.id = 'modernSidePanel';
        
        // Set panel content
        this.panel.innerHTML = this.getPanelHTML();
        
        // Append to DOM
        this.overlay.appendChild(this.panel);
        document.body.appendChild(this.overlay);
        
        // Setup form interactions
        this.setupFormInteractions();
    }

    getPanelHTML() {
        const title = this.currentMode === 'add' ? 'Add New Product' : 'Edit Product';
        
        return `
            <div class="modern-panel-header">
                <h3 class="modern-panel-title">${title}</h3>
                <button type="button" class="modern-close-btn" id="modernCloseBtn">×</button>
            </div>
            <div class="modern-panel-body">
                <form id="modernProductForm" class="modern-product-form">
                    <div class="modern-form-group">
                        <label class="modern-form-label" for="modernProductName">Product Name *</label>
                        <input type="text" id="modernProductName" name="name" class="modern-form-input" required placeholder="Enter product name">
                    </div>
                    
                    <div class="modern-form-group">
                        <label class="modern-form-label" for="modernProductSKU">SKU *</label>
                        <input type="text" id="modernProductSKU" name="sku" class="modern-form-input" required readonly placeholder="Auto-generated">
                        <small class="modern-form-help">Auto-generated based on name and category</small>
                    </div>
                    
                    <div class="modern-form-group">
                        <label class="modern-form-label" for="modernProductCategory">Category *</label>
                        <select id="modernProductCategory" name="category" class="modern-form-input" required>
                            <option value="">Select Category</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Clothing">Clothing</option>
                            <option value="Food">Food & Beverages</option>
                            <option value="Books">Books</option>
                            <option value="Home">Home & Garden</option>
                            <option value="Sports">Sports</option>
                            <option value="Toys">Toys</option>
                            <option value="Beauty">Beauty & Health</option>
                            <option value="Automotive">Automotive</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    
                    <div class="modern-form-row">
                        <div class="modern-form-group modern-form-half">
                            <label class="modern-form-label" for="modernProductPrice">Price (₹) *</label>
                            <input type="number" id="modernProductPrice" name="price" class="modern-form-input" step="0.01" min="0" required placeholder="0.00">
                        </div>
                        <div class="modern-form-group modern-form-half">
                            <label class="modern-form-label" for="modernProductStock">Stock Quantity *</label>
                            <input type="number" id="modernProductStock" name="stock" class="modern-form-input" min="0" required placeholder="0">
                        </div>
                    </div>
                    
                    <div class="modern-form-row">
                        <div class="modern-form-group modern-form-half">
                            <label class="modern-form-label" for="modernProductMinStock">Minimum Stock</label>
                            <input type="number" id="modernProductMinStock" name="min_stock" class="modern-form-input" min="0" value="10" placeholder="10">
                        </div>
                        <div class="modern-form-group modern-form-half">
                            <label class="modern-form-label" for="modernProductUnit">Unit</label>
                            <select id="modernProductUnit" name="unit" class="modern-form-input">
                                <option value="pcs">Pieces</option>
                                <option value="kg">Kilograms</option>
                                <option value="ltr">Liters</option>
                                <option value="mtr">Meters</option>
                                <option value="box">Boxes</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="modern-form-row">
                        <div class="modern-form-group modern-form-half">
                            <label class="modern-form-label" for="modernProductHSN">HSN Code</label>
                            <input type="text" id="modernProductHSN" name="hsn_code" class="modern-form-input" placeholder="e.g., 85171200">
                        </div>
                        <div class="modern-form-group modern-form-half">
                            <label class="modern-form-label" for="modernProductGST">GST Rate (%)</label>
                            <select id="modernProductGST" name="gst_rate" class="modern-form-input">
                                <option value="0">0% (Exempt)</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18" selected>18%</option>
                                <option value="28">28%</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="modern-form-group">
                        <label class="modern-form-label" for="modernProductDescription">Description</label>
                        <textarea id="modernProductDescription" name="description" class="modern-form-input" rows="3" placeholder="Product description (optional)"></textarea>
                    </div>
                    
                    <div class="modern-checkbox-group">
                        <input type="checkbox" id="modernProductActive" name="active" checked>
                        <label class="modern-form-label" for="modernProductActive">Active Product</label>
                    </div>
                </form>
            </div>
            <div class="modern-form-actions">
                <button type="button" class="modern-btn-cancel" id="modernCancelBtn">Cancel</button>
                <button type="button" class="modern-btn-save" id="modernSaveBtn">Save Product</button>
            </div>
        `;
    }

    setupEventListeners() {
        // Close button
        const closeBtn = document.getElementById('modernCloseBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('Close button clicked');
                this.close();
            });
        }
        
        // Cancel button
        const cancelBtn = document.getElementById('modernCancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                console.log('Cancel button clicked');
                this.close();
            });
        }
        
        // Save button
        const saveBtn = document.getElementById('modernSaveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                console.log('Save button clicked');
                this.saveProduct();
            });
        }
        
        // ESC key handler
        this.escHandler = (e) => {
            if (e.key === 'Escape') {
                console.log('ESC key pressed - closing panel');
                this.close();
            }
        };
        document.addEventListener('keydown', this.escHandler);
        
        // Overlay click handler
        this.overlayClickHandler = (e) => {
            if (e.target === this.overlay) {
                console.log('Overlay clicked - closing panel');
                this.close();
            }
        };
        this.overlay.addEventListener('click', this.overlayClickHandler);
    }

    setupFormInteractions() {
        // Auto-generate SKU
        const nameField = document.getElementById('modernProductName');
        const categoryField = document.getElementById('modernProductCategory');
        const skuField = document.getElementById('modernProductSKU');
        
        const generateSKU = () => {
            const name = nameField.value.trim();
            const category = categoryField.value;
            
            if (name && category) {
                const namePrefix = name.substring(0, 3).toUpperCase();
                const categoryPrefix = category.substring(0, 2).toUpperCase();
                const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                skuField.value = `${categoryPrefix}-${namePrefix}-${randomNum}`;
            }
        };
        
        if (nameField && categoryField && skuField) {
            nameField.addEventListener('blur', generateSKU);
            categoryField.addEventListener('change', generateSKU);
        }
    }

    show() {
        // Force reflow before showing
        this.overlay.offsetHeight;
        
        setTimeout(() => {
            this.overlay.classList.add('show');
            this.panel.classList.add('show');
        }, 10);
        
        // Focus first input after animation
        setTimeout(() => {
            const firstInput = document.getElementById('modernProductName');
            if (firstInput) {
                firstInput.focus();
            }
        }, 400);
    }

    close() {
        if (!this.overlay || !this.panel) {
            return;
        }
        
        console.log('Closing modern side panel');
        
        // Remove show classes
        this.overlay.classList.remove('show');
        this.panel.classList.remove('show');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (this.overlay && this.overlay.parentNode) {
                this.overlay.remove();
            }
            this.cleanup();
        }, 400);
        
        this.isOpen = false;
    }

    cleanup() {
        // Remove event listeners
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
            this.escHandler = null;
        }
        
        if (this.overlayClickHandler && this.overlay) {
            this.overlay.removeEventListener('click', this.overlayClickHandler);
            this.overlayClickHandler = null;
        }
        
        // Reset references
        this.overlay = null;
        this.panel = null;
        this.currentMode = 'add';
        this.currentData = null;
        
        console.log('Modern side panel cleanup completed');
    }

    saveProduct() {
        const form = document.getElementById('modernProductForm');
        if (!form) {
            console.error('Form not found');
            return;
        }
        
        const formData = new FormData(form);
        
        const productData = {
            name: formData.get('name'),
            sku: formData.get('sku'),
            category: formData.get('category'),
            price: parseFloat(formData.get('price')),
            stock: parseInt(formData.get('stock')),
            min_stock: parseInt(formData.get('min_stock')) || 10,
            unit: formData.get('unit') || 'pcs',
            hsn_code: formData.get('hsn_code') || '',
            gst_rate: parseFloat(formData.get('gst_rate')) || 18,
            description: formData.get('description') || '',
            active: document.getElementById('modernProductActive')?.checked || false
        };
        
        console.log('Saving product:', productData);
        
        // Validate required fields
        if (!productData.name || !productData.sku || !productData.category || !productData.price) {
            this.showError('Please fill in all required fields');
            return;
        }
        
        try {
            // Show loading state
            this.showLoading();
            
            // Save product (integrate with existing data storage)
            if (window.inventoryManager && window.inventoryManager.dataStorage) {
                window.inventoryManager.dataStorage.createProduct(productData);
                
                // Refresh inventory if available
                if (window.inventoryManager.loadProducts) {
                    window.inventoryManager.loadProducts();
                }
            }
            
            // Show success and close
            setTimeout(() => {
                this.showSuccess();
                setTimeout(() => {
                    this.close();
                }, 1000);
            }, 500);
            
        } catch (error) {
            console.error('Error saving product:', error);
            this.showError('Error saving product. Please try again.');
        }
    }

    showLoading() {
        if (!this.panel) return;
        
        const loadingHTML = `
            <div class="modern-panel-loading">
                <div class="modern-loading-content">
                    <div class="modern-loading-spinner"></div>
                    <p>Saving product...</p>
                </div>
            </div>
        `;
        
        const existingLoading = this.panel.querySelector('.modern-panel-loading');
        if (existingLoading) {
            existingLoading.remove();
        }
        
        this.panel.insertAdjacentHTML('beforeend', loadingHTML);
    }

    showSuccess() {
        const loading = this.panel?.querySelector('.modern-panel-loading');
        if (loading) {
            loading.innerHTML = `
                <div class="modern-loading-content">
                    <div style="color: var(--accent-green); font-size: 48px; margin-bottom: 16px;">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <p style="color: var(--accent-green); font-weight: 600;">Product saved successfully!</p>
                </div>
            `;
        }
    }

    showError(message) {
        console.error('Panel error:', message);
        
        // Remove existing loading
        const loading = this.panel?.querySelector('.modern-panel-loading');
        if (loading) {
            loading.remove();
        }
        
        // Show error message
        alert(message); // Simple for now, can be enhanced later
    }
}

// Global instance
window.modernSidePanel = new ModernSidePanel();

// Global functions for template compatibility
window.openModernSidePanel = function(mode = 'add', data = null) {
    window.modernSidePanel.open(mode, data);
};

window.closeModernSidePanel = function() {
    window.modernSidePanel.close();
};