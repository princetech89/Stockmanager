/**
 * Inventory Management functionality for Stock Inventory Management System
 * Handles product CRUD operations, filtering, sorting, and inventory-specific features
 */

class InventoryManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.filters = {
            search: '',
            category: '',
            stock: ''
        };
        
        this.initializeInventory();
        this.bindEvents();
    }

    initializeInventory() {
        this.loadProducts();
        this.loadCategories();
        this.initializePagination();
    }

    bindEvents() {
        // Search input
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.addEventListener('input', app.debounce((e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            }, 300));
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.applyFilters();
            });
        }

        // Stock filter
        const stockFilter = document.getElementById('stockFilter');
        if (stockFilter) {
            stockFilter.addEventListener('change', (e) => {
                this.filters.stock = e.target.value;
                this.applyFilters();
            });
        }

        // Global search event listener
        document.addEventListener('globalSearch', (e) => {
            this.handleGlobalSearch(e.detail.query);
        });
    }

    async loadProducts() {
        try {
            this.showTableLoading();
            this.products = await window.DataStorage.getProducts();
            this.applyFilters();
        } catch (error) {
            console.error('Error loading products:', error);
            showNotification('Failed to load products', 'error');
            this.showTableError();
        }
    }

    loadCategories() {
        const categories = [...new Set(this.products.map(p => p.category).filter(Boolean))];
        const categoryFilter = document.getElementById('categoryFilter');
        
        if (categoryFilter) {
            const currentValue = categoryFilter.value;
            categoryFilter.innerHTML = '<option value="">All Categories</option>';
            
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                if (category === currentValue) {
                    option.selected = true;
                }
                categoryFilter.appendChild(option);
            });
        }
    }

    initializePagination() {
        // Set up pagination event handlers
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');
        
        if (prevButton) {
            prevButton.addEventListener('click', () => this.changePage(-1));
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => this.changePage(1));
        }
        
        // Initialize pagination display
        this.updatePagination();
    }

    applyFilters() {
        let filtered = [...this.products];

        // Apply search filter
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(search) ||
                product.sku.toLowerCase().includes(search) ||
                product.hsn_code.toLowerCase().includes(search) ||
                (product.category || '').toLowerCase().includes(search)
            );
        }

        // Apply category filter
        if (this.filters.category) {
            filtered = filtered.filter(product => product.category === this.filters.category);
        }

        // Apply stock filter
        if (this.filters.stock) {
            switch (this.filters.stock) {
                case 'low':
                    filtered = filtered.filter(product => 
                        (product.available_qty || 0) <= (product.min_qty || 10) && (product.available_qty || 0) > 0
                    );
                    break;
                case 'out':
                    filtered = filtered.filter(product => (product.available_qty || 0) === 0);
                    break;
                case 'available':
                    filtered = filtered.filter(product => (product.available_qty || 0) > (product.min_qty || 10));
                    break;
            }
        }

        this.filteredProducts = filtered;
        this.currentPage = 1;
        this.renderTable();
        this.updatePagination();
    }

    renderTable() {
        const tbody = document.getElementById('inventoryTableBody');
        if (!tbody) return;

        if (this.filteredProducts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-box-open"></i>
                            <h3>No Products Found</h3>
                            <p>No products match your current filters.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageProducts = this.filteredProducts.slice(startIndex, endIndex);

        const rows = pageProducts.map(product => {
            const stockQty = product.available_qty || 0;
            const minQty = product.min_qty || 10;
            const stockStatus = this.getStockStatus(stockQty, minQty);
            
            return `
                <tr>
                    <td>
                        <div class="product-info">
                            <strong>${product.name}</strong>
                            ${product.description ? `<br><small class="text-secondary">${product.description}</small>` : ''}
                        </div>
                    </td>
                    <td><code>${product.sku}</code></td>
                    <td>${product.hsn_code}</td>
                    <td>
                        <span class="category-badge">${product.category || 'Uncategorized'}</span>
                    </td>
                    <td class="text-right">${window.DataStorage.formatCurrency(product.unit_price)}</td>
                    <td class="text-right">${product.gst_rate}%</td>
                    <td class="text-right">
                        <strong class="${stockStatus.class}">${stockQty}</strong>
                    </td>
                    <td class="text-right">${minQty}</td>
                    <td>
                        <span class="status-badge ${stockStatus.badgeClass}">
                            ${stockStatus.text}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline" onclick="inventoryManager.editProduct(${product.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="inventoryManager.adjustStock(${product.id})" title="Adjust Stock">
                                <i class="fas fa-plus-minus"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="inventoryManager.deleteProduct(${product.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    }

    getStockStatus(stockQty, minQty) {
        if (stockQty === 0) {
            return {
                text: 'Out of Stock',
                class: 'text-danger',
                badgeClass: 'danger'
            };
        } else if (stockQty <= minQty) {
            return {
                text: 'Low Stock',
                class: 'text-warning',
                badgeClass: 'warning'
            };
        } else {
            return {
                text: 'In Stock',
                class: 'text-success',
                badgeClass: 'success'
            };
        }
    }

    updatePagination() {
        const totalItems = this.filteredProducts.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const startItem = totalItems > 0 ? (this.currentPage - 1) * this.itemsPerPage + 1 : 0;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, totalItems);

        // Update pagination info
        const entriesStart = document.getElementById('entriesStart');
        const entriesEnd = document.getElementById('entriesEnd');
        const totalEntries = document.getElementById('totalEntries');

        if (entriesStart) entriesStart.textContent = startItem;
        if (entriesEnd) entriesEnd.textContent = endItem;
        if (totalEntries) totalEntries.textContent = totalItems;

        // Update pagination controls
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');
        const pageNumbers = document.getElementById('pageNumbers');

        if (prevButton) {
            prevButton.disabled = this.currentPage === 1;
        }

        if (nextButton) {
            nextButton.disabled = this.currentPage === totalPages || totalPages === 0;
        }

        if (pageNumbers) {
            pageNumbers.innerHTML = this.generatePageNumbers(totalPages);
        }
    }

    generatePageNumbers(totalPages) {
        if (totalPages <= 1) return '';

        let html = '';
        const maxVisible = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button class="page-number ${i === this.currentPage ? 'active' : ''}" 
                        onclick="inventoryManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        return html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
        this.updatePagination();
    }

    changePage(direction) {
        const totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
        const newPage = this.currentPage + direction;

        if (newPage >= 1 && newPage <= totalPages) {
            this.goToPage(newPage);
        }
    }

    clearFilters() {
        this.filters = { search: '', category: '', stock: '' };
        
        document.getElementById('productSearch').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('stockFilter').value = '';
        
        this.applyFilters();
        showNotification('Filters cleared', 'info', 2000);
    }

    sortTable(columnIndex) {
        const columns = ['name', 'sku', 'hsn_code', 'category', 'unit_price', 'gst_rate', 'available_qty', 'min_qty'];
        const column = columns[columnIndex];
        
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.filteredProducts.sort((a, b) => {
            let aValue = a[column] || '';
            let bValue = b[column] || '';

            // Handle numeric columns
            if (['unit_price', 'gst_rate', 'available_qty', 'min_qty'].includes(column)) {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            } else {
                aValue = aValue.toString().toLowerCase();
                bValue = bValue.toString().toLowerCase();
            }

            let comparison = 0;
            if (aValue < bValue) comparison = -1;
            if (aValue > bValue) comparison = 1;

            return this.sortDirection === 'desc' ? -comparison : comparison;
        });

        this.renderTable();
        this.updateSortIndicators(columnIndex);
    }

    updateSortIndicators(activeColumn) {
        const headers = document.querySelectorAll('#inventoryTable th');
        headers.forEach((header, index) => {
            const icon = header.querySelector('i');
            if (icon) {
                if (index === activeColumn) {
                    icon.className = this.sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
                } else {
                    icon.className = 'fas fa-sort';
                }
            }
        });
    }

    openAddProductModal() {
        this.openNewSidePanel();
    }

    openNewSidePanel() {
        console.log('Opening new side panel');
        
        // Remove existing panel if any
        const existingOverlay = document.getElementById('panelOverlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // Create new overlay
        const overlay = document.createElement('div');
        overlay.className = 'panel-overlay';
        overlay.id = 'panelOverlay';
        
        // Create new side panel
        const panel = document.createElement('div');
        panel.className = 'new-side-panel';
        panel.id = 'newSidePanel';
        panel.innerHTML = `
            <div class="panel-header">
                <h3>Add New Product</h3>
                <button type="button" class="close-btn" id="closePanelBtn">×</button>
            </div>
            <div class="panel-body">
                <form id="productForm" class="product-form">
                    <div class="form-group">
                        <label for="productName">Product Name *</label>
                        <input type="text" id="productName" name="name" class="form-input" required placeholder="Enter product name">
                    </div>
                    
                    <div class="form-group">
                        <label for="productSKU">SKU *</label>
                        <input type="text" id="productSKU" name="sku" class="form-input" required readonly placeholder="Auto-generated">
                        <small>Auto-generated based on name and category</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="productCategory">Category *</label>
                        <select id="productCategory" name="category" class="form-input" required>
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
                    
                    <div class="form-row">
                        <div class="form-group half-width">
                            <label for="productPrice">Price (₹) *</label>
                            <input type="number" id="productPrice" name="price" class="form-input" step="0.01" min="0" required placeholder="0.00">
                        </div>
                        <div class="form-group half-width">
                            <label for="productStock">Stock Quantity *</label>
                            <input type="number" id="productStock" name="stock" class="form-input" min="0" required placeholder="0">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group half-width">
                            <label for="productMinStock">Minimum Stock</label>
                            <input type="number" id="productMinStock" name="min_stock" class="form-input" min="0" value="10" placeholder="10">
                        </div>
                        <div class="form-group half-width">
                            <label for="productUnit">Unit</label>
                            <select id="productUnit" name="unit" class="form-input">
                                <option value="pcs">Pieces</option>
                                <option value="kg">Kilograms</option>
                                <option value="ltr">Liters</option>
                                <option value="mtr">Meters</option>
                                <option value="box">Boxes</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group half-width">
                            <label for="productHSN">HSN Code</label>
                            <input type="text" id="productHSN" name="hsn_code" class="form-input" placeholder="e.g., 85171200">
                        </div>
                        <div class="form-group half-width">
                            <label for="productGST">GST Rate (%)</label>
                            <select id="productGST" name="gst_rate" class="form-input">
                                <option value="0">0% (Exempt)</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18" selected>18%</option>
                                <option value="28">28%</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="productDescription">Description</label>
                        <textarea id="productDescription" name="description" class="form-input" rows="3" placeholder="Product description (optional)"></textarea>
                    </div>
                    
                    <div class="form-group checkbox-group">
                        <input type="checkbox" id="productActive" name="active" checked>
                        <label for="productActive">Active Product</label>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn-cancel" id="cancelBtn">Cancel</button>
                        <button type="submit" class="btn-save">Save Product</button>
                    </div>
                </form>
            </div>
        `;
        
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        
        // Setup event listeners
        this.setupNewPanelEvents();
        
        // Setup form interactions
        this.setupNewFormInteractions();
        
        // Show panel with animation
        setTimeout(() => {
            overlay.classList.add('show');
            panel.classList.add('show');
        }, 10);
        
        // Focus first input
        setTimeout(() => {
            const firstInput = panel.querySelector('input[type="text"]');
            if (firstInput) {
                firstInput.focus();
            }
        }, 300);
    }

    oldOpenAnimatedSidePanel() {
        // Remove existing panels
        const existing = document.querySelector('.side-panel');
        if (existing) {
            existing.remove();
        }
        const existingBackdrop = document.querySelector('.side-panel-backdrop');
        if (existingBackdrop) {
            existingBackdrop.remove();
        }

        // Create backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'side-panel-backdrop';
        backdrop.addEventListener('click', (e) => {
            console.log('Backdrop clicked - closing panel');
            this.closeSidePanel();
            e.stopPropagation();
        });
        document.body.appendChild(backdrop);

        // Create side panel
        const panel = document.createElement('div');
        panel.className = 'side-panel';
        panel.innerHTML = `
            <div class="side-panel-header">
                <h2 class="side-panel-title">
                    <i class="fas fa-plus"></i>
                    Add New Product
                </h2>
                <button class="side-panel-close" onclick="inventoryManager.closeSidePanel()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="side-panel-body">
                <div class="form-progress">
                    <div class="form-progress-bar">
                        <div class="form-progress-fill" id="formProgressFill" style="width: 0%"></div>
                    </div>
                    <div class="form-progress-text" id="formProgressText">0% Complete</div>
                </div>
                
                <form id="addProductForm">
                    <div class="form-row animated">
                        <div class="form-group animated">
                            <label class="form-label" for="productName">Product Name *</label>
                            <input type="text" class="form-control animated" id="productName" required placeholder="Enter product name">
                        </div>
                        <div class="form-group animated">
                            <label class="form-label" for="productSKU">SKU *</label>
                            <input type="text" class="form-control animated" id="productSKU" required placeholder="Auto-generated">
                            <small class="text-secondary">Leave blank to auto-generate</small>
                        </div>
                    </div>
                    
                    <div class="form-row animated">
                        <div class="form-group animated">
                            <label class="form-label" for="productHSN">HSN Code *</label>
                            <input type="text" class="form-control animated" id="productHSN" required placeholder="HSN/SAC code">
                        </div>
                        <div class="form-group animated">
                            <label class="form-label" for="productCategory">Category *</label>
                            <input type="text" class="form-control animated" id="productCategory" list="categoryList" required placeholder="Select or create category">
                            <datalist id="categoryList">
                                ${this.getCategoryOptions()}
                            </datalist>
                        </div>
                    </div>
                    
                    <div class="form-row animated">
                        <div class="form-group animated">
                            <label class="form-label" for="productPrice">Unit Price (₹) *</label>
                            <input type="number" class="form-control animated" id="productPrice" step="0.01" min="0" required placeholder="0.00">
                        </div>
                        <div class="form-group animated">
                            <label class="form-label" for="productGST">GST Rate (%) *</label>
                            <select class="form-control animated" id="productGST" required>
                                <option value="0">0% (Exempt)</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18" selected>18%</option>
                                <option value="28">28%</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row animated">
                        <div class="form-group animated">
                            <label class="form-label" for="productStock">Initial Stock</label>
                            <input type="number" class="form-control animated" id="productStock" min="0" value="0" placeholder="0">
                        </div>
                        <div class="form-group animated">
                            <label class="form-label" for="productMinQty">Minimum Quantity</label>
                            <input type="number" class="form-control animated" id="productMinQty" min="0" value="10" placeholder="10">
                        </div>
                    </div>
                    
                    <div class="form-group animated">
                        <label class="form-label" for="productDescription">Description</label>
                        <textarea class="form-control animated" id="productDescription" rows="3" placeholder="Optional product description..."></textarea>
                    </div>
                </form>
            </div>
            
            <div class="side-panel-footer">
                <button type="button" class="btn btn-secondary animated" onclick="inventoryManager.closeSidePanel()">
                    <i class="fas fa-times"></i>
                    Cancel
                </button>
                <button type="button" class="btn btn-primary animated" id="saveProductBtn" onclick="inventoryManager.saveProduct()">
                    <i class="fas fa-plus"></i>
                    Add Product
                </button>
            </div>
            
            <div class="side-panel-loading" id="sidePanelLoading">
                <div>
                    <div class="loading-spinner"></div>
                    <p style="margin-top: 15px; color: var(--text-secondary);">Saving product...</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Trigger animations
        setTimeout(() => {
            backdrop.classList.add('active');
            panel.classList.add('active');
        }, 10);

        // Set up form interactions
        this.setupFormInteractions();
        
        // Set up comprehensive auto-close listeners
        this.setupAutoCloseListeners();
    }

    closeSidePanel() {
        console.log('Closing any side panel (fallback)');
        
        // Try closing new panel first
        const newPanel = document.getElementById('newSidePanel');
        if (newPanel) {
            this.closeNewSidePanel();
            return;
        }
        
        // Fallback to old panel system
        const panel = document.querySelector('.side-panel');
        const backdrop = document.querySelector('.side-panel-backdrop');
        
        if (panel && backdrop) {
            panel.classList.remove('active');
            panel.classList.add('closing');
            backdrop.classList.remove('active');
            
            setTimeout(() => {
                panel.remove();
                backdrop.remove();
                
                // Clean up auto-close listeners
                this.removeAutoCloseListeners();
            }, 400);
        }
        
        this.isEditing = false;
        this.currentProductId = null;
    }

    setupNewPanelEvents() {
        // Close button
        const closeBtn = document.getElementById('closePanelBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                console.log('Close button clicked');
                this.closeNewSidePanel();
            });
        }
        
        // Cancel button
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                console.log('Cancel button clicked');
                this.closeNewSidePanel();
            });
        }
        
        // ESC key
        this.newEscHandler = (e) => {
            if (e.key === 'Escape') {
                console.log('ESC pressed - closing new panel');
                this.closeNewSidePanel();
            }
        };
        document.addEventListener('keydown', this.newEscHandler);
        
        // Overlay click (outside panel)
        const overlay = document.getElementById('panelOverlay');
        if (overlay) {
            this.newOverlayClickHandler = (e) => {
                if (e.target === overlay) {
                    console.log('Overlay clicked - closing new panel');
                    this.closeNewSidePanel();
                }
            };
            overlay.addEventListener('click', this.newOverlayClickHandler);
        }
        
        // Form submit
        const form = document.getElementById('productForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Form submitted - saving product');
                this.saveNewProduct();
            });
        }
    }

    closeNewSidePanel() {
        console.log('Closing new side panel');
        
        const overlay = document.getElementById('panelOverlay');
        const panel = document.getElementById('newSidePanel');
        
        if (overlay && panel) {
            overlay.classList.remove('show');
            panel.classList.remove('show');
            
            setTimeout(() => {
                if (overlay && overlay.parentNode) {
                    overlay.remove();
                }
            }, 300);
        }
        
        // Clean up event listeners
        this.removeNewPanelEvents();
        
        // Reset form state
        this.isEditing = false;
        this.currentProductId = null;
    }

    removeNewPanelEvents() {
        if (this.newEscHandler) {
            document.removeEventListener('keydown', this.newEscHandler);
            this.newEscHandler = null;
        }
        if (this.newOverlayClickHandler) {
            const overlay = document.getElementById('panelOverlay');
            if (overlay) {
                overlay.removeEventListener('click', this.newOverlayClickHandler);
            }
            this.newOverlayClickHandler = null;
        }
        console.log('New panel events removed');
    }

    setupNewFormInteractions() {
        // Auto-generate SKU when name or category changes
        const nameField = document.getElementById('productName');
        const categoryField = document.getElementById('productCategory');
        const skuField = document.getElementById('productSKU');
        
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
        
        if (nameField && categoryField) {
            nameField.addEventListener('blur', generateSKU);
            categoryField.addEventListener('change', generateSKU);
        }
    }

    saveNewProduct() {
        const form = document.getElementById('productForm');
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
            active: document.getElementById('productActive').checked
        };
        
        console.log('Saving product:', productData);
        
        // Validate required fields
        if (!productData.name || !productData.sku || !productData.category || !productData.price) {
            alert('Please fill in all required fields');
            return;
        }
        
        try {
            // Add to data storage
            this.dataStorage.createProduct(productData);
            
            // Close panel
            this.closeNewSidePanel();
            
            // Refresh inventory
            this.loadProducts();
            
            // Show success message
            this.showNotification('Product added successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving product:', error);
            this.showNotification('Error saving product. Please try again.', 'error');
        }
    }

    setupSuccessAutoClose() {
        // Close panel after successful operations
        const originalSaveProduct = this.saveProduct.bind(this);
        this.saveProduct = async function() {
            const result = await originalSaveProduct();
            if (result && result.success) {
                // Auto-close after 2 seconds on success
                setTimeout(() => {
                    if (document.querySelector('.side-panel')) {
                        this.closeSidePanel();
                    }
                }, 2000);
            }
            return result;
        }.bind(this);
    }

    resetInactivityTimer() {
        clearTimeout(this.inactivityTimer);
        // Auto-close after 10 minutes of no activity
        this.inactivityTimer = setTimeout(() => {
            if (document.querySelector('.side-panel')) {
                this.closeSidePanel();
            }
        }, 600000); // 10 minutes
    }

    removeAutoCloseListeners() {
        // Remove all event listeners to prevent memory leaks
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler, true);
            this.clickHandler = null;
        }
        console.log('Auto-close listeners removed');
    }

    setupFormInteractions() {
        // Auto-generate SKU when name or category changes
        const nameField = document.getElementById('productName');
        const categoryField = document.getElementById('productCategory');
        const skuField = document.getElementById('productSKU');

        const generateSKU = () => {
            if (nameField.value && categoryField.value) {
                const sku = window.DataStorage.generateSKU(nameField.value, categoryField.value);
                if (!skuField.value) {
                    skuField.value = sku;
                    // Add a subtle animation to show the SKU was generated
                    skuField.style.background = 'rgba(59, 130, 246, 0.1)';
                    setTimeout(() => {
                        skuField.style.background = '';
                    }, 1000);
                }
            }
        };

        nameField.addEventListener('blur', generateSKU);
        categoryField.addEventListener('blur', generateSKU);

        // Add focus ripple effect to form fields
        document.querySelectorAll('.form-control.animated').forEach(field => {
            field.addEventListener('focus', (e) => {
                e.target.parentElement.style.transform = 'scale(1.02)';
            });
            
            field.addEventListener('blur', (e) => {
                e.target.parentElement.style.transform = 'scale(1)';
            });

            // Track form completion progress
            field.addEventListener('input', () => {
                this.updateFormProgress();
                this.validateField(field);
            });
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.querySelector('.side-panel.active')) {
                this.closeSidePanel();
            }
        });
    }

    showSuccessState() {
        const loadingEl = document.getElementById('sidePanelLoading');
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div>
                    <div class="success-checkmark"></div>
                    <p style="margin-top: 15px; color: var(--success-color); font-weight: 500;">Product saved successfully!</p>
                </div>
            `;
        }
    }

    hideLoadingState() {
        const loadingEl = document.getElementById('sidePanelLoading');
        const saveBtn = document.getElementById('saveProductBtn');
        
        if (loadingEl) {
            loadingEl.classList.remove('active');
        }
        
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-plus"></i> Add Product';
        }
    }

    updateFormProgress() {
        const requiredFields = ['productName', 'productSKU', 'productHSN', 'productCategory', 'productPrice', 'productGST'];
        let completedFields = 0;

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.value.trim()) {
                completedFields++;
            }
        });

        const progressPercent = Math.round((completedFields / requiredFields.length) * 100);
        const progressFill = document.getElementById('formProgressFill');
        const progressText = document.getElementById('formProgressText');

        if (progressFill) {
            progressFill.style.width = progressPercent + '%';
        }

        if (progressText) {
            progressText.textContent = progressPercent + '% Complete';
            
            if (progressPercent === 100) {
                progressText.textContent = '✓ Ready to Save!';
                progressText.style.color = 'var(--success-color)';
            } else {
                progressText.style.color = 'var(--text-secondary)';
            }
        }
    }

    validateField(field) {
        // Remove existing validation messages and classes
        const existingMessage = field.parentElement.querySelector('.form-validation-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        field.classList.remove('error', 'success');

        // Check if field is required and empty
        if (field.hasAttribute('required') && !field.value.trim()) {
            this.showFieldError(field, 'This field is required');
            return false;
        }

        // Validate specific field types
        switch (field.type) {
            case 'number':
                if (field.value && (isNaN(field.value) || parseFloat(field.value) < 0)) {
                    this.showFieldError(field, 'Please enter a valid positive number');
                    return false;
                }
                break;
            case 'email':
                if (field.value && !/\S+@\S+\.\S+/.test(field.value)) {
                    this.showFieldError(field, 'Please enter a valid email address');
                    return false;
                }
                break;
        }

        // SKU validation
        if (field.id === 'productSKU' && field.value) {
            if (field.value.length < 3) {
                this.showFieldError(field, 'SKU must be at least 3 characters');
                return false;
            }
        }

        // HSN code validation
        if (field.id === 'productHSN' && field.value) {
            if (!/^\d+$/.test(field.value) || (field.value.length !== 4 && field.value.length !== 6 && field.value.length !== 8)) {
                this.showFieldError(field, 'HSN code must be 4, 6, or 8 digits');
                return false;
            }
        }

        // Show success for valid fields
        if (field.value.trim()) {
            field.classList.add('success');
        }

        return true;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'form-validation-message error';
        errorMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        
        field.parentElement.appendChild(errorMessage);
        
        // Auto-remove error after field is corrected
        const removeErrorHandler = () => {
            if (field.value.trim() && this.validateField(field)) {
                field.removeEventListener('input', removeErrorHandler);
            }
        };
        field.addEventListener('input', removeErrorHandler);
    }

    getCategoryOptions() {
        const categories = [...new Set(this.products.map(p => p.category).filter(Boolean))];
        return categories.map(cat => `<option value="${cat}">`).join('');
    }

    async saveProduct(isEdit = false, productId = null) {
        const form = document.getElementById(isEdit ? 'editProductForm' : 'addProductForm');
        if (!form || !app.validateForm(form.id)) {
            return;
        }

        const productData = {
            name: document.getElementById('productName').value.trim(),
            sku: document.getElementById('productSKU').value.trim(),
            hsn_code: document.getElementById('productHSN').value.trim(),
            category: document.getElementById('productCategory').value.trim(),
            unit_price: parseFloat(document.getElementById('productPrice').value),
            gst_rate: parseFloat(document.getElementById('productGST').value),
            available_qty: parseInt(document.getElementById('productStock').value) || 0,
            min_qty: parseInt(document.getElementById('productMinQty').value) || 10,
            description: document.getElementById('productDescription').value.trim()
        };

        // Auto-generate SKU if not provided
        if (!productData.sku) {
            productData.sku = window.DataStorage.generateSKU(productData.name, productData.category);
        }

        try {
            // Show animated loading state
            const loadingEl = document.getElementById('sidePanelLoading');
            const saveBtn = document.getElementById('saveProductBtn');
            
            if (loadingEl) {
                loadingEl.classList.add('active');
            }
            
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            }
            
            let result;
            if (isEdit && productId) {
                result = await window.DataStorage.updateProduct(productId, productData);
            } else {
                result = await window.DataStorage.createProduct(productData);
            }

            if (result.success) {
                // Show success animation
                this.showSuccessState();
                
                setTimeout(async () => {
                    showNotification(result.message || `Product ${isEdit ? 'updated' : 'added'} successfully`, 'success');
                    this.closeSidePanel();
                    await this.loadProducts();
                    this.loadCategories();
                }, 1500);
            } else {
                this.hideLoadingState();
                showNotification(result.error || 'Failed to save product', 'error');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            this.hideLoadingState();
            showNotification('Failed to save product', 'error');
        }
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            showNotification('Product not found', 'error');
            return;
        }

        const modalContent = `
            <form id="editProductForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="productName">Product Name *</label>
                        <input type="text" class="form-control" id="productName" value="${product.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="productSKU">SKU *</label>
                        <input type="text" class="form-control" id="productSKU" value="${product.sku}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="productHSN">HSN Code *</label>
                        <input type="text" class="form-control" id="productHSN" value="${product.hsn_code}" required>
                    </div>
                    <div class="form-group">
                        <label for="productCategory">Category *</label>
                        <input type="text" class="form-control" id="productCategory" value="${product.category || ''}" list="categoryList" required>
                        <datalist id="categoryList">
                            ${this.getCategoryOptions()}
                        </datalist>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="productPrice">Unit Price (₹) *</label>
                        <input type="number" class="form-control" id="productPrice" value="${product.unit_price}" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="productGST">GST Rate (%) *</label>
                        <select class="form-control" id="productGST" required>
                            <option value="0" ${product.gst_rate === 0 ? 'selected' : ''}>0% (Exempt)</option>
                            <option value="5" ${product.gst_rate === 5 ? 'selected' : ''}>5%</option>
                            <option value="12" ${product.gst_rate === 12 ? 'selected' : ''}>12%</option>
                            <option value="18" ${product.gst_rate === 18 ? 'selected' : ''}>18%</option>
                            <option value="28" ${product.gst_rate === 28 ? 'selected' : ''}>28%</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="productStock">Current Stock</label>
                        <input type="number" class="form-control" id="productStock" value="${product.available_qty || 0}" min="0">
                    </div>
                    <div class="form-group">
                        <label for="productMinQty">Minimum Quantity</label>
                        <input type="number" class="form-control" id="productMinQty" value="${product.min_qty || 10}" min="0">
                    </div>
                </div>
                <div class="form-group">
                    <label for="productDescription">Description</label>
                    <textarea class="form-control" id="productDescription" rows="3">${product.description || ''}</textarea>
                </div>
            </form>
        `;

        const actions = [
            {
                text: 'Cancel',
                class: 'btn-secondary',
                onclick: 'app.closeModal()'
            },
            {
                text: 'Update Product',
                class: 'btn-primary',
                icon: 'fas fa-save',
                onclick: `inventoryManager.saveProduct(true, ${productId})`
            }
        ];

        app.createModal('Edit Product', modalContent, actions);
    }

    adjustStock(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            showNotification('Product not found', 'error');
            return;
        }

        const modalContent = `
            <div class="stock-adjustment">
                <div class="current-stock">
                    <h4>Current Stock: <span class="text-primary">${product.available_qty || 0}</span> units</h4>
                    <p class="text-secondary">${product.name} (${product.sku})</p>
                </div>
                
                <form id="stockAdjustmentForm">
                    <div class="form-group">
                        <label for="adjustmentType">Adjustment Type</label>
                        <select class="form-control" id="adjustmentType" onchange="inventoryManager.toggleAdjustmentFields()">
                            <option value="add">Add Stock (Incoming)</option>
                            <option value="remove">Remove Stock (Outgoing)</option>
                            <option value="set">Set Stock (Absolute)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="adjustmentQty">Quantity</label>
                        <input type="number" class="form-control" id="adjustmentQty" min="1" required>
                        <small class="text-secondary" id="adjustmentHelper">Enter quantity to add</small>
                    </div>
                    
                    <div class="form-group">
                        <label for="adjustmentReason">Reason</label>
                        <select class="form-control" id="adjustmentReason">
                            <option value="purchase">Purchase/Incoming</option>
                            <option value="sale">Sale/Outgoing</option>
                            <option value="damaged">Damaged/Lost</option>
                            <option value="returned">Return</option>
                            <option value="audit">Stock Audit</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="adjustmentNotes">Notes (Optional)</label>
                        <textarea class="form-control" id="adjustmentNotes" rows="2"></textarea>
                    </div>
                    
                    <div class="adjustment-preview">
                        <div class="preview-calculation">
                            <span>New Stock: </span>
                            <span id="newStockPreview" class="font-bold">-</span>
                        </div>
                    </div>
                </form>
            </div>
        `;

        const actions = [
            {
                text: 'Cancel',
                class: 'btn-secondary',
                onclick: 'app.closeModal()'
            },
            {
                text: 'Apply Adjustment',
                class: 'btn-primary',
                icon: 'fas fa-check',
                onclick: `inventoryManager.applyStockAdjustment(${productId})`
            }
        ];

        app.createModal('Adjust Stock', modalContent, actions);

        // Add event listeners for real-time preview
        document.getElementById('adjustmentQty').addEventListener('input', () => {
            this.updateStockPreview(product.available_qty || 0);
        });
        
        document.getElementById('adjustmentType').addEventListener('change', () => {
            this.updateStockPreview(product.available_qty || 0);
        });
    }

    toggleAdjustmentFields() {
        const type = document.getElementById('adjustmentType').value;
        const helper = document.getElementById('adjustmentHelper');
        const reasonField = document.getElementById('adjustmentReason');
        
        switch (type) {
            case 'add':
                helper.textContent = 'Enter quantity to add';
                reasonField.value = 'purchase';
                break;
            case 'remove':
                helper.textContent = 'Enter quantity to remove';
                reasonField.value = 'sale';
                break;
            case 'set':
                helper.textContent = 'Enter new total quantity';
                reasonField.value = 'audit';
                break;
        }
    }

    updateStockPreview(currentStock) {
        const type = document.getElementById('adjustmentType')?.value;
        const qty = parseInt(document.getElementById('adjustmentQty')?.value) || 0;
        const preview = document.getElementById('newStockPreview');
        
        if (!preview) return;
        
        let newStock = currentStock;
        switch (type) {
            case 'add':
                newStock = currentStock + qty;
                break;
            case 'remove':
                newStock = Math.max(0, currentStock - qty);
                break;
            case 'set':
                newStock = qty;
                break;
        }
        
        preview.textContent = newStock.toString();
        preview.className = newStock === 0 ? 'font-bold text-danger' : 
                           newStock <= 10 ? 'font-bold text-warning' : 'font-bold text-success';
    }

    async applyStockAdjustment(productId) {
        const form = document.getElementById('stockAdjustmentForm');
        if (!form || !app.validateForm(form.id)) {
            return;
        }

        const product = this.products.find(p => p.id === productId);
        const type = document.getElementById('adjustmentType').value;
        const qty = parseInt(document.getElementById('adjustmentQty').value);
        const reason = document.getElementById('adjustmentReason').value;
        const notes = document.getElementById('adjustmentNotes').value;

        let newStock = product.available_qty || 0;
        switch (type) {
            case 'add':
                newStock += qty;
                break;
            case 'remove':
                newStock = Math.max(0, newStock - qty);
                break;
            case 'set':
                newStock = qty;
                break;
        }

        try {
            const result = await window.DataStorage.updateProduct(productId, {
                ...product,
                available_qty: newStock
            });

            if (result.success) {
                showNotification(`Stock adjusted successfully. New quantity: ${newStock}`, 'success');
                app.closeModal();
                await this.loadProducts();
            } else {
                showNotification(result.error || 'Failed to adjust stock', 'error');
            }
        } catch (error) {
            console.error('Error adjusting stock:', error);
            showNotification('Failed to adjust stock', 'error');
        }
    }

    async deleteProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            showNotification('Product not found', 'error');
            return;
        }

        const confirmMessage = `Are you sure you want to delete "${product.name}"?\n\nThis action cannot be undone.`;
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            const result = await window.DataStorage.deleteProduct(productId);
            
            if (result.success) {
                showNotification(result.message || 'Product deleted successfully', 'success');
                await this.loadProducts();
                this.loadCategories();
            } else {
                showNotification(result.error || 'Failed to delete product', 'error');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            showNotification('Failed to delete product', 'error');
        }
    }

    exportInventory() {
        if (this.products.length === 0) {
            showNotification('No data to export', 'warning');
            return;
        }

        const exportData = this.products.map(product => ({
            'Product Name': product.name,
            'SKU': product.sku,
            'HSN Code': product.hsn_code,
            'Category': product.category || '',
            'Unit Price': product.unit_price,
            'GST Rate': product.gst_rate + '%',
            'Current Stock': product.available_qty || 0,
            'Min Quantity': product.min_qty || 0,
            'Description': product.description || ''
        }));

        this.downloadCSV(exportData, `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
        showNotification('Inventory exported successfully', 'success');
    }

    downloadCSV(data, filename) {
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                const value = row[header] || '';
                return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
                    ? `"${value.replace(/"/g, '""')}"` 
                    : value;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    showTableLoading() {
        const tbody = document.getElementById('inventoryTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">
                        <div class="loading-state">
                            <div class="loading"></div>
                            <p>Loading products...</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    showTableError() {
        const tbody = document.getElementById('inventoryTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">
                        <div class="error-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Error Loading Data</h3>
                            <p>Failed to load products. Please try again.</p>
                            <button class="btn btn-primary" onclick="inventoryManager.loadProducts()">
                                <i class="fas fa-sync-alt"></i> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    handleGlobalSearch(query) {
        document.getElementById('productSearch').value = query;
        this.filters.search = query;
        this.applyFilters();
    }
}

// Global functions
function openAddProductModal() {
    if (window.inventoryManager) {
        window.inventoryManager.openAddProductModal();
    }
}

function sortTable(columnIndex) {
    if (window.inventoryManager) {
        window.inventoryManager.sortTable(columnIndex);
    }
}

function changePage(direction) {
    if (window.inventoryManager) {
        window.inventoryManager.changePage(direction);
    }
}

function clearFilters() {
    if (window.inventoryManager) {
        window.inventoryManager.clearFilters();
    }
}

function exportInventory() {
    if (window.inventoryManager) {
        window.inventoryManager.exportInventory();
    }
}

// Initialize inventory manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/inventory') {
        window.inventoryManager = new InventoryManager();
    }
});
