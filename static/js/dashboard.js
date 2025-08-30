/**
 * Dashboard functionality for Stock Inventory Management System
 * Handles metrics display, charts, and dashboard-specific features
 */

class DashboardManager {
    constructor() {
        this.charts = {};
        this.refreshInterval = null;
        this.isLoading = false;
        
        this.initializeDashboard();
        this.bindEvents();
    }

    initializeDashboard() {
        this.loadDashboardStats();
        this.initializeCharts();
        this.loadRecentActivities();
        this.loadLowStockAlerts();
        
        // Auto-refresh every 5 minutes
        this.startAutoRefresh();
    }

    bindEvents() {
        // Global search event listener
        document.addEventListener('globalSearch', (e) => {
            this.handleGlobalSearch(e.detail.query);
        });
    }

    async loadDashboardStats() {
        try {
            this.setLoadingState(true);
            
            if (typeof DataStorage === 'undefined' || !DataStorage) {
                throw new Error('DataStorage not available');
            }
            
            const stats = await DataStorage.getDashboardStats();
            this.updateMetricCards(stats);
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            // Use fallback empty stats
            this.updateMetricCards({
                total_products: 0,
                total_stock: 0,
                low_stock_count: 0,
                monthly_sales: 0
            });
        } finally {
            this.setLoadingState(false);
        }
    }

    updateMetricCards(stats) {
        const elements = {
            totalProducts: document.getElementById('totalProducts'),
            totalStock: document.getElementById('totalStock'),
            lowStockCount: document.getElementById('lowStockCount'),
            monthlySales: document.getElementById('monthlySales')
        };

        if (elements.totalProducts) {
            elements.totalProducts.textContent = stats.total_products || 0;
        }
        
        if (elements.totalStock) {
            elements.totalStock.textContent = (stats.total_stock || 0).toLocaleString();
        }
        
        if (elements.lowStockCount) {
            elements.lowStockCount.textContent = stats.low_stock_count || 0;
            
            // Update metric card styling based on low stock count
            const metricCard = elements.lowStockCount.closest('.metric-card');
            if (metricCard) {
                if (stats.low_stock_count > 0) {
                    metricCard.classList.add('alert');
                } else {
                    metricCard.classList.remove('alert');
                }
            }
        }
        
        if (elements.monthlySales) {
            elements.monthlySales.textContent = stats.monthly_sales || 0;
        }
    }

    async initializeCharts() {
        await this.createSalesChart();
        await this.createCategoryChart();
    }

    async createSalesChart() {
        const ctx = document.getElementById('salesChart');
        if (!ctx) return;

        try {
            if (typeof DataStorage === 'undefined' || !DataStorage) {
                throw new Error('DataStorage not available');
            }
            
            const data = await DataStorage.getSalesChartData();
            
            if (this.charts.salesChart) {
                this.charts.salesChart.destroy();
            }

            this.charts.salesChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Sales Amount (₹)',
                        data: data.data,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
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
                                    return '₹' + value.toLocaleString();
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
        } catch (error) {
            console.error('Error creating sales chart:', error);
            this.showChartError('salesChart', 'Failed to load sales data');
        }
    }

    async createCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        try {
            if (typeof DataStorage === 'undefined' || !DataStorage) {
                throw new Error('DataStorage not available');
            }
            
            const data = await DataStorage.getCategoryChartData();
            
            if (this.charts.categoryChart) {
                this.charts.categoryChart.destroy();
            }

            const colors = [
                '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
                '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
            ];

            this.charts.categoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.data,
                        backgroundColor: colors.slice(0, data.labels.length),
                        borderWidth: 0,
                        hoverBorderWidth: 2,
                        hoverBorderColor: '#ffffff'
                    }]
                },
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
        } catch (error) {
            console.error('Error creating category chart:', error);
            this.showChartError('categoryChart', 'Failed to load category data');
        }
    }

    async loadRecentActivities() {
        const container = document.getElementById('recentActivities');
        if (!container) return;

        try {
            // Get recent orders from both sales and purchase
            const salesOrders = await DataStorage.getOrders('sales');
            const purchaseOrders = await DataStorage.getOrders('purchase');
            
            const allOrders = [...salesOrders, ...purchaseOrders]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5);

            if (allOrders.length === 0) {
                container.innerHTML = this.getEmptyState('No recent activities', 'fas fa-clock');
                return;
            }

            const activitiesHTML = allOrders.map(order => {
                const icon = order.order_type === 'sales' ? 'fas fa-shopping-cart' : 'fas fa-truck';
                const action = order.order_type === 'sales' ? 'Sale Order' : 'Purchase Order';
                const amount = DataStorage.formatCurrency(order.total_amount || 0);
                
                return `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <i class="${icon}"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-title">
                                ${action} #${order.order_number} - ${amount}
                            </div>
                            <div class="activity-time">
                                ${this.getRelativeTime(order.created_at)}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = activitiesHTML;
        } catch (error) {
            console.error('Error loading recent activities:', error);
            container.innerHTML = this.getEmptyState('Failed to load activities', 'fas fa-exclamation-triangle');
        }
    }

    async loadLowStockAlerts() {
        const container = document.getElementById('lowStockAlerts');
        if (!container) return;

        try {
            const products = await DataStorage.getProducts();
            const lowStockProducts = products.filter(product => 
                (product.available_qty || 0) <= (product.min_qty || 10)
            );

            if (lowStockProducts.length === 0) {
                container.innerHTML = this.getEmptyState('No low stock alerts', 'fas fa-check-circle');
                return;
            }

            const alertsHTML = lowStockProducts.slice(0, 5).map(product => {
                const stockLevel = product.available_qty || 0;
                const alertClass = stockLevel === 0 ? 'danger' : 'warning';
                
                return `
                    <div class="alert-item">
                        <div class="alert-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="alert-content">
                            <div class="alert-title">
                                ${product.name} (${product.sku})
                            </div>
                            <div class="alert-description">
                                ${stockLevel === 0 ? 'Out of stock' : `Low stock: ${stockLevel} units remaining`}
                            </div>
                        </div>
                        <div class="alert-actions">
                            <span class="status-badge ${alertClass}">
                                ${stockLevel === 0 ? 'Out of Stock' : 'Low Stock'}
                            </span>
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = alertsHTML;
        } catch (error) {
            console.error('Error loading low stock alerts:', error);
            container.innerHTML = this.getEmptyState('Failed to load alerts', 'fas fa-exclamation-triangle');
        }
    }

    showChartError(chartId, message) {
        const container = document.getElementById(chartId)?.parentElement;
        if (container) {
            container.innerHTML = `
                <div class="chart-error">
                    <i class="fas fa-chart-line" style="font-size: 3rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                    <p>${message}</p>
                    <button class="btn btn-sm btn-primary" onclick="dashboardManager.initializeCharts()">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.textAlign = 'center';
            container.style.color = 'var(--text-secondary)';
        }
    }

    getEmptyState(message, icon = 'fas fa-inbox') {
        return `
            <div class="empty-state">
                <i class="${icon}"></i>
                <h3>No Data</h3>
                <p>${message}</p>
            </div>
        `;
    }

    getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days} day${days === 1 ? '' : 's'} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        } else {
            return 'Just now';
        }
    }

    setLoadingState(isLoading) {
        this.isLoading = isLoading;
        const refreshButton = document.querySelector('[onclick="refreshDashboard()"]');
        
        if (refreshButton) {
            if (isLoading) {
                refreshButton.disabled = true;
                refreshButton.innerHTML = '<span class="loading"></span> Refreshing...';
            } else {
                refreshButton.disabled = false;
                refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            }
        }
    }

    startAutoRefresh() {
        // Clear existing interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Set new interval for 5 minutes
        this.refreshInterval = setInterval(() => {
            if (!this.isLoading) {
                this.refreshDashboard();
            }
        }, 300000); // 5 minutes
    }

    async refreshDashboard() {
        if (this.isLoading) return;
        
        try {
            await Promise.all([
                this.loadDashboardStats(),
                this.initializeCharts(),
                this.loadRecentActivities(),
                this.loadLowStockAlerts()
            ]);
            
            showNotification('Dashboard refreshed successfully', 'success', 3000);
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            showNotification('Failed to refresh dashboard', 'error');
        }
    }

    exportChart(chartId) {
        const chart = this.charts[chartId];
        if (!chart) {
            showNotification('Chart not found', 'error');
            return;
        }

        const link = document.createElement('a');
        link.download = `${chartId}_${new Date().toISOString().split('T')[0]}.png`;
        link.href = chart.toBase64Image();
        link.click();
        
        showNotification('Chart exported successfully', 'success');
    }

    handleGlobalSearch(query) {
        // For dashboard, we could search through recent activities
        const activities = document.querySelectorAll('.activity-item');
        const alerts = document.querySelectorAll('.alert-item');
        
        [...activities, ...alerts].forEach(item => {
            const text = item.textContent.toLowerCase();
            const matches = text.includes(query.toLowerCase());
            item.style.display = matches ? '' : 'none';
        });
    }

    destroy() {
        // Cleanup
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
    }
}

// Global functions
function refreshDashboard() {
    if (window.dashboardManager) {
        window.dashboardManager.refreshDashboard();
    }
}

function exportChart(chartId) {
    if (window.dashboardManager) {
        window.dashboardManager.exportChart(chartId);
    }
}

// Initialize dashboard manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
        // Wait for DataStorage to be available
        if (typeof DataStorage !== 'undefined' && DataStorage) {
            window.dashboardManager = new DashboardManager();
        } else {
            // Retry after a short delay
            setTimeout(() => {
                if (typeof DataStorage !== 'undefined' && DataStorage) {
                    window.dashboardManager = new DashboardManager();
                } else {
                    console.error('DataStorage is not available, dashboard functionality will be limited');
                    // Still create dashboard manager but it will use fallback data
                    window.dashboardManager = new DashboardManager();
                }
            }, 1000);
        }
    }
});

// Cleanup when leaving page
window.addEventListener('beforeunload', function() {
    if (window.dashboardManager) {
        window.dashboardManager.destroy();
    }
});
