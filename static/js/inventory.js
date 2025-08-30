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
        this.setupPagination();
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
            this.products = await DataStorage.getProducts();
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
                    <td class="text-right">${DataStorage.formatCurrency(product.unit_price)}</td>
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
        const modalContent = `
            <form id="addProductForm">
                <div class="form-row">
                    <div class="form-group">
                        <label for="productName">Product Name *</label>
                        <input type="text" class="form-control" id="productName" required>
                    </div>
                    <div class="form-group">
                        <label for="productSKU">SKU *</label>
                        <input type="text" class="form-control" id="productSKU" required>
                        <small class="text-secondary">Leave blank to auto-generate</small>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="productHSN">HSN Code *</label>
                        <input type="text" class="form-control" id="productHSN" required>
                    </div>
                    <div class="form-group">
                        <label for="productCategory">Category *</label>
                        <input type="text" class="form-control" id="productCategory" list="categoryList" required>
                        <datalist id="categoryList">
                            ${this.getCategoryOptions()}
                        </datalist>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="productPrice">Unit Price (₹) *</label>
                        <input type="number" class="form-control" id="productPrice" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="productGST">GST Rate (%) *</label>
                        <select class="form-control" id="productGST" required>
                            <option value="0">0% (Exempt)</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18" selected>18%</option>
                            <option value="28">28%</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="productStock">Initial Stock</label>
                        <input type="number" class="form-control" id="productStock" min="0" value="0">
                    </div>
                    <div class="form-group">
                        <label for="productMinQty">Minimum Quantity</label>
                        <input type="number" class="form-control" id="productMinQty" min="0" value="10">
                    </div>
                </div>
                <div class="form-group">
                    <label for="productDescription">Description</label>
                    <textarea class="form-control" id="productDescription" rows="3"></textarea>
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
                text: 'Add Product',
                class: 'btn-primary',
                icon: 'fas fa-plus',
                onclick: 'inventoryManager.saveProduct()'
            }
        ];

        app.createModal('Add New Product', modalContent, actions);

        // Auto-generate SKU when name or category changes
        const nameField = document.getElementById('productName');
        const categoryField = document.getElementById('productCategory');
        const skuField = document.getElementById('productSKU');

        const generateSKU = () => {
            if (nameField.value && categoryField.value) {
                const sku = DataStorage.generateSKU(nameField.value, categoryField.value);
                if (!skuField.value) {
                    skuField.value = sku;
                }
            }
        };

        nameField.addEventListener('blur', generateSKU);
        categoryField.addEventListener('blur', generateSKU);
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
            productData.sku = DataStorage.generateSKU(productData.name, productData.category);
        }

        try {
            app.showLoading('saveProductBtn');
            
            let result;
            if (isEdit && productId) {
                result = await DataStorage.updateProduct(productId, productData);
            } else {
                result = await DataStorage.createProduct(productData);
            }

            if (result.success) {
                showNotification(result.message || `Product ${isEdit ? 'updated' : 'added'} successfully`, 'success');
                app.closeModal();
                await this.loadProducts();
                this.loadCategories();
            } else {
                showNotification(result.error || 'Failed to save product', 'error');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            showNotification('Failed to save product', 'error');
        } finally {
            app.hideLoading('saveProductBtn', isEdit ? 'Update Product' : 'Add Product');
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
            const result = await DataStorage.updateProduct(productId, {
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
            const result = await DataStorage.deleteProduct(productId);
            
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
