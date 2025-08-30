
// Global function for Add Product button
function openAddProductModal() {
    if (window.inventoryManager) {
        window.inventoryManager.openAddProductModal();
    } else {
        console.error('Inventory manager not initialized');
    }
}

// Global function for inventory export  
function exportInventory() {
    if (window.inventoryManager) {
        window.inventoryManager.exportInventory();
    } else {
        console.error('Inventory manager not initialized');
    }
}

// Global function for clearing filters
function clearFilters() {
    if (window.inventoryManager) {
        window.inventoryManager.clearFilters();
    } else {
        console.error('Inventory manager not initialized');
    }
}

// Global function for table sorting
function sortTable(columnIndex) {
    if (window.inventoryManager) {
        window.inventoryManager.sortTable(columnIndex);
    } else {
        console.error('Inventory manager not initialized');
    }
}

// Global function for pagination
function changePage(direction) {
    if (window.inventoryManager) {
        window.inventoryManager.changePage(direction);
    } else {
        console.error('Inventory manager not initialized');
    }
}

