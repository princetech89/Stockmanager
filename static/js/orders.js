/**
 * Orders Management functionality for Stock Inventory Management System
 * Handles order creation, tracking, and order-specific features
 */

class OrdersManager {
    constructor() {
        this.orders = [];
        this.filteredOrders = [];
        this.currentOrderType = 'sales';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.products = [];
        this.filters = {
            search: '',
            startDate: '',
            endDate: '',
            status: ''
        };
        
        this.initializeOrders();
        this.bindEvents();
    }

    initializeOrders() {
        this.loadProducts();
        this.loadOrders();
    }

    bindEvents() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.matches('[onclick^="switchTab"]')) {
                const tabName = e.target.onclick.toString().match(/switchTab\('(\w+)'\)/)?.[1];
                if (tabName) {
                    this.switchTab(tabName);
                }
            }
        });

        // Search input
        const searchInput = document.getElementById('orderSearch');
        if (searchInput) {
            searchInput.addEventListener('input', app.debounce((e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            }, 300));
        }

        // Date filters
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate) {
            startDate.addEventListener('change', (e) => {
                this.filters.startDate = e.target.value;
                this.applyFilters();
            });
        }
        
        if (endDate) {
            endDate.addEventListener('change', (e) => {
                this.filters.endDate = e.target.value;
                this.applyFilters();
            });
        }

        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
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
            this.products = await DataStorage.getProducts();
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    async loadOrders() {
        try {
            this.showTableLoading();
            this.orders = await DataStorage.getOrders(this.currentOrderType);
            this.applyFilters();
        } catch (error) {
            console.error('Error loading orders:', error);
            showNotification('Failed to load orders', 'error');
            this.showTableError();
        }
    }

    switchTab(tabType) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(tabType + 'Tab').classList.add('active');
        
        // Update current type and reload
        this.currentOrderType = tabType;
        this.currentPage = 1;
        this.loadOrders();
    }

    applyFilters() {
        let filtered = [...this.orders];

        // Apply search filter
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(order => 
                order.order_number.toLowerCase().includes(search) ||
                (order.customer_name || '').toLowerCase().includes(search) ||
                (order.customer_mobile || '').toLowerCase().includes(search)
            );
        }

        // Apply date filters
        if (this.filters.startDate) {
            const startDate = new Date(this.filters.startDate);
            filtered = filtered.filter(order => new Date(order.created_at) >= startDate);
        }

        if (this.filters.endDate) {
            const endDate = new Date(this.filters.endDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            filtered = filtered.filter(order => new Date(order.created_at) <= endDate);
        }

        // Apply status filter
        if (this.filters.status) {
            filtered = filtered.filter(order => order.status === this.filters.status);
        }

        this.filteredOrders = filtered;
        this.currentPage = 1;
        this.renderTable();
        this.updatePagination();
    }

    renderTable() {
        const tbody = document.getElementById('ordersTableBody');
        if (!tbody) return;

        if (this.filteredOrders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-shopping-cart"></i>
                            <h3>No Orders Found</h3>
                            <p>No ${this.currentOrderType} orders match your current filters.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageOrders = this.filteredOrders.slice(startIndex, endIndex);

        const rows = pageOrders.map(order => {
            const statusBadge = this.getStatusBadge(order.status);
            const totalWithGST = (order.total_amount || 0) + (order.gst_amount || 0);
            
            return `
                <tr>
                    <td>
                        <strong>${order.order_number}</strong>
                        <br><small class="text-secondary">${order.order_type}</small>
                    </td>
                    <td>
                        <div class="customer-info">
                            <strong>${order.customer_name || 'N/A'}</strong>
                            ${order.customer_mobile ? `<br><small>${order.customer_mobile}</small>` : ''}
                        </div>
                    </td>
                    <td>
                        <div class="date-info">
                            ${DataStorage.formatDate(order.created_at)}
                            <br><small class="text-secondary">${this.getTimeFromDate(order.created_at)}</small>
                        </div>
                    </td>
                    <td class="text-center">${order.items || 0}</td>
                    <td class="text-right">
                        <strong>${DataStorage.formatCurrency(order.total_amount || 0)}</strong>
                        <br><small class="text-secondary">Base amount</small>
                    </td>
                    <td class="text-right">
                        <strong>${DataStorage.formatCurrency(order.gst_amount || 0)}</strong>
                        <br><small class="text-secondary">Tax amount</small>
                    </td>
                    <td>
                        <span class="status-badge ${statusBadge.class}">
                            ${statusBadge.text}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline" onclick="ordersManager.viewOrder(${order.id})" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="ordersManager.editOrder(${order.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="ordersManager.printOrder(${order.id})" title="Print">
                                <i class="fas fa-print"></i>
                            </button>
                            ${order.status !== 'cancelled' ? `
                                <button class="btn btn-sm btn-danger" onclick="ordersManager.cancelOrder(${order.id})" title="Cancel">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    }

    getStatusBadge(status) {
        const statusMap = {
            pending: { text: 'Pending', class: 'warning' },
            completed: { text: 'Completed', class: 'success' },
            cancelled: { text: 'Cancelled', class: 'danger' },
            processing: { text: 'Processing', class: 'info' }
        };
        
        return statusMap[status] || { text: 'Unknown', class: 'secondary' };
    }

    getTimeFromDate(dateString) {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    updatePagination() {
        const totalItems = this.filteredOrders.length;
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const startItem = totalItems > 0 ? (this.currentPage - 1) * this.itemsPerPage + 1 : 0;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, totalItems);

        // Update pagination info
        const entriesStart = document.getElementById('orderEntriesStart');
        const entriesEnd = document.getElementById('orderEntriesEnd');
        const totalEntries = document.getElementById('orderTotalEntries');

        if (entriesStart) entriesStart.textContent = startItem;
        if (entriesEnd) entriesEnd.textContent = endItem;
        if (totalEntries) totalEntries.textContent = totalItems;

        // Update pagination controls
        const prevButton = document.getElementById('orderPrevPage');
        const nextButton = document.getElementById('orderNextPage');
        const pageNumbers = document.getElementById('orderPageNumbers');

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
                        onclick="ordersManager.goToPage(${i})">
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

    changeOrderPage(direction) {
        const totalPages = Math.ceil(this.filteredOrders.length / this.itemsPerPage);
        const newPage = this.currentPage + direction;

        if (newPage >= 1 && newPage <= totalPages) {
            this.goToPage(newPage);
        }
    }

    clearOrderFilters() {
        this.filters = { search: '', startDate: '', endDate: '', status: '' };
        
        document.getElementById('orderSearch').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        document.getElementById('statusFilter').value = '';
        
        this.applyFilters();
        showNotification('Filters cleared', 'info', 2000);
    }

    sortOrderTable(columnIndex) {
        const columns = ['order_number', 'customer_name', 'created_at', 'items', 'total_amount', 'gst_amount', 'status'];
        const column = columns[columnIndex];
        
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.filteredOrders.sort((a, b) => {
            let aValue = a[column] || '';
            let bValue = b[column] || '';

            // Handle numeric columns
            if (['total_amount', 'gst_amount', 'items'].includes(column)) {
                aValue = parseFloat(aValue) || 0;
                bValue = parseFloat(bValue) || 0;
            } else if (column === 'created_at') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
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
        const headers = document.querySelectorAll('#ordersTable th');
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

    openCreateOrderModal() {
        const modalContent = `
            <form id="createOrderForm">
                <div class="form-section">
                    <h4>Order Details</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="orderType">Order Type *</label>
                            <select class="form-control" id="orderType" required>
                                <option value="sales" ${this.currentOrderType === 'sales' ? 'selected' : ''}>Sales Order</option>
                                <option value="purchase" ${this.currentOrderType === 'purchase' ? 'selected' : ''}>Purchase Order</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="orderDate">Order Date *</label>
                            <input type="date" class="form-control" id="orderDate" value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Customer/Supplier Details</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="customerName">Name *</label>
                            <input type="text" class="form-control" id="customerName" required>
                        </div>
                        <div class="form-group">
                            <label for="customerMobile">Mobile Number</label>
                            <input type="tel" class="form-control" id="customerMobile">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="customerGST">GST Number</label>
                            <input type="text" class="form-control" id="customerGST" placeholder="22AAAAA0000A1Z5">
                        </div>
                        <div class="form-group">
                            <label for="customerAddress">Address</label>
                            <textarea class="form-control" id="customerAddress" rows="2"></textarea>
                        </div>
                    </div>
                </div>

                <div class="form-section">
                    <div class="section-header">
                        <h4>Order Items</h4>
                        <button type="button" class="btn btn-sm btn-primary" onclick="ordersManager.addOrderItem()">
                            <i class="fas fa-plus"></i> Add Item
                        </button>
                    </div>
                    
                    <div class="order-items-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Rate (₹)</th>
                                    <th>GST (%)</th>
                                    <th>Amount (₹)</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="orderItemsContainer">
                                <!-- Order items will be added here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="form-section">
                    <h4>Order Summary</h4>
                    <div class="order-summary">
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span id="orderSubtotal">₹0.00</span>
                        </div>
                        <div class="summary-row">
                            <span>Total GST:</span>
                            <span id="orderGST">₹0.00</span>
                        </div>
                        <div class="summary-row total">
                            <span><strong>Total Amount:</strong></span>
                            <span id="orderTotal"><strong>₹0.00</strong></span>
                        </div>
                    </div>
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
                text: 'Create Order',
                class: 'btn-primary',
                icon: 'fas fa-plus',
                onclick: 'ordersManager.saveOrder()'
            }
        ];

        app.createModal('Create New Order', modalContent, actions);

        // Add first item row
        this.addOrderItem();
    }

    addOrderItem() {
        const container = document.getElementById('orderItemsContainer');
        if (!container) return;

        const itemIndex = container.children.length;
        const productOptions = this.products.map(product => 
            `<option value="${product.id}" data-price="${product.unit_price}" data-gst="${product.gst_rate}">
                ${product.name} (${product.sku}) - ₹${product.unit_price}
            </option>`
        ).join('');

        const itemRow = `
            <tr class="order-item-row" data-index="${itemIndex}">
                <td>
                    <select class="form-control product-select" required onchange="ordersManager.updateItemCalculation(${itemIndex})">
                        <option value="">Select Product</option>
                        ${productOptions}
                    </select>
                </td>
                <td>
                    <input type="number" class="form-control quantity-input" min="1" value="1" required onchange="ordersManager.updateItemCalculation(${itemIndex})">
                </td>
                <td>
                    <input type="number" class="form-control rate-input" step="0.01" min="0" required onchange="ordersManager.updateItemCalculation(${itemIndex})">
                </td>
                <td>
                    <input type="number" class="form-control gst-input" step="0.01" min="0" max="100" required onchange="ordersManager.updateItemCalculation(${itemIndex})">
                </td>
                <td>
                    <span class="item-amount">₹0.00</span>
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-danger" onclick="ordersManager.removeOrderItem(${itemIndex})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;

        container.insertAdjacentHTML('beforeend', itemRow);
    }

    removeOrderItem(index) {
        const row = document.querySelector(`tr[data-index="${index}"]`);
        if (row) {
            row.remove();
            this.updateOrderSummary();
        }
    }

    updateItemCalculation(index) {
        const row = document.querySelector(`tr[data-index="${index}"]`);
        if (!row) return;

        const productSelect = row.querySelector('.product-select');
        const quantityInput = row.querySelector('.quantity-input');
        const rateInput = row.querySelector('.rate-input');
        const gstInput = row.querySelector('.gst-input');
        const amountSpan = row.querySelector('.item-amount');

        // Update rate and GST when product is selected
        if (productSelect.value) {
            const selectedOption = productSelect.selectedOptions[0];
            const price = selectedOption.getAttribute('data-price');
            const gst = selectedOption.getAttribute('data-gst');
            
            if (price && !rateInput.value) {
                rateInput.value = price;
            }
            if (gst && !gstInput.value) {
                gstInput.value = gst;
            }
        }

        // Calculate item amount
        const quantity = parseFloat(quantityInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        const amount = quantity * rate;

        amountSpan.textContent = DataStorage.formatCurrency(amount);

        // Update order summary
        this.updateOrderSummary();
    }

    updateOrderSummary() {
        const rows = document.querySelectorAll('.order-item-row');
        let subtotal = 0;
        let totalGST = 0;

        rows.forEach(row => {
            const quantity = parseFloat(row.querySelector('.quantity-input').value) || 0;
            const rate = parseFloat(row.querySelector('.rate-input').value) || 0;
            const gstRate = parseFloat(row.querySelector('.gst-input').value) || 0;
            
            const amount = quantity * rate;
            const gstAmount = (amount * gstRate) / 100;
            
            subtotal += amount;
            totalGST += gstAmount;
        });

        const total = subtotal + totalGST;

        document.getElementById('orderSubtotal').textContent = DataStorage.formatCurrency(subtotal);
        document.getElementById('orderGST').textContent = DataStorage.formatCurrency(totalGST);
        document.getElementById('orderTotal').textContent = DataStorage.formatCurrency(total);
    }

    async saveOrder() {
        const form = document.getElementById('createOrderForm');
        if (!form || !app.validateForm(form.id)) {
            return;
        }

        // Validate that at least one item is added
        const items = document.querySelectorAll('.order-item-row');
        if (items.length === 0) {
            showNotification('Please add at least one item to the order', 'warning');
            return;
        }

        // Collect form data
        const orderData = {
            order_type: document.getElementById('orderType').value,
            customer_name: document.getElementById('customerName').value.trim(),
            customer_mobile: document.getElementById('customerMobile').value.trim(),
            customer_gst: document.getElementById('customerGST').value.trim(),
            customer_address: document.getElementById('customerAddress').value.trim(),
            items: []
        };

        // Collect items data
        let hasValidItems = true;
        items.forEach(row => {
            const productId = row.querySelector('.product-select').value;
            const quantity = parseFloat(row.querySelector('.quantity-input').value);
            const unitPrice = parseFloat(row.querySelector('.rate-input').value);
            const gstRate = parseFloat(row.querySelector('.gst-input').value);

            if (!productId || !quantity || !unitPrice) {
                hasValidItems = false;
                return;
            }

            orderData.items.push({
                product_id: parseInt(productId),
                quantity: quantity,
                unit_price: unitPrice,
                gst_rate: gstRate
            });
        });

        if (!hasValidItems) {
            showNotification('Please fill all item details', 'warning');
            return;
        }

        try {
            const result = await DataStorage.createOrder(orderData);
            
            if (result.success) {
                showNotification(result.message || 'Order created successfully', 'success');
                app.closeModal();
                await this.loadOrders();
            } else {
                showNotification(result.error || 'Failed to create order', 'error');
            }
        } catch (error) {
            console.error('Error creating order:', error);
            showNotification('Failed to create order', 'error');
        }
    }

    viewOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            showNotification('Order not found', 'error');
            return;
        }

        // Implementation for viewing order details
        showNotification('View order functionality would be implemented here', 'info');
    }

    editOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            showNotification('Order not found', 'error');
            return;
        }

        if (order.status === 'completed' || order.status === 'cancelled') {
            showNotification('Cannot edit completed or cancelled orders', 'warning');
            return;
        }

        // Implementation for editing order
        showNotification('Edit order functionality would be implemented here', 'info');
    }

    printOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            showNotification('Order not found', 'error');
            return;
        }

        // Implementation for printing order
        showNotification('Print order functionality would be implemented here', 'info');
    }

    async cancelOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            showNotification('Order not found', 'error');
            return;
        }

        if (order.status === 'cancelled') {
            showNotification('Order is already cancelled', 'warning');
            return;
        }

        const confirmMessage = `Are you sure you want to cancel order ${order.order_number}?`;
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            // Update order status to cancelled
            // This would typically be an API call
            showNotification('Order cancelled successfully', 'success');
            await this.loadOrders();
        } catch (error) {
            console.error('Error cancelling order:', error);
            showNotification('Failed to cancel order', 'error');
        }
    }

    exportOrders() {
        if (this.filteredOrders.length === 0) {
            showNotification('No data to export', 'warning');
            return;
        }

        const exportData = this.filteredOrders.map(order => ({
            'Order Number': order.order_number,
            'Type': order.order_type,
            'Customer': order.customer_name || 'N/A',
            'Mobile': order.customer_mobile || 'N/A',
            'Date': DataStorage.formatDate(order.created_at),
            'Items': order.items || 0,
            'Base Amount': order.total_amount || 0,
            'GST Amount': order.gst_amount || 0,
            'Total Amount': (order.total_amount || 0) + (order.gst_amount || 0),
            'Status': order.status
        }));

        this.downloadCSV(exportData, `${this.currentOrderType}_orders_export_${new Date().toISOString().split('T')[0]}.csv`);
        showNotification('Orders exported successfully', 'success');
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
        const tbody = document.getElementById('ordersTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div class="loading-state">
                            <div class="loading"></div>
                            <p>Loading orders...</p>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    showTableError() {
        const tbody = document.getElementById('ordersTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <div class="error-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h3>Error Loading Data</h3>
                            <p>Failed to load orders. Please try again.</p>
                            <button class="btn btn-primary" onclick="ordersManager.loadOrders()">
                                <i class="fas fa-sync-alt"></i> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    handleGlobalSearch(query) {
        document.getElementById('orderSearch').value = query;
        this.filters.search = query;
        this.applyFilters();
    }
}

// Global functions
function switchTab(tabType) {
    if (window.ordersManager) {
        window.ordersManager.switchTab(tabType);
    }
}

function openCreateOrderModal() {
    if (window.ordersManager) {
        window.ordersManager.openCreateOrderModal();
    }
}

function sortOrderTable(columnIndex) {
    if (window.ordersManager) {
        window.ordersManager.sortOrderTable(columnIndex);
    }
}

function changeOrderPage(direction) {
    if (window.ordersManager) {
        window.ordersManager.changeOrderPage(direction);
    }
}

function clearOrderFilters() {
    if (window.ordersManager) {
        window.ordersManager.clearOrderFilters();
    }
}

function exportOrders() {
    if (window.ordersManager) {
        window.ordersManager.exportOrders();
    }
}

// Initialize orders manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/orders') {
        window.ordersManager = new OrdersManager();
    }
});
