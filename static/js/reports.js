/**
 * Reports & Analytics functionality for Stock Inventory Management System
 * Handles report generation, filtering, and data visualization
 */

class ReportsManager {
    constructor() {
        this.reportData = [];
        this.currentChart = null;
        this.currentReportType = 'sales';
        this.products = [];
        this.orders = [];
        this.invoices = [];
        this.settings = {};
        
        this.initializeReports();
        this.bindEvents();
    }

    initializeReports() {
        this.loadSettings();
        this.loadData();
        this.setupDefaultFilters();
        this.loadReportData();
    }

    bindEvents() {
        // Report type change
        const reportType = document.getElementById('reportType');
        if (reportType) {
            reportType.addEventListener('change', (e) => {
                this.currentReportType = e.target.value;
                this.updateReportFields();
                this.loadReportData();
            });
        }

        // Period change
        const reportPeriod = document.getElementById('reportPeriod');
        if (reportPeriod) {
            reportPeriod.addEventListener('change', (e) => {
                this.updateDateRange();
            });
        }

        // Chart type change
        const chartType = document.getElementById('chartType');
        if (chartType) {
            chartType.addEventListener('change', (e) => {
                this.updateChartType();
            });
        }

        // Date inputs
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate) {
            startDate.addEventListener('change', () => {
                this.validateDateRange();
            });
        }
        
        if (endDate) {
            endDate.addEventListener('change', () => {
                this.validateDateRange();
            });
        }

        // Global search event listener
        document.addEventListener('globalSearch', (e) => {
            this.handleGlobalSearch(e.detail.query);
        });
    }

    loadSettings() {
        this.settings = DataStorage.getSettings();
    }

    async loadData() {
        try {
            this.products = await DataStorage.getProducts();
            this.orders = [
                ...(await DataStorage.getOrders('sales')),
                ...(await DataStorage.getOrders('purchase'))
            ];
            this.invoices = DataStorage.getInvoices();
        } catch (error) {
            console.error('Error loading data for reports:', error);
            showNotification('Failed to load data for reports', 'error');
        }
    }

    setupDefaultFilters() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput) {
            startDateInput.value = startOfMonth.toISOString().split('T')[0];
        }
        if (endDateInput) {
            endDateInput.value = today.toISOString().split('T')[0];
        }

        // Set period to current month
        const reportPeriod = document.getElementById('reportPeriod');
        if (reportPeriod) {
            reportPeriod.value = 'month';
        }
    }

    updateReportFields() {
        const chartTitle = document.getElementById('chartTitle');
        const gstSummary = document.getElementById('gstSummary');
        
        const titles = {
            sales: 'Sales Overview',
            inventory: 'Inventory Analysis',
            gst: 'GST Report',
            profit: 'Profit & Loss Analysis'
        };
        
        if (chartTitle) {
            chartTitle.textContent = titles[this.currentReportType] || 'Report Overview';
        }
        
        // Show GST summary only for GST reports
        if (gstSummary) {
            gstSummary.style.display = this.currentReportType === 'gst' ? 'block' : 'none';
        }
        
        // Update chart type options based on report type
        this.updateChartTypeOptions();
    }

    updateChartTypeOptions() {
        const chartType = document.getElementById('chartType');
        if (!chartType) return;

        const currentValue = chartType.value;
        chartType.innerHTML = '';

        const options = {
            sales: [
                { value: 'line', text: 'Line Chart' },
                { value: 'bar', text: 'Bar Chart' },
                { value: 'pie', text: 'Pie Chart' }
            ],
            inventory: [
                { value: 'bar', text: 'Bar Chart' },
                { value: 'pie', text: 'Pie Chart' },
                { value: 'doughnut', text: 'Doughnut Chart' }
            ],
            gst: [
                { value: 'pie', text: 'Pie Chart' },
                { value: 'doughnut', text: 'Doughnut Chart' },
                { value: 'bar', text: 'Bar Chart' }
            ],
            profit: [
                { value: 'line', text: 'Line Chart' },
                { value: 'bar', text: 'Bar Chart' }
            ]
        };

        const typeOptions = options[this.currentReportType] || options.sales;
        
        typeOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            if (option.value === currentValue) {
                optionElement.selected = true;
            }
            chartType.appendChild(optionElement);
        });

        // Set default if current value not available
        if (!typeOptions.some(opt => opt.value === currentValue)) {
            chartType.value = typeOptions[0].value;
        }
    }

    updateDateRange() {
        const period = document.getElementById('reportPeriod')?.value;
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        const customDateRange = document.getElementById('customDateRange');
        
        if (!startDate || !endDate) return;

        const today = new Date();
        let start, end;

        switch (period) {
            case 'today':
                start = end = today;
                break;
            case 'week':
                start = new Date(today);
                start.setDate(today.getDate() - 7);
                end = today;
                break;
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = today;
                break;
            case 'quarter':
                const quarterStart = Math.floor(today.getMonth() / 3) * 3;
                start = new Date(today.getFullYear(), quarterStart, 1);
                end = today;
                break;
            case 'year':
                start = new Date(today.getFullYear(), 0, 1);
                end = today;
                break;
            case 'custom':
                if (customDateRange) {
                    customDateRange.style.display = 'flex';
                }
                return;
            default:
                return;
        }

        if (customDateRange) {
            customDateRange.style.display = 'none';
        }

        startDate.value = start.toISOString().split('T')[0];
        endDate.value = end.toISOString().split('T')[0];
        
        this.validateDateRange();
    }

    validateDateRange() {
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (!startDate || !endDate || !startDate.value || !endDate.value) {
            return false;
        }

        const start = new Date(startDate.value);
        const end = new Date(endDate.value);

        if (start > end) {
            this.showFieldError(endDate, 'End date must be after start date');
            return false;
        }

        this.clearFieldError(startDate);
        this.clearFieldError(endDate);
        return true;
    }

    async loadReportData() {
        if (!this.validateDateRange()) {
            return;
        }

        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        endDate.setHours(23, 59, 59, 999); // End of day

        switch (this.currentReportType) {
            case 'sales':
                this.generateSalesReport(startDate, endDate);
                break;
            case 'inventory':
                this.generateInventoryReport(startDate, endDate);
                break;
            case 'gst':
                this.generateGSTReport(startDate, endDate);
                break;
            case 'profit':
                this.generateProfitReport(startDate, endDate);
                break;
        }
    }

    generateSalesReport(startDate, endDate) {
        const salesOrders = this.orders.filter(order => 
            order.order_type === 'sales' &&
            new Date(order.created_at) >= startDate &&
            new Date(order.created_at) <= endDate
        );

        // Prepare chart data
        const dailySales = {};
        salesOrders.forEach(order => {
            const date = new Date(order.created_at).toLocaleDateString();
            dailySales[date] = (dailySales[date] || 0) + (order.total_amount || 0);
        });

        const chartData = {
            labels: Object.keys(dailySales),
            datasets: [{
                label: 'Sales Amount (₹)',
                data: Object.values(dailySales),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true
            }]
        };

        this.renderChart(chartData);

        // Generate summary
        const totalSales = salesOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const totalOrders = salesOrders.length;
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        const totalGST = salesOrders.reduce((sum, order) => sum + (order.gst_amount || 0), 0);

        this.updateReportSummary([
            { label: 'Total Sales', value: DataStorage.formatCurrency(totalSales) },
            { label: 'Total Orders', value: totalOrders },
            { label: 'Average Order Value', value: DataStorage.formatCurrency(avgOrderValue) },
            { label: 'Total GST Collected', value: DataStorage.formatCurrency(totalGST) }
        ]);

        // Generate detailed table
        this.renderReportTable([
            'Date', 'Order Number', 'Customer', 'Amount', 'GST', 'Total', 'Status'
        ], salesOrders.map(order => [
            DataStorage.formatDate(order.created_at),
            order.order_number,
            order.customer_name || 'N/A',
            DataStorage.formatCurrency(order.total_amount || 0),
            DataStorage.formatCurrency(order.gst_amount || 0),
            DataStorage.formatCurrency((order.total_amount || 0) + (order.gst_amount || 0)),
            order.status
        ]));
    }

    generateInventoryReport(startDate, endDate) {
        // Current stock by category
        const categoryStock = {};
        const categoryValue = {};

        this.products.forEach(product => {
            const category = product.category || 'Uncategorized';
            const stock = product.available_qty || 0;
            const value = stock * (product.unit_price || 0);

            categoryStock[category] = (categoryStock[category] || 0) + stock;
            categoryValue[category] = (categoryValue[category] || 0) + value;
        });

        const chartData = {
            labels: Object.keys(categoryStock),
            datasets: [{
                label: 'Stock Quantity',
                data: Object.values(categoryStock),
                backgroundColor: [
                    '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
                    '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
                ]
            }]
        };

        this.renderChart(chartData);

        // Generate summary
        const totalProducts = this.products.length;
        const totalStock = this.products.reduce((sum, p) => sum + (p.available_qty || 0), 0);
        const totalValue = this.products.reduce((sum, p) => sum + ((p.available_qty || 0) * (p.unit_price || 0)), 0);
        const lowStockItems = this.products.filter(p => (p.available_qty || 0) <= (p.min_qty || 10)).length;

        this.updateReportSummary([
            { label: 'Total Products', value: totalProducts },
            { label: 'Total Stock', value: totalStock },
            { label: 'Total Stock Value', value: DataStorage.formatCurrency(totalValue) },
            { label: 'Low Stock Items', value: lowStockItems }
        ]);

        // Generate detailed table
        this.renderReportTable([
            'Product Name', 'SKU', 'Category', 'Current Stock', 'Min Stock', 'Unit Price', 'Stock Value', 'Status'
        ], this.products.map(product => {
            const stock = product.available_qty || 0;
            const minStock = product.min_qty || 10;
            const value = stock * (product.unit_price || 0);
            let status = 'In Stock';
            
            if (stock === 0) status = 'Out of Stock';
            else if (stock <= minStock) status = 'Low Stock';

            return [
                product.name,
                product.sku,
                product.category || 'Uncategorized',
                stock,
                minStock,
                DataStorage.formatCurrency(product.unit_price || 0),
                DataStorage.formatCurrency(value),
                status
            ];
        }));
    }

    generateGSTReport(startDate, endDate) {
        const gstOrders = this.orders.filter(order => 
            new Date(order.created_at) >= startDate &&
            new Date(order.created_at) <= endDate &&
            (order.gst_amount || 0) > 0
        );

        // Calculate GST by rate
        const gstByRate = {};
        let totalCGST = 0, totalSGST = 0, totalIGST = 0;

        gstOrders.forEach(order => {
            // This is simplified - in real implementation, you'd calculate based on individual items
            const gstAmount = order.gst_amount || 0;
            
            // For demo purposes, assume 18% GST and intra-state
            const rate = '18%';
            gstByRate[rate] = (gstByRate[rate] || 0) + gstAmount;
            
            // Split between CGST and SGST (simplified)
            totalCGST += gstAmount / 2;
            totalSGST += gstAmount / 2;
        });

        const chartData = {
            labels: Object.keys(gstByRate),
            datasets: [{
                label: 'GST Amount (₹)',
                data: Object.values(gstByRate),
                backgroundColor: [
                    '#3b82f6', '#ef4444', '#10b981', '#f59e0b'
                ]
            }]
        };

        this.renderChart(chartData);

        // Update GST summary
        document.getElementById('cgst9').textContent = DataStorage.formatCurrency(totalCGST);
        document.getElementById('sgst9').textContent = DataStorage.formatCurrency(totalSGST);
        document.getElementById('igst18').textContent = DataStorage.formatCurrency(totalIGST);
        document.getElementById('totalGST').textContent = DataStorage.formatCurrency(totalCGST + totalSGST + totalIGST);

        // Generate summary
        const totalGST = totalCGST + totalSGST + totalIGST;
        const totalTaxableValue = gstOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

        this.updateReportSummary([
            { label: 'Total Taxable Value', value: DataStorage.formatCurrency(totalTaxableValue) },
            { label: 'Total GST Collected', value: DataStorage.formatCurrency(totalGST) },
            { label: 'CGST', value: DataStorage.formatCurrency(totalCGST) },
            { label: 'SGST', value: DataStorage.formatCurrency(totalSGST) }
        ]);

        // Generate detailed table
        this.renderReportTable([
            'Date', 'Invoice/Order', 'Customer', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total GST'
        ], gstOrders.map(order => {
            const gstAmount = order.gst_amount || 0;
            return [
                DataStorage.formatDate(order.created_at),
                order.order_number,
                order.customer_name || 'N/A',
                DataStorage.formatCurrency(order.total_amount || 0),
                DataStorage.formatCurrency(gstAmount / 2),
                DataStorage.formatCurrency(gstAmount / 2),
                '₹0.00',
                DataStorage.formatCurrency(gstAmount)
            ];
        }));
    }

    generateProfitReport(startDate, endDate) {
        const salesOrders = this.orders.filter(order => 
            order.order_type === 'sales' &&
            new Date(order.created_at) >= startDate &&
            new Date(order.created_at) <= endDate
        );

        const purchaseOrders = this.orders.filter(order => 
            order.order_type === 'purchase' &&
            new Date(order.created_at) >= startDate &&
            new Date(order.created_at) <= endDate
        );

        // Calculate daily profit/loss
        const dailyData = {};
        
        salesOrders.forEach(order => {
            const date = new Date(order.created_at).toLocaleDateString();
            if (!dailyData[date]) dailyData[date] = { revenue: 0, cost: 0 };
            dailyData[date].revenue += order.total_amount || 0;
        });

        purchaseOrders.forEach(order => {
            const date = new Date(order.created_at).toLocaleDateString();
            if (!dailyData[date]) dailyData[date] = { revenue: 0, cost: 0 };
            dailyData[date].cost += order.total_amount || 0;
        });

        const chartData = {
            labels: Object.keys(dailyData),
            datasets: [{
                label: 'Revenue (₹)',
                data: Object.values(dailyData).map(d => d.revenue),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2
            }, {
                label: 'Cost (₹)',
                data: Object.values(dailyData).map(d => d.cost),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 2
            }]
        };

        this.renderChart(chartData);

        // Calculate totals
        const totalRevenue = salesOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const totalCost = purchaseOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const grossProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        this.updateReportSummary([
            { label: 'Total Revenue', value: DataStorage.formatCurrency(totalRevenue) },
            { label: 'Total Cost', value: DataStorage.formatCurrency(totalCost) },
            { label: 'Gross Profit', value: DataStorage.formatCurrency(grossProfit) },
            { label: 'Profit Margin', value: profitMargin.toFixed(2) + '%' }
        ]);

        // Generate detailed table
        const allOrders = [...salesOrders.map(o => ({ ...o, type: 'Sale' })), ...purchaseOrders.map(o => ({ ...o, type: 'Purchase' }))];
        allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        this.renderReportTable([
            'Date', 'Type', 'Order Number', 'Customer/Supplier', 'Amount', 'Impact'
        ], allOrders.map(order => [
            DataStorage.formatDate(order.created_at),
            order.type,
            order.order_number,
            order.customer_name || 'N/A',
            DataStorage.formatCurrency(order.total_amount || 0),
            order.type === 'Sale' ? '+' + DataStorage.formatCurrency(order.total_amount || 0) : '-' + DataStorage.formatCurrency(order.total_amount || 0)
        ]));
    }

    renderChart(chartData) {
        const ctx = document.getElementById('reportChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.currentChart) {
            this.currentChart.destroy();
        }

        const chartType = document.getElementById('chartType')?.value || 'bar';

        // Configure chart options based on type
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        };

        // Add scales for line and bar charts
        if (chartType === 'line' || chartType === 'bar') {
            options.scales = {
                x: {
                    grid: {
                        display: chartType === 'line'
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
            };
        }

        this.currentChart = new Chart(ctx, {
            type: chartType,
            data: chartData,
            options: options
        });
    }

    updateChartType() {
        if (this.reportData.length > 0) {
            this.loadReportData(); // Regenerate with new chart type
        }
    }

    updateReportSummary(summaryItems) {
        const container = document.getElementById('reportSummary');
        if (!container) return;

        const html = summaryItems.map(item => `
            <div class="summary-item">
                <div class="summary-value">${item.value}</div>
                <div class="summary-label">${item.label}</div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderReportTable(headers, rows) {
        const tableHead = document.getElementById('reportTableHead');
        const tableBody = document.getElementById('reportTableBody');

        if (!tableHead || !tableBody) return;

        // Render headers
        tableHead.innerHTML = `
            <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
        `;

        // Render rows
        if (rows.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="${headers.length}" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-chart-line"></i>
                            <h3>No Data Found</h3>
                            <p>No data available for the selected period.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const html = rows.map(row => `
            <tr>
                ${row.map(cell => `<td>${cell}</td>`).join('')}
            </tr>
        `).join('');

        tableBody.innerHTML = html;
        this.reportData = rows;
    }

    generateReport() {
        this.loadReportData();
        showNotification('Report generated successfully', 'success');
    }

    exportReport() {
        if (this.reportData.length === 0) {
            showNotification('No data to export', 'warning');
            return;
        }

        const reportType = this.currentReportType;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        const filename = `${reportType}_report_${startDate}_to_${endDate}.csv`;
        
        // Get headers from table
        const headers = Array.from(document.querySelectorAll('#reportTableHead th')).map(th => th.textContent);
        
        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...this.reportData.map(row => row.map(cell => {
                const value = cell.toString();
                return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
            }).join(','))
        ].join('\n');

        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);

        showNotification('Report exported successfully', 'success');
    }

    exportTableData() {
        this.exportReport();
    }

    exportTablePDF() {
        if (!window.jsPDF) {
            showNotification('PDF library not loaded', 'error');
            return;
        }

        if (this.reportData.length === 0) {
            showNotification('No data to export', 'warning');
            return;
        }

        try {
            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(16);
            doc.setTextColor(59, 130, 246);
            doc.text(`${this.currentReportType.toUpperCase()} REPORT`, 20, 25);
            
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            doc.text(`Period: ${startDate} to ${endDate}`, 20, 35);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
            
            // Table
            const headers = Array.from(document.querySelectorAll('#reportTableHead th')).map(th => th.textContent);
            
            let yPos = 60;
            
            // Table header
            doc.setFillColor(248, 250, 252);
            doc.rect(20, yPos - 5, 170, 10, 'F');
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            headers.forEach((header, index) => {
                doc.text(header, 25 + (index * 25), yPos);
            });
            
            yPos += 15;
            doc.setFont('helvetica', 'normal');
            
            // Table rows
            this.reportData.slice(0, 30).forEach(row => { // Limit to prevent page overflow
                row.forEach((cell, index) => {
                    const text = cell.toString().substring(0, 15); // Truncate long text
                    doc.text(text, 25 + (index * 25), yPos);
                });
                yPos += 8;
                
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
            });
            
            const filename = `${this.currentReportType}_report_${startDate}_to_${endDate}.pdf`;
            doc.save(filename);
            
            showNotification('PDF exported successfully', 'success');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            showNotification('Failed to export PDF', 'error');
        }
    }

    showFieldError(field, message) {
        app.clearFieldError(field);
        field.classList.add('error');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    handleGlobalSearch(query) {
        const tableBody = document.getElementById('reportTableBody');
        if (!tableBody) return;

        const rows = tableBody.querySelectorAll('tr');
        const searchTerm = query.toLowerCase();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const shouldShow = text.includes(searchTerm) || searchTerm === '';
            row.style.display = shouldShow ? '' : 'none';
        });
    }

    destroy() {
        if (this.currentChart) {
            this.currentChart.destroy();
        }
    }
}

// Global functions
function generateReport() {
    if (window.reportsManager) {
        window.reportsManager.generateReport();
    }
}

function loadReportData() {
    if (window.reportsManager) {
        window.reportsManager.loadReportData();
    }
}

function updateReportFields() {
    if (window.reportsManager) {
        window.reportsManager.updateReportFields();
    }
}

function updateDateRange() {
    if (window.reportsManager) {
        window.reportsManager.updateDateRange();
    }
}

function updateChartType() {
    if (window.reportsManager) {
        window.reportsManager.updateChartType();
    }
}

function exportReport() {
    if (window.reportsManager) {
        window.reportsManager.exportReport();
    }
}

function exportTableData() {
    if (window.reportsManager) {
        window.reportsManager.exportTableData();
    }
}

function exportTablePDF() {
    if (window.reportsManager) {
        window.reportsManager.exportTablePDF();
    }
}

// Initialize reports manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/reports') {
        window.reportsManager = new ReportsManager();
    }
});

// Cleanup when leaving page
window.addEventListener('beforeunload', function() {
    if (window.reportsManager) {
        window.reportsManager.destroy();
    }
});
