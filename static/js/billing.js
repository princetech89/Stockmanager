/**
 * Billing & Invoice Management functionality for Stock Inventory Management System
 * Handles invoice creation, GST calculations, and PDF generation
 */

class BillingManager {
    constructor() {
        this.invoices = [];
        this.products = [];
        this.currentInvoice = null;
        this.invoiceItems = [];
        this.settings = {};
        
        this.initializeBilling();
        this.bindEvents();
    }

    initializeBilling() {
        this.loadSettings();
        this.loadProducts();
        this.loadInvoices();
        this.setupInvoiceForm();
    }

    bindEvents() {
        // Invoice form submission
        const invoiceForm = document.getElementById('invoiceForm');
        if (invoiceForm) {
            invoiceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateInvoice();
            });
        }

        // Customer fields auto-population
        const customerName = document.getElementById('customerName');
        if (customerName) {
            customerName.addEventListener('blur', () => {
                this.populateCustomerDetails();
            });
        }

        // GST number validation
        const customerGST = document.getElementById('customerGST');
        if (customerGST) {
            customerGST.addEventListener('blur', () => {
                this.validateGSTNumber();
            });
        }

        // Invoice search
        const invoiceSearch = document.getElementById('invoiceSearch');
        if (invoiceSearch) {
            invoiceSearch.addEventListener('input', app.debounce((e) => {
                this.filterInvoices(e.target.value);
            }, 300));
        }

        // Global search event listener
        document.addEventListener('globalSearch', (e) => {
            this.handleGlobalSearch(e.detail.query);
        });
    }

    loadSettings() {
        this.settings = DataStorage.getSettings();
    }

    async loadProducts() {
        try {
            this.products = await DataStorage.getProducts();
        } catch (error) {
            console.error('Error loading products:', error);
            showNotification('Failed to load products for billing', 'error');
        }
    }

    loadInvoices() {
        try {
            this.invoices = DataStorage.getInvoices();
            this.renderInvoicesTable();
        } catch (error) {
            console.error('Error loading invoices:', error);
            showNotification('Failed to load invoices', 'error');
        }
    }

    setupInvoiceForm() {
        // Clear form
        this.clearInvoiceForm();
        
        // Add initial invoice item
        this.addInvoiceItem();
    }

    addInvoiceItem() {
        const container = document.getElementById('invoiceItemsBody');
        if (!container) return;

        const itemIndex = this.invoiceItems.length;
        const productOptions = this.products.map(product => 
            `<option value="${product.id}" 
                     data-name="${product.name}" 
                     data-hsn="${product.hsn_code}" 
                     data-price="${product.unit_price}" 
                     data-gst="${product.gst_rate}">
                ${product.name} (${product.sku}) - ₹${product.unit_price}
            </option>`
        ).join('');

        const itemRow = document.createElement('tr');
        itemRow.className = 'invoice-item-row';
        itemRow.setAttribute('data-index', itemIndex);
        itemRow.innerHTML = `
            <td>
                <select class="form-control product-select" required onchange="billingManager.updateItemDetails(${itemIndex})">
                    <option value="">Select Product</option>
                    ${productOptions}
                </select>
                <small class="product-name text-secondary"></small>
            </td>
            <td>
                <input type="text" class="form-control hsn-input" readonly>
            </td>
            <td>
                <input type="number" class="form-control qty-input" min="1" value="1" required onchange="billingManager.calculateItemTotal(${itemIndex})">
            </td>
            <td>
                <input type="number" class="form-control rate-input" step="0.01" min="0" required onchange="billingManager.calculateItemTotal(${itemIndex})">
            </td>
            <td>
                <input type="number" class="form-control gst-input" step="0.01" min="0" max="100" required onchange="billingManager.calculateItemTotal(${itemIndex})">
            </td>
            <td>
                <span class="item-amount">₹0.00</span>
                <input type="hidden" class="item-total-value" value="0">
                <input type="hidden" class="item-gst-value" value="0">
            </td>
            <td>
                <button type="button" class="btn btn-sm btn-danger" onclick="billingManager.removeInvoiceItem(${itemIndex})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        container.appendChild(itemRow);
        
        // Add to items array
        this.invoiceItems.push({
            index: itemIndex,
            productId: '',
            quantity: 1,
            rate: 0,
            gstRate: 0,
            total: 0,
            gstAmount: 0
        });
    }

    removeInvoiceItem(index) {
        const row = document.querySelector(`tr[data-index="${index}"]`);
        if (row) {
            row.remove();
            
            // Remove from items array
            this.invoiceItems = this.invoiceItems.filter(item => item.index !== index);
            
            // Recalculate totals
            this.calculateInvoiceSummary();
        }
    }

    updateItemDetails(index) {
        const row = document.querySelector(`tr[data-index="${index}"]`);
        if (!row) return;

        const productSelect = row.querySelector('.product-select');
        const hsnInput = row.querySelector('.hsn-input');
        const rateInput = row.querySelector('.rate-input');
        const gstInput = row.querySelector('.gst-input');
        const productNameSpan = row.querySelector('.product-name');

        if (productSelect.value) {
            const selectedOption = productSelect.selectedOptions[0];
            const productName = selectedOption.getAttribute('data-name');
            const hsn = selectedOption.getAttribute('data-hsn');
            const price = selectedOption.getAttribute('data-price');
            const gst = selectedOption.getAttribute('data-gst');

            // Update fields
            productNameSpan.textContent = productName;
            hsnInput.value = hsn;
            rateInput.value = price;
            gstInput.value = gst;

            // Update items array
            const item = this.invoiceItems.find(item => item.index === index);
            if (item) {
                item.productId = productSelect.value;
                item.rate = parseFloat(price);
                item.gstRate = parseFloat(gst);
            }

            // Calculate total
            this.calculateItemTotal(index);
        } else {
            // Clear fields
            productNameSpan.textContent = '';
            hsnInput.value = '';
            rateInput.value = '';
            gstInput.value = '';
        }
    }

    calculateItemTotal(index) {
        const row = document.querySelector(`tr[data-index="${index}"]`);
        if (!row) return;

        const qtyInput = row.querySelector('.qty-input');
        const rateInput = row.querySelector('.rate-input');
        const gstInput = row.querySelector('.gst-input');
        const amountSpan = row.querySelector('.item-amount');
        const totalValue = row.querySelector('.item-total-value');
        const gstValue = row.querySelector('.item-gst-value');

        const quantity = parseFloat(qtyInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        const gstRate = parseFloat(gstInput.value) || 0;

        const baseAmount = quantity * rate;
        const gstAmount = (baseAmount * gstRate) / 100;
        const totalAmount = baseAmount + gstAmount;

        // Update display
        amountSpan.textContent = DataStorage.formatCurrency(totalAmount);
        totalValue.value = totalAmount;
        gstValue.value = gstAmount;

        // Update items array
        const item = this.invoiceItems.find(item => item.index === index);
        if (item) {
            item.quantity = quantity;
            item.rate = rate;
            item.gstRate = gstRate;
            item.total = totalAmount;
            item.gstAmount = gstAmount;
            item.baseAmount = baseAmount;
        }

        // Update invoice summary
        this.calculateInvoiceSummary();
    }

    calculateInvoiceSummary() {
        let subtotal = 0;
        let totalCGST = 0;
        let totalSGST = 0;
        let totalIGST = 0;
        let totalGST = 0;

        // Get customer GST state from form
        const customerGST = document.getElementById('customerGST')?.value || '';
        const customerState = this.getStateFromGST(customerGST);
        const businessState = this.settings.gst?.stateCode || '07'; // Default to Delhi

        const isInterState = customerState && customerState !== businessState;

        this.invoiceItems.forEach(item => {
            if (item.productId) {
                subtotal += item.baseAmount || 0;
                
                if (isInterState) {
                    // Inter-state transaction - IGST
                    totalIGST += item.gstAmount || 0;
                } else {
                    // Intra-state transaction - CGST + SGST
                    const halfGST = (item.gstAmount || 0) / 2;
                    totalCGST += halfGST;
                    totalSGST += halfGST;
                }
                
                totalGST += item.gstAmount || 0;
            }
        });

        const grandTotal = subtotal + totalGST;

        // Update summary display
        document.getElementById('subtotal').textContent = DataStorage.formatCurrency(subtotal);
        document.getElementById('cgstAmount').textContent = DataStorage.formatCurrency(totalCGST);
        document.getElementById('sgstAmount').textContent = DataStorage.formatCurrency(totalSGST);
        document.getElementById('igstAmount').textContent = DataStorage.formatCurrency(totalIGST);
        document.getElementById('totalAmount').textContent = DataStorage.formatCurrency(grandTotal);
    }

    getStateFromGST(gstNumber) {
        if (gstNumber.length >= 2) {
            return gstNumber.substring(0, 2);
        }
        return null;
    }

    validateGSTNumber() {
        const gstInput = document.getElementById('customerGST');
        if (!gstInput || !gstInput.value) return;

        const gstNumber = gstInput.value.trim();
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        if (gstNumber && !gstRegex.test(gstNumber)) {
            this.showFieldError(gstInput, 'Invalid GST number format');
            return false;
        } else {
            this.clearFieldError(gstInput);
            // Recalculate GST based on state
            this.calculateInvoiceSummary();
            return true;
        }
    }

    populateCustomerDetails() {
        // This could populate customer details from previous invoices
        // For now, it's a placeholder for future enhancement
        const customerName = document.getElementById('customerName')?.value;
        if (customerName) {
            const previousInvoice = this.invoices.find(inv => 
                inv.customer_name?.toLowerCase() === customerName.toLowerCase()
            );
            
            if (previousInvoice) {
                const customerMobile = document.getElementById('customerMobile');
                const customerGST = document.getElementById('customerGST');
                const customerAddress = document.getElementById('customerAddress');
                
                if (customerMobile && !customerMobile.value && previousInvoice.customer_mobile) {
                    customerMobile.value = previousInvoice.customer_mobile;
                }
                if (customerGST && !customerGST.value && previousInvoice.customer_gst) {
                    customerGST.value = previousInvoice.customer_gst;
                }
                if (customerAddress && !customerAddress.value && previousInvoice.customer_address) {
                    customerAddress.value = previousInvoice.customer_address;
                }
            }
        }
    }

    async generateInvoice() {
        const form = document.getElementById('invoiceForm');
        if (!form || !app.validateForm(form.id)) {
            return;
        }

        // Validate invoice items
        const validItems = this.invoiceItems.filter(item => item.productId && item.quantity > 0 && item.rate > 0);
        if (validItems.length === 0) {
            showNotification('Please add at least one valid item to the invoice', 'warning');
            return;
        }

        // Validate GST number if provided
        if (!this.validateGSTNumber()) {
            return;
        }

        // Collect invoice data
        const invoiceData = {
            customer_name: document.getElementById('customerName').value.trim(),
            customer_mobile: document.getElementById('customerMobile').value.trim(),
            customer_gst: document.getElementById('customerGST').value.trim(),
            customer_address: document.getElementById('customerAddress').value.trim(),
            items: validItems.map(item => ({
                product_id: item.productId,
                quantity: item.quantity,
                rate: item.rate,
                gst_rate: item.gstRate,
                base_amount: item.baseAmount,
                gst_amount: item.gstAmount,
                total_amount: item.total
            })),
            subtotal: validItems.reduce((sum, item) => sum + (item.baseAmount || 0), 0),
            total_gst: validItems.reduce((sum, item) => sum + (item.gstAmount || 0), 0),
            grand_total: validItems.reduce((sum, item) => sum + (item.total || 0), 0),
            status: 'generated'
        };

        try {
            const invoice = DataStorage.createInvoice(invoiceData);
            this.invoices.unshift(invoice);
            
            showNotification('Invoice generated successfully', 'success');
            
            // Generate PDF
            await this.generateInvoicePDF(invoice);
            
            // Reset form
            this.clearInvoiceForm();
            this.setupInvoiceForm();
            
            // Refresh invoices table
            this.renderInvoicesTable();
            
        } catch (error) {
            console.error('Error generating invoice:', error);
            showNotification('Failed to generate invoice', 'error');
        }
    }

    async generateInvoicePDF(invoice) {
        if (!window.jsPDF) {
            showNotification('PDF library not loaded', 'error');
            return;
        }

        try {
            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF();
            
            // Set up fonts and colors
            doc.setFont('helvetica');
            
            // Header
            doc.setFontSize(20);
            doc.setTextColor(59, 130, 246); // Primary blue
            doc.text(this.settings.business?.name || 'Invoice', 20, 25);
            
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text(`Invoice #: ${invoice.invoice_number}`, 140, 25);
            doc.text(`Date: ${DataStorage.formatDate(invoice.created_at)}`, 140, 35);
            
            // Business details
            let yPos = 45;
            doc.setFontSize(10);
            doc.text('From:', 20, yPos);
            yPos += 10;
            
            if (this.settings.business?.name) {
                doc.text(this.settings.business.name, 20, yPos);
                yPos += 5;
            }
            if (this.settings.business?.address) {
                const addressLines = this.splitText(doc, this.settings.business.address, 70);
                addressLines.forEach(line => {
                    doc.text(line, 20, yPos);
                    yPos += 5;
                });
            }
            if (this.settings.gst?.number) {
                doc.text(`GST: ${this.settings.gst.number}`, 20, yPos);
                yPos += 5;
            }
            if (this.settings.business?.phone) {
                doc.text(`Phone: ${this.settings.business.phone}`, 20, yPos);
                yPos += 10;
            }
            
            // Customer details
            yPos = Math.max(yPos, 45);
            doc.text('To:', 110, yPos);
            yPos += 10;
            
            doc.text(invoice.customer_name, 110, yPos);
            yPos += 5;
            
            if (invoice.customer_mobile) {
                doc.text(`Phone: ${invoice.customer_mobile}`, 110, yPos);
                yPos += 5;
            }
            if (invoice.customer_gst) {
                doc.text(`GST: ${invoice.customer_gst}`, 110, yPos);
                yPos += 5;
            }
            if (invoice.customer_address) {
                const addressLines = this.splitText(doc, invoice.customer_address, 70);
                addressLines.forEach(line => {
                    doc.text(line, 110, yPos);
                    yPos += 5;
                });
            }
            
            yPos += 10;
            
            // Items table header
            doc.setFillColor(248, 250, 252);
            doc.rect(20, yPos, 170, 10, 'F');
            
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            doc.text('Item', 25, yPos + 7);
            doc.text('HSN', 80, yPos + 7);
            doc.text('Qty', 100, yPos + 7);
            doc.text('Rate', 120, yPos + 7);
            doc.text('GST%', 140, yPos + 7);
            doc.text('Amount', 165, yPos + 7);
            
            yPos += 15;
            
            // Items
            for (const item of invoice.items) {
                const product = this.products.find(p => p.id === item.product_id);
                if (product) {
                    const itemName = this.splitText(doc, product.name, 50)[0]; // First line only
                    
                    doc.text(itemName, 25, yPos);
                    doc.text(product.hsn_code, 80, yPos);
                    doc.text(item.quantity.toString(), 100, yPos);
                    doc.text('₹' + item.rate.toFixed(2), 120, yPos);
                    doc.text(item.gst_rate + '%', 140, yPos);
                    doc.text('₹' + item.total_amount.toFixed(2), 160, yPos);
                    
                    yPos += 8;
                }
                
                // Check for page break
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }
            }
            
            yPos += 10;
            
            // Totals
            doc.line(20, yPos, 190, yPos);
            yPos += 10;
            
            doc.setFontSize(10);
            doc.text(`Subtotal: ${DataStorage.formatCurrency(invoice.subtotal)}`, 130, yPos);
            yPos += 8;
            
            // GST breakdown
            const customerState = this.getStateFromGST(invoice.customer_gst || '');
            const businessState = this.settings.gst?.stateCode || '07';
            const isInterState = customerState && customerState !== businessState;
            
            if (isInterState) {
                doc.text(`IGST: ${DataStorage.formatCurrency(invoice.total_gst)}`, 130, yPos);
                yPos += 8;
            } else {
                const halfGST = invoice.total_gst / 2;
                doc.text(`CGST: ${DataStorage.formatCurrency(halfGST)}`, 130, yPos);
                yPos += 8;
                doc.text(`SGST: ${DataStorage.formatCurrency(halfGST)}`, 130, yPos);
                yPos += 8;
            }
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Total: ${DataStorage.formatCurrency(invoice.grand_total)}`, 130, yPos);
            
            // Footer
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('Thank you for your business!', 20, 280);
            
            // Save the PDF
            doc.save(`invoice_${invoice.invoice_number}.pdf`);
            
            showNotification('Invoice PDF generated successfully', 'success');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            showNotification('Failed to generate PDF', 'error');
        }
    }

    splitText(doc, text, maxWidth) {
        return doc.splitTextToSize(text, maxWidth);
    }

    renderInvoicesTable() {
        const tbody = document.getElementById('invoicesTableBody');
        if (!tbody) return;

        if (this.invoices.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-file-invoice"></i>
                            <h3>No Invoices Found</h3>
                            <p>No invoices have been generated yet.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const rows = this.invoices.map(invoice => {
            const statusBadge = this.getInvoiceStatusBadge(invoice.status);
            
            return `
                <tr>
                    <td>
                        <strong>${invoice.invoice_number}</strong>
                    </td>
                    <td>
                        <div class="customer-info">
                            <strong>${invoice.customer_name}</strong>
                            ${invoice.customer_mobile ? `<br><small>${invoice.customer_mobile}</small>` : ''}
                        </div>
                    </td>
                    <td>${DataStorage.formatDate(invoice.created_at)}</td>
                    <td class="text-right">${DataStorage.formatCurrency(invoice.subtotal)}</td>
                    <td class="text-right">${DataStorage.formatCurrency(invoice.total_gst)}</td>
                    <td>
                        <span class="status-badge ${statusBadge.class}">
                            ${statusBadge.text}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline" onclick="billingManager.viewInvoice(${invoice.id})" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="billingManager.downloadInvoicePDF(${invoice.id})" title="Download PDF">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="billingManager.printInvoice(${invoice.id})" title="Print">
                                <i class="fas fa-print"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="billingManager.deleteInvoice(${invoice.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
    }

    getInvoiceStatusBadge(status) {
        const statusMap = {
            generated: { text: 'Generated', class: 'success' },
            sent: { text: 'Sent', class: 'info' },
            paid: { text: 'Paid', class: 'success' },
            cancelled: { text: 'Cancelled', class: 'danger' }
        };
        
        return statusMap[status] || { text: 'Unknown', class: 'secondary' };
    }

    viewInvoice(invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) {
            showNotification('Invoice not found', 'error');
            return;
        }

        // Create modal content for viewing invoice
        const modalContent = this.generateInvoiceViewContent(invoice);
        
        const actions = [
            {
                text: 'Close',
                class: 'btn-secondary',
                onclick: 'app.closeModal()'
            },
            {
                text: 'Download PDF',
                class: 'btn-primary',
                icon: 'fas fa-download',
                onclick: `billingManager.downloadInvoicePDF(${invoiceId})`
            }
        ];

        app.createModal('Invoice Details', modalContent, actions);
    }

    generateInvoiceViewContent(invoice) {
        const customerState = this.getStateFromGST(invoice.customer_gst || '');
        const businessState = this.settings.gst?.stateCode || '07';
        const isInterState = customerState && customerState !== businessState;

        return `
            <div class="invoice-view">
                <div class="invoice-header">
                    <div class="invoice-title">
                        <h3>Invoice ${invoice.invoice_number}</h3>
                        <p class="text-secondary">Generated on ${DataStorage.formatDate(invoice.created_at)}</p>
                    </div>
                </div>
                
                <div class="invoice-parties">
                    <div class="invoice-from">
                        <h5>From:</h5>
                        <p><strong>${this.settings.business?.name || 'Business Name'}</strong></p>
                        ${this.settings.business?.address ? `<p>${this.settings.business.address}</p>` : ''}
                        ${this.settings.gst?.number ? `<p>GST: ${this.settings.gst.number}</p>` : ''}
                    </div>
                    <div class="invoice-to">
                        <h5>To:</h5>
                        <p><strong>${invoice.customer_name}</strong></p>
                        ${invoice.customer_mobile ? `<p>Phone: ${invoice.customer_mobile}</p>` : ''}
                        ${invoice.customer_gst ? `<p>GST: ${invoice.customer_gst}</p>` : ''}
                        ${invoice.customer_address ? `<p>${invoice.customer_address}</p>` : ''}
                    </div>
                </div>
                
                <div class="invoice-items">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>HSN</th>
                                <th>Qty</th>
                                <th>Rate</th>
                                <th>GST%</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.items.map(item => {
                                const product = this.products.find(p => p.id === item.product_id);
                                return `
                                    <tr>
                                        <td>${product ? product.name : 'Unknown Product'}</td>
                                        <td>${product ? product.hsn_code : ''}</td>
                                        <td>${item.quantity}</td>
                                        <td>${DataStorage.formatCurrency(item.rate)}</td>
                                        <td>${item.gst_rate}%</td>
                                        <td>${DataStorage.formatCurrency(item.total_amount)}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="invoice-totals">
                    <div class="totals-row">
                        <span>Subtotal:</span>
                        <span>${DataStorage.formatCurrency(invoice.subtotal)}</span>
                    </div>
                    ${isInterState ? `
                        <div class="totals-row">
                            <span>IGST:</span>
                            <span>${DataStorage.formatCurrency(invoice.total_gst)}</span>
                        </div>
                    ` : `
                        <div class="totals-row">
                            <span>CGST:</span>
                            <span>${DataStorage.formatCurrency(invoice.total_gst / 2)}</span>
                        </div>
                        <div class="totals-row">
                            <span>SGST:</span>
                            <span>${DataStorage.formatCurrency(invoice.total_gst / 2)}</span>
                        </div>
                    `}
                    <div class="totals-row total">
                        <span><strong>Total:</strong></span>
                        <span><strong>${DataStorage.formatCurrency(invoice.grand_total)}</strong></span>
                    </div>
                </div>
            </div>
        `;
    }

    async downloadInvoicePDF(invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) {
            showNotification('Invoice not found', 'error');
            return;
        }

        await this.generateInvoicePDF(invoice);
    }

    printInvoice(invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) {
            showNotification('Invoice not found', 'error');
            return;
        }

        // Create a print window with invoice content
        const printContent = this.generateInvoiceViewContent(invoice);
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${invoice.invoice_number}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .invoice-header { text-align: center; margin-bottom: 30px; }
                    .invoice-parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
                    .invoice-from, .invoice-to { width: 45%; }
                    .invoice-items table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .invoice-items th, .invoice-items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .invoice-items th { background-color: #f2f2f2; }
                    .invoice-totals { margin-top: 20px; }
                    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; }
                    .totals-row.total { border-top: 2px solid #000; font-weight: bold; }
                    @media print { 
                        body { margin: 0; }
                        .btn { display: none; }
                    }
                </style>
            </head>
            <body>
                ${printContent}
                <script>window.onload = function() { window.print(); window.close(); }</script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    deleteInvoice(invoiceId) {
        const invoice = this.invoices.find(inv => inv.id === invoiceId);
        if (!invoice) {
            showNotification('Invoice not found', 'error');
            return;
        }

        const confirmMessage = `Are you sure you want to delete invoice ${invoice.invoice_number}?\n\nThis action cannot be undone.`;
        if (!confirm(confirmMessage)) {
            return;
        }

        try {
            this.invoices = this.invoices.filter(inv => inv.id !== invoiceId);
            DataStorage.saveInvoices(this.invoices);
            
            showNotification('Invoice deleted successfully', 'success');
            this.renderInvoicesTable();
            
        } catch (error) {
            console.error('Error deleting invoice:', error);
            showNotification('Failed to delete invoice', 'error');
        }
    }

    filterInvoices(query) {
        const tbody = document.getElementById('invoicesTableBody');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        const searchTerm = query.toLowerCase();

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const shouldShow = text.includes(searchTerm) || searchTerm === '';
            row.style.display = shouldShow ? '' : 'none';
        });
    }

    clearInvoiceForm() {
        const form = document.getElementById('invoiceForm');
        if (form) {
            form.reset();
        }

        // Clear invoice items
        const container = document.getElementById('invoiceItemsBody');
        if (container) {
            container.innerHTML = '';
        }

        this.invoiceItems = [];
        
        // Reset summary
        document.getElementById('subtotal').textContent = '₹0.00';
        document.getElementById('cgstAmount').textContent = '₹0.00';
        document.getElementById('sgstAmount').textContent = '₹0.00';
        document.getElementById('igstAmount').textContent = '₹0.00';
        document.getElementById('totalAmount').textContent = '₹0.00';
    }

    previewInvoice() {
        // Validate form first
        const form = document.getElementById('invoiceForm');
        if (!form || !app.validateForm(form.id)) {
            showNotification('Please fill all required fields', 'warning');
            return;
        }

        const validItems = this.invoiceItems.filter(item => item.productId && item.quantity > 0 && item.rate > 0);
        if (validItems.length === 0) {
            showNotification('Please add at least one valid item', 'warning');
            return;
        }

        // Create preview data
        const previewData = {
            invoice_number: `PREVIEW-${Date.now()}`,
            customer_name: document.getElementById('customerName').value.trim(),
            customer_mobile: document.getElementById('customerMobile').value.trim(),
            customer_gst: document.getElementById('customerGST').value.trim(),
            customer_address: document.getElementById('customerAddress').value.trim(),
            items: validItems,
            subtotal: validItems.reduce((sum, item) => sum + (item.baseAmount || 0), 0),
            total_gst: validItems.reduce((sum, item) => sum + (item.gstAmount || 0), 0),
            grand_total: validItems.reduce((sum, item) => sum + (item.total || 0), 0),
            created_at: new Date().toISOString()
        };

        const modalContent = this.generateInvoiceViewContent(previewData);
        
        const actions = [
            {
                text: 'Close',
                class: 'btn-secondary',
                onclick: 'app.closeModal()'
            },
            {
                text: 'Generate Invoice',
                class: 'btn-primary',
                icon: 'fas fa-save',
                onclick: 'app.closeModal(); billingManager.generateInvoice();'
            }
        ];

        app.createModal('Invoice Preview', modalContent, actions);
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
        const searchInput = document.getElementById('invoiceSearch');
        if (searchInput) {
            searchInput.value = query;
            this.filterInvoices(query);
        }
    }
}

// Global functions
function openCreateInvoiceModal() {
    if (window.billingManager) {
        window.billingManager.clearInvoiceForm();
        window.billingManager.setupInvoiceForm();
        showNotification('Invoice form ready', 'info', 2000);
    }
}

function addInvoiceItem() {
    if (window.billingManager) {
        window.billingManager.addInvoiceItem();
    }
}

function clearInvoiceForm() {
    if (window.billingManager) {
        window.billingManager.clearInvoiceForm();
        window.billingManager.setupInvoiceForm();
    }
}

function previewInvoice() {
    if (window.billingManager) {
        window.billingManager.previewInvoice();
    }
}

// Initialize billing manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/billing') {
        window.billingManager = new BillingManager();
    }
});
