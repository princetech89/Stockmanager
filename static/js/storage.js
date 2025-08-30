/**
 * Data Storage Manager for Stock Inventory Management System
 * Handles local storage operations and API communication
 */

class DataStorage {
    constructor() {
        this.baseURL = '/api';
        this.storageKeys = {
            products: 'inventory_products',
            orders: 'inventory_orders',
            settings: 'inventory_settings',
            invoices: 'inventory_invoices'
        };
        this.initializeStorage();
    }

    /**
     * Initialize default storage structure
     */
    initializeStorage() {
        if (!localStorage.getItem(this.storageKeys.settings)) {
            const defaultSettings = {
                general: {
                    appName: 'Stock Management System',
                    currency: 'INR',
                    dateFormat: 'DD/MM/YYYY',
                    lowStockThreshold: 10
                },
                business: {
                    name: '',
                    type: 'retail',
                    address: '',
                    phone: '',
                    email: '',
                    website: '',
                    logo: ''
                },
                gst: {
                    number: '',
                    stateCode: '07',
                    rates: {
                        rate1: 5,
                        rate2: 12,
                        rate3: 18,
                        rate4: 28
                    }
                }
            };
            this.saveSettings(defaultSettings);
        }

        if (!localStorage.getItem(this.storageKeys.products)) {
            this.saveProducts([]);
        }

        if (!localStorage.getItem(this.storageKeys.orders)) {
            this.saveOrders([]);
        }

        if (!localStorage.getItem(this.storageKeys.invoices)) {
            this.saveInvoices([]);
        }
    }

    /**
     * API Communication Methods
     */
    async apiRequest(endpoint, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    /**
     * Products Management
     */
    async getProducts() {
        try {
            const products = await this.apiRequest('/products');
            this.saveProducts(products);
            return products;
        } catch (error) {
            console.warn('Failed to fetch from API, using local storage:', error);
            return JSON.parse(localStorage.getItem(this.storageKeys.products) || '[]');
        }
    }

    async createProduct(productData) {
        try {
            const result = await this.apiRequest('/products', {
                method: 'POST',
                body: JSON.stringify(productData)
            });
            
            // Refresh local data
            await this.getProducts();
            return result;
        } catch (error) {
            // Fallback to local storage
            const products = this.getLocalProducts();
            const newProduct = {
                id: Date.now(),
                ...productData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            products.push(newProduct);
            this.saveProducts(products);
            return { success: true, message: 'Product added locally' };
        }
    }

    async updateProduct(productId, productData) {
        try {
            const result = await this.apiRequest(`/products/${productId}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
            
            await this.getProducts();
            return result;
        } catch (error) {
            // Fallback to local storage
            const products = this.getLocalProducts();
            const index = products.findIndex(p => p.id === productId);
            if (index !== -1) {
                products[index] = { ...products[index], ...productData, updated_at: new Date().toISOString() };
                this.saveProducts(products);
            }
            return { success: true, message: 'Product updated locally' };
        }
    }

    async deleteProduct(productId) {
        try {
            const result = await this.apiRequest(`/products/${productId}`, {
                method: 'DELETE'
            });
            
            await this.getProducts();
            return result;
        } catch (error) {
            // Fallback to local storage
            const products = this.getLocalProducts();
            const filteredProducts = products.filter(p => p.id !== productId);
            this.saveProducts(filteredProducts);
            return { success: true, message: 'Product deleted locally' };
        }
    }

    getLocalProducts() {
        return JSON.parse(localStorage.getItem(this.storageKeys.products) || '[]');
    }

    saveProducts(products) {
        localStorage.setItem(this.storageKeys.products, JSON.stringify(products));
    }

    /**
     * Orders Management
     */
    async getOrders(orderType = 'sales') {
        try {
            const orders = await this.apiRequest(`/orders?type=${orderType}`);
            this.saveOrders(orders);
            return orders;
        } catch (error) {
            console.warn('Failed to fetch orders from API, using local storage:', error);
            const allOrders = JSON.parse(localStorage.getItem(this.storageKeys.orders) || '[]');
            return allOrders.filter(order => order.order_type === orderType);
        }
    }

    async createOrder(orderData) {
        try {
            const result = await this.apiRequest('/orders', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });
            
            await this.getOrders(orderData.order_type);
            return result;
        } catch (error) {
            // Fallback to local storage
            const orders = JSON.parse(localStorage.getItem(this.storageKeys.orders) || '[]');
            const newOrder = {
                id: Date.now(),
                order_number: `ORD-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(orders.length + 1).padStart(4, '0')}`,
                ...orderData,
                status: 'pending',
                created_at: new Date().toISOString()
            };
            orders.push(newOrder);
            this.saveOrders(orders);
            return { success: true, message: 'Order created locally', order_id: newOrder.id };
        }
    }

    saveOrders(orders) {
        localStorage.setItem(this.storageKeys.orders, JSON.stringify(orders));
    }

    /**
     * Dashboard Statistics
     */
    async getDashboardStats() {
        try {
            return await this.apiRequest('/dashboard-stats');
        } catch (error) {
            // Fallback to local calculations
            const products = this.getLocalProducts();
            const orders = JSON.parse(localStorage.getItem(this.storageKeys.orders) || '[]');
            
            const totalProducts = products.length;
            const totalStock = products.reduce((sum, product) => sum + (product.available_qty || 0), 0);
            const lowStockCount = products.filter(product => (product.available_qty || 0) <= (product.min_qty || 10)).length;
            
            const currentMonth = new Date();
            currentMonth.setDate(1);
            const monthlySales = orders.filter(order => 
                order.order_type === 'sales' && 
                new Date(order.created_at) >= currentMonth
            ).length;

            return {
                total_products: totalProducts,
                total_stock: totalStock,
                low_stock_count: lowStockCount,
                monthly_sales: monthlySales
            };
        }
    }

    /**
     * Chart Data
     */
    async getSalesChartData() {
        try {
            return await this.apiRequest('/sales-chart');
        } catch (error) {
            // Fallback to local data
            const orders = JSON.parse(localStorage.getItem(this.storageKeys.orders) || '[]');
            const salesOrders = orders.filter(order => order.order_type === 'sales');
            
            const last7Days = [];
            const salesData = [];
            const labels = [];
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dayStart = new Date(date);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(date);
                dayEnd.setHours(23, 59, 59, 999);
                
                const dailySales = salesOrders
                    .filter(order => {
                        const orderDate = new Date(order.created_at);
                        return orderDate >= dayStart && orderDate <= dayEnd;
                    })
                    .reduce((sum, order) => sum + (order.total_amount || 0), 0);
                
                salesData.push(dailySales);
                labels.push(date.getDate() + '/' + (date.getMonth() + 1));
            }
            
            return { labels, data: salesData };
        }
    }

    async getCategoryChartData() {
        try {
            return await this.apiRequest('/category-chart');
        } catch (error) {
            // Fallback to local data
            const products = this.getLocalProducts();
            const categoryCount = {};
            
            products.forEach(product => {
                const category = product.category || 'Uncategorized';
                categoryCount[category] = (categoryCount[category] || 0) + 1;
            });
            
            return {
                labels: Object.keys(categoryCount),
                data: Object.values(categoryCount)
            };
        }
    }

    /**
     * Settings Management
     */
    getSettings() {
        return JSON.parse(localStorage.getItem(this.storageKeys.settings) || '{}');
    }

    saveSettings(settings) {
        localStorage.setItem(this.storageKeys.settings, JSON.stringify(settings));
    }

    /**
     * Invoices Management
     */
    getInvoices() {
        return JSON.parse(localStorage.getItem(this.storageKeys.invoices) || '[]');
    }

    saveInvoices(invoices) {
        localStorage.setItem(this.storageKeys.invoices, JSON.stringify(invoices));
    }

    createInvoice(invoiceData) {
        const invoices = this.getInvoices();
        const newInvoice = {
            id: Date.now(),
            invoice_number: `INV-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(invoices.length + 1).padStart(4, '0')}`,
            ...invoiceData,
            created_at: new Date().toISOString()
        };
        invoices.push(newInvoice);
        this.saveInvoices(invoices);
        return newInvoice;
    }

    /**
     * Utility Methods
     */
    formatCurrency(amount) {
        const settings = this.getSettings();
        const currency = settings.general?.currency || 'INR';
        
        if (currency === 'INR') {
            return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    formatDate(dateString) {
        const settings = this.getSettings();
        const format = settings.general?.dateFormat || 'DD/MM/YYYY';
        const date = new Date(dateString);
        
        switch (format) {
            case 'MM/DD/YYYY':
                return date.toLocaleDateString('en-US');
            case 'YYYY-MM-DD':
                return date.toISOString().split('T')[0];
            default: // DD/MM/YYYY
                return date.toLocaleDateString('en-GB');
        }
    }

    calculateGST(amount, rate) {
        return (amount * rate) / 100;
    }

    generateSKU(name, category) {
        const namePrefix = name.substring(0, 3).toUpperCase();
        const categoryPrefix = category.substring(0, 2).toUpperCase();
        const timestamp = Date.now().toString().slice(-4);
        return `${namePrefix}${categoryPrefix}${timestamp}`;
    }

    // Dashboard Stats API
    async getDashboardStats() {
        try {
            const response = await this.apiRequest('/dashboard-stats');
            return response;
        } catch (error) {
            console.error('Failed to get dashboard stats from API, falling back to local data:', error);
            // Fallback to local storage calculation
            const products = this.getProducts();
            const orders = this.getOrders('sales');
            const currentMonth = new Date();
            currentMonth.setDate(1);
            
            const monthlySales = orders.filter(order => 
                new Date(order.created_at) >= currentMonth
            ).length;

            return {
                total_products: products.length,
                total_stock: products.reduce((sum, product) => sum + (product.available_qty || 0), 0),
                low_stock_count: products.filter(product => 
                    (product.available_qty || 0) <= (product.min_qty || 10)
                ).length,
                monthly_sales: monthlySales
            };
        }
    }

    // Sales Chart Data API
    async getSalesChartData() {
        try {
            const response = await this.apiRequest('/sales-chart');
            return response;
        } catch (error) {
            console.error('Failed to get sales chart data from API, using fallback:', error);
            // Fallback to mock data for demonstration
            const labels = [];
            const data = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }));
                data.push(Math.random() * 1000); // Mock data
            }
            return { labels, data };
        }
    }

    // Category Chart Data API
    async getCategoryChartData() {
        try {
            const response = await this.apiRequest('/category-chart');
            return response;
        } catch (error) {
            console.error('Failed to get category chart data from API, using local data:', error);
            // Fallback to local storage data
            const products = this.getProducts();
            const categories = {};
            
            products.forEach(product => {
                const category = product.category || 'Uncategorized';
                categories[category] = (categories[category] || 0) + 1;
            });

            return {
                labels: Object.keys(categories),
                data: Object.values(categories)
            };
        }
    }

    // Products API  
    async getProducts() {
        try {
            const response = await this.apiRequest('/products');
            this.saveProducts(response);
            return response;
        } catch (error) {
            console.error('Failed to get products from API, using local storage:', error);
            return JSON.parse(localStorage.getItem(this.storageKeys.products) || '[]');
        }
    }

    // Settings API
    getSettings() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKeys.settings) || '{}');
        } catch (error) {
            console.error('Failed to get settings:', error);
            return {};
        }
    }

    // Save Settings
    saveSettings(settings) {
        try {
            localStorage.setItem(this.storageKeys.settings, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }

    // Get Orders (with type filter)
    getOrders(type = null) {
        try {
            const orders = JSON.parse(localStorage.getItem(this.storageKeys.orders) || '[]');
            if (type) {
                return orders.filter(order => order.order_type === type);
            }
            return orders;
        } catch (error) {
            console.error('Failed to get orders:', error);
            return [];
        }
    }

    // Save Orders
    saveOrders(orders) {
        try {
            localStorage.setItem(this.storageKeys.orders, JSON.stringify(orders));
            return true;
        } catch (error) {
            console.error('Failed to save orders:', error);
            return false;
        }
    }

    // Save Products
    saveProducts(products) {
        try {
            localStorage.setItem(this.storageKeys.products, JSON.stringify(products));
            return true;
        } catch (error) {
            console.error('Failed to save products:', error);
            return false;
        }
    }

    // Get Invoices
    getInvoices() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKeys.invoices) || '[]');
        } catch (error) {
            console.error('Failed to get invoices:', error);
            return [];
        }
    }

    // Save Invoices
    saveInvoices(invoices) {
        try {
            localStorage.setItem(this.storageKeys.invoices, JSON.stringify(invoices));
            return true;
        } catch (error) {
            console.error('Failed to save invoices:', error);
            return false;
        }
    }
}

// Create global instance
try {
    window.DataStorage = new DataStorage();
    console.log('DataStorage instance created successfully');
    
    // Debug: Log available methods
    console.log('Available DataStorage methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.DataStorage)));
    
    // Verify critical methods
    if (typeof window.DataStorage.getDashboardStats !== 'function') {
        console.error('getDashboardStats method not found!');
    } else {
        console.log('getDashboardStats method confirmed');
    }
    
} catch (error) {
    console.error('Failed to create DataStorage instance:', error);
}
