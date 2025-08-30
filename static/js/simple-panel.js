// Simple, reliable side panel system
function createSimplePanel() {
    console.log('Creating simple side panel');
    
    // Remove any existing panels
    removeExistingPanels();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'simpleOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
        cursor: pointer;
    `;
    
    // Create panel
    const panel = document.createElement('div');
    panel.id = 'simplePanel';
    panel.style.cssText = `
        position: fixed;
        top: 0;
        right: -500px;
        width: 450px;
        max-width: 90vw;
        height: 100%;
        background: white;
        box-shadow: -5px 0 15px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        transition: right 0.3s ease;
        overflow-y: auto;
    `;
    
    // Panel content
    panel.innerHTML = `
        <div style="background: #3b82f6; color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; color: white;">Add New Product</h3>
            <button id="closeBtn" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 5px;">×</button>
        </div>
        <div style="padding: 25px; color: #333;">
            <form id="simpleForm">
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">Product Name *</label>
                    <input type="text" id="productName" required style="width: 100%; padding: 12px; border: 2px solid #e5e5e5; border-radius: 8px; font-size: 16px; color: #333;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">SKU *</label>
                    <input type="text" id="productSKU" readonly style="width: 100%; padding: 12px; border: 2px solid #e5e5e5; border-radius: 8px; font-size: 16px; color: #666; background: #f5f5f5;">
                    <small style="color: #666; font-size: 12px;">Auto-generated</small>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">Category *</label>
                    <select id="productCategory" required style="width: 100%; padding: 12px; border: 2px solid #e5e5e5; border-radius: 8px; font-size: 16px; color: #333;">
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
                
                <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                    <div style="flex: 1;">
                        <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">Price (₹) *</label>
                        <input type="number" id="productPrice" step="0.01" min="0" required style="width: 100%; padding: 12px; border: 2px solid #e5e5e5; border-radius: 8px; font-size: 16px; color: #333;">
                    </div>
                    <div style="flex: 1;">
                        <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">Stock *</label>
                        <input type="number" id="productStock" min="0" required style="width: 100%; padding: 12px; border: 2px solid #e5e5e5; border-radius: 8px; font-size: 16px; color: #333;">
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                    <div style="flex: 1;">
                        <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">Min Stock</label>
                        <input type="number" id="productMinStock" min="0" value="10" style="width: 100%; padding: 12px; border: 2px solid #e5e5e5; border-radius: 8px; font-size: 16px; color: #333;">
                    </div>
                    <div style="flex: 1;">
                        <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">GST Rate (%)</label>
                        <select id="productGST" style="width: 100%; padding: 12px; border: 2px solid #e5e5e5; border-radius: 8px; font-size: 16px; color: #333;">
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18" selected>18%</option>
                            <option value="28">28%</option>
                        </select>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">HSN Code</label>
                    <input type="text" id="productHSN" style="width: 100%; padding: 12px; border: 2px solid #e5e5e5; border-radius: 8px; font-size: 16px; color: #333;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">Description</label>
                    <textarea id="productDescription" rows="3" style="width: 100%; padding: 12px; border: 2px solid #e5e5e5; border-radius: 8px; font-size: 16px; color: #333; resize: vertical;"></textarea>
                </div>
                
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 30px;">
                    <input type="checkbox" id="productActive" checked style="width: 18px; height: 18px;">
                    <label for="productActive" style="color: #333; font-weight: 600;">Active Product</label>
                </div>
                
                <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: 20px; border-top: 2px solid #e5e5e5;">
                    <button type="button" id="cancelBtn" style="padding: 12px 24px; background: #f5f5f5; border: 2px solid #ccc; color: #666; border-radius: 8px; font-weight: 600; cursor: pointer;">Cancel</button>
                    <button type="submit" style="padding: 12px 24px; background: #3b82f6; border: 2px solid #3b82f6; color: white; border-radius: 8px; font-weight: 600; cursor: pointer;">Save Product</button>
                </div>
            </form>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    
    // Setup auto-generate SKU
    setupSKUGeneration();
    
    // Setup event handlers
    setupPanelHandlers(overlay, panel);
    
    // Show panel
    setTimeout(() => {
        overlay.style.opacity = '1';
        panel.style.right = '0';
    }, 10);
    
    // Focus first input
    setTimeout(() => {
        document.getElementById('productName').focus();
    }, 400);
}

function removeExistingPanels() {
    const existing = [
        document.getElementById('simpleOverlay'),
        document.getElementById('simplePanel'),
        document.getElementById('panelOverlay'),
        document.getElementById('newSidePanel'),
        document.querySelector('.side-panel'),
        document.querySelector('.side-panel-backdrop'),
        document.querySelector('.modern-panel-overlay')
    ];
    
    existing.forEach(el => {
        if (el) el.remove();
    });
}

function setupPanelHandlers(overlay, panel) {
    // Close button
    document.getElementById('closeBtn').onclick = closeSimplePanel;
    
    // Cancel button
    document.getElementById('cancelBtn').onclick = closeSimplePanel;
    
    // Overlay click
    overlay.onclick = function(e) {
        if (e.target === overlay) {
            console.log('Overlay clicked - closing panel');
            closeSimplePanel();
        }
    };
    
    // ESC key
    function escHandler(e) {
        if (e.key === 'Escape') {
            console.log('ESC pressed - closing panel');
            closeSimplePanel();
        }
    }
    document.addEventListener('keydown', escHandler);
    
    // Store handler for cleanup
    panel._escHandler = escHandler;
    
    // Form submit
    document.getElementById('simpleForm').onsubmit = function(e) {
        e.preventDefault();
        saveSimpleProduct();
    };
}

function setupSKUGeneration() {
    const nameField = document.getElementById('productName');
    const categoryField = document.getElementById('productCategory');
    const skuField = document.getElementById('productSKU');
    
    function generateSKU() {
        const name = nameField.value.trim();
        const category = categoryField.value;
        
        if (name && category) {
            const namePrefix = name.substring(0, 3).toUpperCase();
            const categoryPrefix = category.substring(0, 2).toUpperCase();
            const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            skuField.value = `${categoryPrefix}-${namePrefix}-${randomNum}`;
        }
    }
    
    nameField.onblur = generateSKU;
    categoryField.onchange = generateSKU;
}

function closeSimplePanel() {
    console.log('Closing simple panel');
    
    const overlay = document.getElementById('simpleOverlay');
    const panel = document.getElementById('simplePanel');
    
    if (overlay && panel) {
        // Remove ESC handler
        if (panel._escHandler) {
            document.removeEventListener('keydown', panel._escHandler);
        }
        
        // Animate out
        overlay.style.opacity = '0';
        panel.style.right = '-500px';
        
        // Remove after animation
        setTimeout(() => {
            if (overlay.parentNode) overlay.remove();
            if (panel.parentNode) panel.remove();
        }, 300);
    }
}

function saveSimpleProduct() {
    console.log('Saving simple product');
    
    const productData = {
        name: document.getElementById('productName').value,
        sku: document.getElementById('productSKU').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        min_stock: parseInt(document.getElementById('productMinStock').value) || 10,
        unit: 'pcs',
        hsn_code: document.getElementById('productHSN').value || '',
        gst_rate: parseFloat(document.getElementById('productGST').value) || 18,
        description: document.getElementById('productDescription').value || '',
        active: document.getElementById('productActive').checked
    };
    
    // Validate
    if (!productData.name || !productData.sku || !productData.category || !productData.price) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        // Save using existing inventory manager
        if (window.inventoryManager && window.inventoryManager.dataStorage) {
            window.inventoryManager.dataStorage.createProduct(productData);
            
            // Refresh inventory
            if (window.inventoryManager.loadProducts) {
                window.inventoryManager.loadProducts();
            }
            
            // Show success and close
            alert('Product added successfully!');
            closeSimplePanel();
        } else {
            console.error('Inventory manager not available');
            alert('Error: System not ready. Please refresh the page.');
        }
        
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Error saving product. Please try again.');
    }
}

// Global function for template
window.openSimplePanel = createSimplePanel;
window.closeSimplePanel = closeSimplePanel;