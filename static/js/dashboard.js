// Dashboard JavaScript
class Dashboard {
    constructor() {
        this.salesChart = null;
        this.categoryChart = null;
        this.refreshInterval = null;
    }

    async init() {
        try {
            await this.loadDashboardData();
            this.initCharts();
            this.startAutoRefresh();
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            showNotification('Failed to load dashboard data', 'error');
        }
    }

    async loadDashboardData() {
        try {
            const response = await apiRequest('/api/dashboard/stats');
            
            if (response.status === 'success') {
                this.updateMetrics(response.data);
                await this.loadRecentOrders();
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            throw error;
        }
    }

    updateMetrics(data) {
        document.getElementById('totalProducts').textContent = data.total_products || 0;
        document.getElementById('totalStock').textContent = data.total_stock || 0;
        document.getElementById('lowStockCount').textContent = data.low_stock_count || 0;
        document.getElementById('monthlySales').textContent = formatCurrency(data.monthly_sales || 0);
    }

    async loadRecentOrders() {
        try {
            const response = await apiRequest('/api/dashboard/stats');
            const ordersContainer = document.getElementById('recentOrders');
            
            if (response.status === 'success' && response.data.recent_orders) {
                const orders = response.data.recent_orders;
                
                if (orders.length === 0) {
                    ordersContainer.innerHTML = '<div class="no-data">No recent orders found</div>';
                    return;
                }

                const ordersHtml = orders.map(order => `
                    <div class="order-item">
                        <div class="order-info">
                            <h4>${order.order_number}</h4>
                            <p>${order.customer_name || 'N/A'}</p>
                            <span class="order-date">${formatDate(order.order_date)}</span>
                        </div>
                        <div class="order-amount">
                            <span class="amount">${formatCurrency(order.total_amount)}</span>
                            <span class="status status-${order.status}">${order.status}</span>
                        </div>
                    </div>
                `).join('');

                ordersContainer.innerHTML = ordersHtml;
            }
        } catch (error) {
            console.error('Failed to load recent orders:', error);
            document.getElementById('recentOrders').innerHTML = 
                '<div class="error">Failed to load recent orders</div>';
        }
    }

    async initCharts() {
        await this.initSalesChart();
        await this.initCategoryChart();
    }

    async initSalesChart() {
        try {
            const response = await apiRequest('/api/charts/sales');
            
            if (response.status === 'success') {
                const ctx = document.getElementById('salesChart');
                
                if (this.salesChart) {
                    this.salesChart.destroy();
                }

                this.salesChart = new Chart(ctx, {
                    type: 'line',
                    data: response.data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            x: {
                                grid: {
                                    display: false
                                }
                            },
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return '₹' + value.toLocaleString('en-IN');
                                    }
                                }
                            }
                        },
                        elements: {
                            point: {
                                radius: 4,
                                hoverRadius: 6
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Failed to initialize sales chart:', error);
        }
    }

    async initCategoryChart() {
        try {
            const response = await apiRequest('/api/charts/categories');
            
            if (response.status === 'success') {
                const ctx = document.getElementById('categoryChart');
                
                if (this.categoryChart) {
                    this.categoryChart.destroy();
                }

                this.categoryChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: response.data,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true
                                }
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Failed to initialize category chart:', error);
        }
    }

    startAutoRefresh() {
        // Refresh dashboard every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 300000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}

// Global functions
async function refreshDashboard() {
    if (window.dashboard) {
        await window.dashboard.loadDashboardData();
        await window.dashboard.initCharts();
        showNotification('Dashboard refreshed successfully');
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.dashboard = new Dashboard();
    window.dashboard.init();
});

// Add dashboard-specific styles
const dashboardStyles = `
    .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #e2e8f0;
        transition: background-color 0.2s;
    }
    
    .order-item:hover {
        background: #f8fafc;
    }
    
    .order-item:last-child {
        border-bottom: none;
    }
    
    .order-info h4 {
        margin: 0 0 0.25rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: #1e293b;
    }
    
    .order-info p {
        margin: 0 0 0.25rem 0;
        color: #64748b;
        font-size: 0.875rem;
    }
    
    .order-date {
        font-size: 0.75rem;
        color: #94a3b8;
    }
    
    .order-amount {
        text-align: right;
    }
    
    .amount {
        display: block;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 0.25rem;
    }
    
    .status {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
    }
    
    .status-pending {
        background: #fef3c7;
        color: #92400e;
    }
    
    .status-completed {
        background: #d1fae5;
        color: #065f46;
    }
    
    .status-cancelled {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .no-data, .error {
        text-align: center;
        padding: 2rem;
        color: #64748b;
        font-style: italic;
    }
    
    .error {
        color: #ef4444;
    }
`;

// Add dashboard styles
const dashboardStyleSheet = document.createElement('style');
dashboardStyleSheet.textContent = dashboardStyles;
document.head.appendChild(dashboardStyleSheet);