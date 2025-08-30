// Inventory Management JavaScript
class InventoryManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentEditId = null;
        this.currentView = 'table';
    }

    async init() {
        try {
            await this.loadProducts();
            this.initEventListeners();
            this.updateStatistics();
            this.populateCategoryFilter();
        } catch (error) {
            console.error('Inventory initialization failed:', error);
            showNotification('Failed to load inventory data', 'error');
        }
    }

    async loadProducts() {
        try {
            const response = await apiRequest('/api/products');
            
            if (response.status === 'success') {
                this.products = response.data;
                this.filteredProducts = [...this.products];
                this.renderProducts();
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            throw error;
        }
    }

    initEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchProducts');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }

        // Filter functionality
        const categoryFilter = document.getElementById('categoryFilter');
        const stockFilter = document.getElementById('stockFilter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (stockFilter) {
            stockFilter.addEventListener('change', () => this.applyFilters());
        }

        // View toggle
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });

        // Product form
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Modal overlay
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => this.closeProductModal());
        }

        // Auto-generate SKU when name or category changes
        const nameInput = document.getElementById('productName');
        const categoryInput = document.getElementById('productCategory');
        
        if (nameInput && categoryInput) {
            const generateSKU = () => {
                const name = nameInput.value.trim();
                const category = categoryInput.value.trim();
                
                if (name && category && !this.currentEditId) {
                    const namePart = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
                    const catPart = category.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
                    const count = this.products.length + 1;
                    const sku = `${namePart}${catPart}${count.toString().padStart(3, '0')}`;
                    
                    document.getElementById('productSKU').value = sku;
                }
            };
            
            nameInput.addEventListener('input', generateSKU);
            categoryInput.addEventListener('input', generateSKU);
        }
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchProducts').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const stockFilter = document.getElementById('stockFilter').value;

        this.filteredProducts = this.products.filter(product => {
            // Search filter
            const matchesSearch = !searchTerm || 
                product.name.toLowerCase().includes(searchTerm) ||
                product.sku.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm);

            // Category filter
            const matchesCategory = !categoryFilter || product.category === categoryFilter;

            // Stock filter
            let matchesStock = true;
            if (stockFilter === 'low') {
                matchesStock = product.stock_quantity <= product.min_stock_level;
            } else if (stockFilter === 'out') {
                matchesStock = product.stock_quantity === 0;
            } else if (stockFilter === 'available') {
                matchesStock = product.stock_quantity > product.min_stock_level;
            }

            return matchesSearch && matchesCategory && matchesStock;
        });

        this.renderProducts();
        this.updateStatistics();
    }

    clearFilters() {
        document.getElementById('searchProducts').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('stockFilter').value = '';
        
        this.filteredProducts = [...this.products];
        this.renderProducts();
        this.updateStatistics();
    }

    switchView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Show/hide containers
        const tableContainer = document.getElementById('productsTableContainer');
        const gridContainer = document.getElementById('productsGridContainer');
        
        if (view === 'table') {
            tableContainer.classList.remove('hidden');
            gridContainer.classList.add('hidden');
        } else {
            tableContainer.classList.add('hidden');
            gridContainer.classList.remove('hidden');
        }

        this.renderProducts();
    }

    renderProducts() {
        if (this.currentView === 'table') {
            this.renderTableView();
        } else {
            this.renderGridView();
        }
    }

    renderTableView() {
        const container = document.getElementById('productsTableContainer');
        
        if (this.filteredProducts.length === 0) {
            container.innerHTML = '<div class="no-data">No products found</div>';
            return;
        }

        const tableHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Price (₹)</th>
                        <th>GST (%)</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.filteredProducts.map(product => `
                        <tr>
                            <td><code>${product.sku}</code></td>
                            <td>
                                <div class="product-info">
                                    <strong>${product.name}</strong>
                                    ${product.description ? `<small>${product.description}</small>` : ''}
                                </div>
                            </td>
                            <td><span class="category-tag">${product.category}</span></td>
                            <td class="price-cell">${formatCurrency(product.price)}</td>
                            <td>${product.gst_rate}%</td>
                            <td class="stock-cell">
                                <span class="stock-quantity ${product.stock_quantity <= product.min_stock_level ? 'low' : ''}">${product.stock_quantity}</span>
                                <small>Min: ${product.min_stock_level}</small>
                            </td>
                            <td>
                                <span class="status-badge ${this.getStockStatus(product).class}">
                                    ${this.getStockStatus(product).text}
                                </span>
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn-icon" onclick="inventoryManager.editProduct(${product.id})" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon danger" onclick="inventoryManager.deleteProduct(${product.id})" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHtml;
    }

    renderGridView() {
        const container = document.getElementById('productsGridContainer');
        
        if (this.filteredProducts.length === 0) {
            container.innerHTML = '<div class="no-data">No products found</div>';
            return;
        }

        const gridHtml = this.filteredProducts.map(product => `
            <div class="product-card">
                <div class="product-header">
                    <h4>${product.name}</h4>
                    <span class="status-badge ${this.getStockStatus(product).class}">
                        ${this.getStockStatus(product).text}
                    </span>
                </div>
                <div class="product-details">
                    <p><strong>SKU:</strong> ${product.sku}</p>
                    <p><strong>Category:</strong> ${product.category}</p>
                    <p><strong>Price:</strong> ${formatCurrency(product.price)}</p>
                    <p><strong>Stock:</strong> ${product.stock_quantity} (Min: ${product.min_stock_level})</p>
                </div>
                <div class="product-actions">
                    <button class="btn btn-outline" onclick="inventoryManager.editProduct(${product.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-outline danger" onclick="inventoryManager.deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = gridHtml;
    }

    getStockStatus(product) {
        if (product.stock_quantity === 0) {
            return { class: 'out-of-stock', text: 'Out of Stock' };
        } else if (product.stock_quantity <= product.min_stock_level) {
            return { class: 'low-stock', text: 'Low Stock' };
        } else {
            return { class: 'in-stock', text: 'In Stock' };
        }
    }

    updateStatistics() {
        const totalItems = this.filteredProducts.length;
        const totalValue = this.filteredProducts.reduce((sum, product) => sum + (product.price * product.stock_quantity), 0);
        const lowStockItems = this.filteredProducts.filter(product => product.stock_quantity <= product.min_stock_level).length;
        const categories = [...new Set(this.filteredProducts.map(product => product.category))].length;

        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('totalValue').textContent = formatCurrency(totalValue);
        document.getElementById('lowStockItems').textContent = lowStockItems;
        document.getElementById('totalCategories').textContent = categories;
    }

    populateCategoryFilter() {
        const categories = [...new Set(this.products.map(product => product.category))].sort();
        const categoryFilter = document.getElementById('categoryFilter');
        const categoryList = document.getElementById('categoryList');
        
        // Populate filter dropdown
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        // Populate datalist for form
        if (categoryList) {
            categoryList.innerHTML = categories.map(category => `<option value=\"${category}\">`).join('');
        }
    }

    openAddProductModal() {
        this.currentEditId = null;
        document.getElementById('modalTitle').textContent = 'Add New Product';
        document.getElementById('saveProductBtn').innerHTML = '<i class=\"fas fa-save\"></i> Save Product';
        
        // Reset form
        document.getElementById('productForm').reset();
        document.getElementById('productGST').value = '18'; // Default GST rate
        document.getElementById('productMinStock').value = '10'; // Default minimum stock
        
        // Show modal
        document.getElementById('productModal').classList.add('active');
        document.getElementById('modalOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus on first input
        setTimeout(() => document.getElementById('productName').focus(), 100);
    }

    async editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        this.currentEditId = productId;
        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('saveProductBtn').innerHTML = '<i class=\"fas fa-save\"></i> Update Product';
        
        // Populate form with product data
        document.getElementById('productName').value = product.name;
        document.getElementById('productSKU').value = product.sku;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productCostPrice').value = product.cost_price || '';
        document.getElementById('productGST').value = product.gst_rate;
        document.getElementById('productHSN').value = product.hsn_code || '';
        document.getElementById('productStock').value = product.stock_quantity;
        document.getElementById('productMinStock').value = product.min_stock_level;
        document.getElementById('productDescription').value = product.description || '';
        
        // Show modal
        document.getElementById('productModal').classList.add('active');
        document.getElementById('modalOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeProductModal() {
        document.getElementById('productModal').classList.remove('active');
        document.getElementById('modalOverlay').classList.remove('active');
        document.body.style.overflow = '';
        this.currentEditId = null;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            let response;
            if (this.currentEditId) {
                response = await apiRequest(`/api/products/${this.currentEditId}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
            } else {
                response = await apiRequest('/api/products', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
            }
            
            if (response.status === 'success') {
                showNotification(response.message);
                this.closeProductModal();
                await this.loadProducts();
                this.populateCategoryFilter();
            } else {
                showNotification(response.message, 'error');
            }
        } catch (error) {
            console.error('Form submission failed:', error);
            showNotification('Failed to save product', 'error');
        }
    }

    async deleteProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        if (!confirm(`Are you sure you want to delete \"${product.name}\"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await apiRequest(`/api/products/${productId}`, {
                method: 'DELETE'
            });
            
            if (response.status === 'success') {
                showNotification(response.message);
                await this.loadProducts();
                this.populateCategoryFilter();
            } else {
                showNotification(response.message, 'error');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            showNotification('Failed to delete product', 'error');
        }
    }

    exportInventory() {
        // Simple CSV export
        const headers = ['SKU', 'Name', 'Category', 'Price', 'Cost Price', 'GST Rate', 'HSN Code', 'Stock', 'Min Stock', 'Description'];
        const csvData = [
            headers.join(','),
            ...this.filteredProducts.map(product => [
                product.sku,
                `\"${product.name}\"`,
                product.category,
                product.price,
                product.cost_price || 0,
                product.gst_rate,
                product.hsn_code || '',
                product.stock_quantity,
                product.min_stock_level,
                `\"${product.description || ''}\"`
            ].join(','))
        ].join('\\n');
        
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('Inventory exported successfully');
    }
}

// Global functions
function openAddProductModal() {
    if (window.inventoryManager) {
        window.inventoryManager.openAddProductModal();
    }
}

function closeProductModal() {
    if (window.inventoryManager) {
        window.inventoryManager.closeProductModal();
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.inventoryManager = new InventoryManager();
    window.inventoryManager.init();
});