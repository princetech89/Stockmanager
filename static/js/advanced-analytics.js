// Advanced Analytics and Forecasting System
class AdvancedAnalyticsManager {
    constructor() {
        this.charts = {};
        this.forecastData = null;
        this.analyticsData = null;
        this.init();
    }

    init() {
        this.addAnalyticsStyles();
        this.setupAnalyticsTools();
        this.loadAnalyticsData();
    }

    addAnalyticsStyles() {
        const styles = document.createElement('style');
        styles.id = 'advanced-analytics-styles';
        styles.textContent = `
            .analytics-dashboard {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 2rem;
                margin-bottom: 2rem;
            }

            .analytics-card {
                background: white;
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: var(--shadow-lg);
                border: 1px solid var(--border-color);
                transition: all 0.3s ease;
            }

            .analytics-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-xl);
            }

            .analytics-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 0.75rem;
                border-bottom: 1px solid var(--border-light);
            }

            .analytics-title {
                font-size: 1.125rem;
                font-weight: 600;
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .analytics-controls {
                display: flex;
                gap: 0.5rem;
            }

            .analytics-btn {
                background: var(--bg-tertiary);
                border: none;
                color: var(--text-secondary);
                padding: 0.5rem;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 0.875rem;
            }

            .analytics-btn:hover {
                background: var(--primary-color);
                color: white;
            }

            .chart-container {
                position: relative;
                height: 300px;
                margin-bottom: 1rem;
            }

            .chart-container.large {
                height: 400px;
            }

            .chart-loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--text-light);
            }

            .spinner {
                width: 20px;
                height: 20px;
                border: 2px solid var(--border-color);
                border-top: 2px solid var(--primary-color);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .forecast-insights {
                background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
                border-radius: 8px;
                padding: 1rem;
                margin-top: 1rem;
            }

            .insight-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.5rem 0;
                border-bottom: 1px solid rgba(59, 130, 246, 0.1);
            }

            .insight-item:last-child {
                border-bottom: none;
            }

            .insight-icon {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.875rem;
                color: white;
            }

            .insight-icon.positive {
                background: var(--success-color);
            }

            .insight-icon.negative {
                background: var(--danger-color);
            }

            .insight-icon.neutral {
                background: var(--info-color);
            }

            .analytics-metrics {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .metric-box {
                text-align: center;
                padding: 1rem;
                background: var(--bg-light);
                border-radius: 8px;
                border: 1px solid var(--border-light);
            }

            .metric-value {
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--primary-color);
                margin-bottom: 0.25rem;
            }

            .metric-label {
                font-size: 0.875rem;
                color: var(--text-secondary);
            }

            .metric-change {
                font-size: 0.75rem;
                font-weight: 500;
                margin-top: 0.25rem;
            }

            .metric-change.positive {
                color: var(--success-color);
            }

            .metric-change.negative {
                color: var(--danger-color);
            }

            .abc-analysis {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                margin-top: 1rem;
            }

            .abc-category {
                text-align: center;
                padding: 1rem;
                border-radius: 8px;
                color: white;
                font-weight: 600;
            }

            .abc-category.a {
                background: linear-gradient(135deg, #ef4444, #dc2626);
            }

            .abc-category.b {
                background: linear-gradient(135deg, #f59e0b, #d97706);
            }

            .abc-category.c {
                background: linear-gradient(135deg, #10b981, #059669);
            }

            .trend-indicator {
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
                font-size: 0.875rem;
                font-weight: 500;
            }

            .trend-indicator.up {
                color: var(--success-color);
            }

            .trend-indicator.down {
                color: var(--danger-color);
            }

            .trend-indicator.stable {
                color: var(--text-secondary);
            }

            .export-options {
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                box-shadow: var(--shadow-lg);
                z-index: 1000;
                min-width: 150px;
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.2s ease;
                pointer-events: none;
            }

            .export-options.visible {
                opacity: 1;
                transform: translateY(0);
                pointer-events: all;
            }

            .export-option {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem;
                cursor: pointer;
                transition: background-color 0.2s ease;
                font-size: 0.875rem;
            }

            .export-option:hover {
                background: var(--bg-light);
            }

            .export-option:first-child {
                border-radius: 6px 6px 0 0;
            }

            .export-option:last-child {
                border-radius: 0 0 6px 6px;
            }

            /* Dark mode styles */
            .dark-mode .analytics-card {
                background: var(--bg-primary);
                border-color: var(--border-color);
            }

            .dark-mode .forecast-insights {
                background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(30, 64, 175, 0.1));
            }

            .dark-mode .metric-box {
                background: var(--bg-tertiary);
                border-color: var(--border-color);
            }

            .dark-mode .export-options {
                background: var(--bg-primary);
                border-color: var(--border-color);
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(styles);
    }

    setupAnalyticsTools() {
        // Add analytics tools to existing dashboard
        this.injectAnalyticsTools();
    }

    injectAnalyticsTools() {
        // Find dashboard container or create one
        let dashboardContainer = document.querySelector('.dashboard-content');
        if (!dashboardContainer) {
            dashboardContainer = document.querySelector('.main-content');
        }

        if (dashboardContainer) {
            // Create analytics section
            const analyticsSection = document.createElement('div');
            analyticsSection.id = 'advancedAnalytics';
            analyticsSection.innerHTML = this.getAnalyticsDashboardHTML();
            
            // Insert after existing dashboard content
            const existingMetrics = dashboardContainer.querySelector('.metrics-grid');
            if (existingMetrics) {
                existingMetrics.after(analyticsSection);
            } else {
                dashboardContainer.appendChild(analyticsSection);
            }

            // Initialize charts
            setTimeout(() => {
                this.initializeCharts();
            }, 500);
        }
    }

    getAnalyticsDashboardHTML() {
        return `
            <div class="analytics-dashboard">
                <!-- Sales Forecasting -->
                <div class="analytics-card">
                    <div class="analytics-header">
                        <div class="analytics-title">
                            <i class="fas fa-chart-line"></i>
                            Sales Forecasting
                        </div>
                        <div class="analytics-controls">
                            <button class="analytics-btn" onclick="advancedAnalytics.refreshForecast()">
                                <i class="fas fa-sync"></i>
                            </button>
                            <div style="position: relative;">
                                <button class="analytics-btn" onclick="advancedAnalytics.toggleExportOptions('forecast')">
                                    <i class="fas fa-download"></i>
                                </button>
                                <div class="export-options" id="forecastExport">
                                    <div class="export-option" onclick="advancedAnalytics.exportChart('forecast', 'png')">
                                        <i class="fas fa-image"></i> PNG
                                    </div>
                                    <div class="export-option" onclick="advancedAnalytics.exportChart('forecast', 'pdf')">
                                        <i class="fas fa-file-pdf"></i> PDF
                                    </div>
                                    <div class="export-option" onclick="advancedAnalytics.exportData('forecast')">
                                        <i class="fas fa-table"></i> CSV
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="chart-container large" id="salesForecastChart">
                        <div class="chart-loading">
                            <div class="spinner"></div>
                            <span>Loading forecast...</span>
                        </div>
                    </div>
                    <div class="forecast-insights" id="forecastInsights">
                        <!-- Dynamic insights will be populated here -->
                    </div>
                </div>

                <!-- ABC Analysis -->
                <div class="analytics-card">
                    <div class="analytics-header">
                        <div class="analytics-title">
                            <i class="fas fa-layer-group"></i>
                            ABC Analysis
                        </div>
                        <div class="analytics-controls">
                            <button class="analytics-btn" onclick="advancedAnalytics.refreshABC()">
                                <i class="fas fa-sync"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-container" id="abcAnalysisChart">
                        <div class="chart-loading">
                            <div class="spinner"></div>
                            <span>Analyzing products...</span>
                        </div>
                    </div>
                    <div class="abc-analysis" id="abcCategories">
                        <div class="abc-category a">
                            <div style="font-size: 1.5rem;">0</div>
                            <div>Category A</div>
                            <div style="font-size: 0.875rem;">High Value</div>
                        </div>
                        <div class="abc-category b">
                            <div style="font-size: 1.5rem;">0</div>
                            <div>Category B</div>
                            <div style="font-size: 0.875rem;">Medium Value</div>
                        </div>
                        <div class="abc-category c">
                            <div style="font-size: 1.5rem;">0</div>
                            <div>Category C</div>
                            <div style="font-size: 0.875rem;">Low Value</div>
                        </div>
                    </div>
                </div>

                <!-- Seasonal Trends -->
                <div class="analytics-card">
                    <div class="analytics-header">
                        <div class="analytics-title">
                            <i class="fas fa-calendar-alt"></i>
                            Seasonal Trends
                        </div>
                        <div class="analytics-controls">
                            <button class="analytics-btn" onclick="advancedAnalytics.toggleTimeframe()">
                                <i class="fas fa-clock"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-container" id="seasonalTrendsChart">
                        <div class="chart-loading">
                            <div class="spinner"></div>
                            <span>Analyzing trends...</span>
                        </div>
                    </div>
                    <div class="analytics-metrics" id="seasonalMetrics">
                        <!-- Dynamic metrics will be populated here -->
                    </div>
                </div>

                <!-- Inventory Optimization -->
                <div class="analytics-card">
                    <div class="analytics-header">
                        <div class="analytics-title">
                            <i class="fas fa-warehouse"></i>
                            Inventory Optimization
                        </div>
                        <div class="analytics-controls">
                            <button class="analytics-btn" onclick="advancedAnalytics.optimizeInventory()">
                                <i class="fas fa-magic"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-container" id="inventoryOptimizationChart">
                        <div class="chart-loading">
                            <div class="spinner"></div>
                            <span>Optimizing inventory...</span>
                        </div>
                    </div>
                    <div id="optimizationInsights">
                        <!-- Dynamic optimization suggestions will be populated here -->
                    </div>
                </div>
            </div>
        `;
    }

    async loadAnalyticsData() {
        // Simulate loading analytics data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.analyticsData = {
            salesForecast: this.generateSalesForecastData(),
            abcAnalysis: this.generateABCAnalysisData(),
            seasonalTrends: this.generateSeasonalTrendsData(),
            inventoryOptimization: this.generateInventoryOptimizationData()
        };
    }

    generateSalesForecastData() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const historical = [];
        const forecast = [];
        
        // Generate historical data (last 12 months)
        for (let i = 0; i < 12; i++) {
            historical.push({
                month: months[i],
                sales: 50000 + Math.random() * 30000,
                type: 'historical'
            });
        }
        
        // Generate forecast data (next 6 months)
        let lastSales = historical[historical.length - 1].sales;
        for (let i = 0; i < 6; i++) {
            const growth = 0.02 + Math.random() * 0.08; // 2-10% growth
            lastSales = lastSales * (1 + growth);
            forecast.push({
                month: months[(11 + i) % 12] + ' (Forecast)',
                sales: lastSales,
                type: 'forecast'
            });
        }
        
        return { historical, forecast };
    }

    generateABCAnalysisData() {
        return {
            categoryA: { count: 45, percentage: 20, value: 70 },
            categoryB: { count: 67, percentage: 30, value: 20 },
            categoryC: { count: 113, percentage: 50, value: 10 }
        };
    }

    generateSeasonalTrendsData() {
        const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
        return quarters.map((quarter, index) => ({
            quarter,
            sales: 200000 + (index * 50000) + (Math.random() * 30000),
            growth: -5 + Math.random() * 20
        }));
    }

    generateInventoryOptimizationData() {
        return {
            overstocked: 23,
            understocked: 15,
            optimal: 187,
            suggestions: [
                { product: 'Premium Laptop', action: 'reduce', quantity: 15, reason: 'Low demand' },
                { product: 'Wireless Mouse', action: 'increase', quantity: 50, reason: 'High demand' },
                { product: 'Office Chair', action: 'maintain', quantity: 0, reason: 'Optimal level' }
            ]
        };
    }

    async initializeCharts() {
        await this.loadAnalyticsData();
        
        this.initializeSalesForecastChart();
        this.initializeABCChart();
        this.initializeSeasonalTrendsChart();
        this.initializeInventoryOptimizationChart();
        
        this.updateInsights();
    }

    initializeSalesForecastChart() {
        const ctx = document.createElement('canvas');
        document.getElementById('salesForecastChart').innerHTML = '';
        document.getElementById('salesForecastChart').appendChild(ctx);

        const data = this.analyticsData.salesForecast;
        const allData = [...data.historical, ...data.forecast];

        this.charts.salesForecast = new Chart(ctx, {
            type: 'line',
            data: {
                labels: allData.map(d => d.month),
                datasets: [{
                    label: 'Historical Sales',
                    data: data.historical.map(d => d.sales),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true
                }, {
                    label: 'Forecast',
                    data: Array(data.historical.length).fill(null).concat(data.forecast.map(d => d.sales)),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Sales Forecast (Next 6 Months)'
                    },
                    legend: {
                        display: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return '₹' + (value / 1000).toFixed(0) + 'K';
                            }
                        }
                    }
                }
            }
        });
    }

    initializeABCChart() {
        const ctx = document.createElement('canvas');
        document.getElementById('abcAnalysisChart').innerHTML = '';
        document.getElementById('abcAnalysisChart').appendChild(ctx);

        const data = this.analyticsData.abcAnalysis;

        this.charts.abcAnalysis = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Category A (High Value)', 'Category B (Medium Value)', 'Category C (Low Value)'],
                datasets: [{
                    data: [data.categoryA.count, data.categoryB.count, data.categoryC.count],
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Update ABC categories display
        const categories = document.getElementById('abcCategories');
        if (categories) {
            const categoryA = categories.querySelector('.abc-category.a div');
            const categoryB = categories.querySelector('.abc-category.b div');
            const categoryC = categories.querySelector('.abc-category.c div');
            
            if (categoryA) categoryA.textContent = data.categoryA.count;
            if (categoryB) categoryB.textContent = data.categoryB.count;
            if (categoryC) categoryC.textContent = data.categoryC.count;
        }
    }

    initializeSeasonalTrendsChart() {
        const ctx = document.createElement('canvas');
        document.getElementById('seasonalTrendsChart').innerHTML = '';
        document.getElementById('seasonalTrendsChart').appendChild(ctx);

        const data = this.analyticsData.seasonalTrends;

        this.charts.seasonalTrends = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.quarter),
                datasets: [{
                    label: 'Quarterly Sales',
                    data: data.map(d => d.sales),
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
                    borderRadius: 4
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
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + (value / 1000).toFixed(0) + 'K';
                            }
                        }
                    }
                }
            }
        });

        // Update seasonal metrics
        this.updateSeasonalMetrics(data);
    }

    updateSeasonalMetrics(data) {
        const metricsContainer = document.getElementById('seasonalMetrics');
        if (!metricsContainer) return;

        const totalSales = data.reduce((sum, d) => sum + d.sales, 0);
        const avgGrowth = data.reduce((sum, d) => sum + d.growth, 0) / data.length;
        const bestQuarter = data.reduce((best, current) => current.sales > best.sales ? current : best);

        metricsContainer.innerHTML = `
            <div class="metric-box">
                <div class="metric-value">₹${(totalSales / 1000000).toFixed(1)}M</div>
                <div class="metric-label">Total Sales</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${avgGrowth.toFixed(1)}%</div>
                <div class="metric-label">Avg Growth</div>
                <div class="metric-change ${avgGrowth >= 0 ? 'positive' : 'negative'}">
                    <i class="fas fa-arrow-${avgGrowth >= 0 ? 'up' : 'down'}"></i>
                    ${Math.abs(avgGrowth).toFixed(1)}%
                </div>
            </div>
            <div class="metric-box">
                <div class="metric-value">${bestQuarter.quarter}</div>
                <div class="metric-label">Best Quarter</div>
                <div class="metric-change positive">
                    ₹${(bestQuarter.sales / 1000).toFixed(0)}K
                </div>
            </div>
        `;
    }

    initializeInventoryOptimizationChart() {
        const ctx = document.createElement('canvas');
        document.getElementById('inventoryOptimizationChart').innerHTML = '';
        document.getElementById('inventoryOptimizationChart').appendChild(ctx);

        const data = this.analyticsData.inventoryOptimization;

        this.charts.inventoryOptimization = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Overstocked', 'Understocked', 'Optimal'],
                datasets: [{
                    data: [data.overstocked, data.understocked, data.optimal],
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Update optimization insights
        this.updateOptimizationInsights(data);
    }

    updateOptimizationInsights(data) {
        const insightsContainer = document.getElementById('optimizationInsights');
        if (!insightsContainer) return;

        let html = '<div class="forecast-insights">';
        
        data.suggestions.forEach(suggestion => {
            const iconClass = suggestion.action === 'reduce' ? 'negative' : 
                             suggestion.action === 'increase' ? 'positive' : 'neutral';
            const icon = suggestion.action === 'reduce' ? 'fa-arrow-down' :
                        suggestion.action === 'increase' ? 'fa-arrow-up' : 'fa-check';

            html += `
                <div class="insight-item">
                    <div class="insight-icon ${iconClass}">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div>
                        <strong>${suggestion.product}</strong>: ${suggestion.action} by ${suggestion.quantity} units
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">${suggestion.reason}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        insightsContainer.innerHTML = html;
    }

    updateInsights() {
        const forecastInsights = document.getElementById('forecastInsights');
        if (!forecastInsights) return;

        const data = this.analyticsData.salesForecast;
        const lastHistorical = data.historical[data.historical.length - 1].sales;
        const firstForecast = data.forecast[0].sales;
        const growthRate = ((firstForecast - lastHistorical) / lastHistorical * 100);

        const insights = [
            {
                icon: 'positive',
                text: `Expected ${growthRate.toFixed(1)}% growth next month`,
                iconClass: 'fa-trending-up'
            },
            {
                icon: 'neutral',
                text: `Peak season expected in ${data.forecast[2].month}`,
                iconClass: 'fa-calendar-alt'
            },
            {
                icon: 'positive',
                text: `Revenue target: ₹${(firstForecast / 1000).toFixed(0)}K`,
                iconClass: 'fa-target'
            }
        ];

        let html = '';
        insights.forEach(insight => {
            html += `
                <div class="insight-item">
                    <div class="insight-icon ${insight.icon}">
                        <i class="fas ${insight.iconClass}"></i>
                    </div>
                    <div>${insight.text}</div>
                </div>
            `;
        });

        forecastInsights.innerHTML = html;
    }

    // Export and utility methods
    toggleExportOptions(chartType) {
        const exportOptions = document.getElementById(chartType + 'Export');
        if (exportOptions) {
            exportOptions.classList.toggle('visible');
        }
    }

    exportChart(chartType, format) {
        const chart = this.charts[chartType];
        if (!chart) return;

        if (format === 'png') {
            const url = chart.toBase64Image();
            const link = document.createElement('a');
            link.download = `${chartType}-chart.png`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else if (format === 'pdf') {
            // For PDF export, you'd integrate with jsPDF
            showNotification('PDF export feature coming soon!', 'info');
        }

        this.toggleExportOptions(chartType);
        showNotification(`${chartType} chart exported as ${format.toUpperCase()}`, 'success');
    }

    exportData(chartType) {
        const data = this.analyticsData[chartType];
        if (!data) return;

        const csvContent = this.convertToCSV(data);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.download = `${chartType}-data.csv`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        this.toggleExportOptions(chartType);
        showNotification(`${chartType} data exported as CSV`, 'success');
    }

    convertToCSV(data) {
        // Simple CSV conversion - in production, use a proper library
        if (Array.isArray(data)) {
            const headers = Object.keys(data[0]);
            const rows = data.map(row => headers.map(header => row[header]));
            return [headers, ...rows].map(row => row.join(',')).join('\\n');
        }
        return JSON.stringify(data, null, 2);
    }

    // Refresh methods
    async refreshForecast() {
        showNotification('Refreshing sales forecast...', 'info');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.analyticsData.salesForecast = this.generateSalesForecastData();
        this.initializeSalesForecastChart();
        this.updateInsights();
        
        showNotification('Sales forecast updated!', 'success');
    }

    async refreshABC() {
        showNotification('Refreshing ABC analysis...', 'info');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        this.analyticsData.abcAnalysis = this.generateABCAnalysisData();
        this.initializeABCChart();
        
        showNotification('ABC analysis updated!', 'success');
    }

    async optimizeInventory() {
        showNotification('Optimizing inventory levels...', 'info');
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        this.analyticsData.inventoryOptimization = this.generateInventoryOptimizationData();
        this.initializeInventoryOptimizationChart();
        
        showNotification('Inventory optimization complete!', 'success');
    }

    toggleTimeframe() {
        showNotification('Timeframe toggle feature coming soon!', 'info');
    }
}

// Initialize Advanced Analytics Manager
let advancedAnalytics;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        advancedAnalytics = new AdvancedAnalyticsManager();
    });
} else {
    advancedAnalytics = new AdvancedAnalyticsManager();
}

// Export for use in other modules
window.AdvancedAnalyticsManager = AdvancedAnalyticsManager;
window.advancedAnalytics = advancedAnalytics;