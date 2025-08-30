// Advanced Search and Filter System
class AdvancedSearchManager {
    constructor() {
        this.filters = new Map();
        this.searchHistory = [];
        this.savedSearches = [];
        this.currentResults = [];
        this.searchIndex = null;
        this.init();
    }

    init() {
        this.loadSavedSearches();
        this.enhanceSearchBox();
        this.createAdvancedSearchModal();
        this.addSearchStyles();
        this.setupGlobalSearch();
    }

    addSearchStyles() {
        const styles = document.createElement('style');
        styles.id = 'advanced-search-styles';
        styles.textContent = `
            .search-box-enhanced {
                position: relative;
                max-width: 500px;
                width: 100%;
            }

            .search-suggestions {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid var(--border-color);
                border-top: none;
                border-radius: 0 0 8px 8px;
                max-height: 300px;
                overflow-y: auto;
                z-index: 1000;
                box-shadow: var(--shadow-lg);
                opacity: 0;
                transform: translateY(-10px);
                transition: all 0.2s ease;
            }

            .search-suggestions.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .search-suggestion {
                padding: 0.75rem 1rem;
                border-bottom: 1px solid var(--border-light);
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                transition: background-color 0.2s ease;
            }

            .search-suggestion:hover,
            .search-suggestion.highlighted {
                background: var(--bg-tertiary);
            }

            .search-suggestion:last-child {
                border-bottom: none;
            }

            .suggestion-icon {
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--primary-color);
                color: white;
                border-radius: 4px;
                font-size: 0.75rem;
            }

            .suggestion-content {
                flex: 1;
            }

            .suggestion-title {
                font-weight: 500;
                color: var(--text-primary);
            }

            .suggestion-subtitle {
                font-size: 0.875rem;
                color: var(--text-secondary);
            }

            .suggestion-shortcut {
                font-size: 0.75rem;
                color: var(--text-light);
                background: var(--bg-tertiary);
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
            }

            .advanced-search-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding-top: 5vh;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .advanced-search-modal.visible {
                opacity: 1;
                visibility: visible;
            }

            .advanced-search-content {
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 800px;
                max-height: 80vh;
                overflow: hidden;
                transform: scale(0.95);
                transition: transform 0.3s ease;
            }

            .advanced-search-modal.visible .advanced-search-content {
                transform: scale(1);
            }

            .search-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1.5rem;
                border-bottom: 1px solid var(--border-color);
                background: var(--bg-tertiary);
            }

            .search-body {
                padding: 1.5rem;
                max-height: 60vh;
                overflow-y: auto;
            }

            .search-tabs {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 1.5rem;
                border-bottom: 1px solid var(--border-color);
            }

            .search-tab {
                padding: 0.75rem 1rem;
                border: none;
                background: none;
                color: var(--text-secondary);
                cursor: pointer;
                transition: all 0.2s ease;
                border-bottom: 2px solid transparent;
            }

            .search-tab.active {
                color: var(--primary-color);
                border-bottom-color: var(--primary-color);
            }

            .filter-group {
                margin-bottom: 1.5rem;
            }

            .filter-group h4 {
                margin-bottom: 0.75rem;
                color: var(--text-primary);
            }

            .filter-controls {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }

            .filter-control {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }

            .filter-control label {
                font-size: 0.875rem;
                font-weight: 500;
                color: var(--text-secondary);
            }

            .filter-control input,
            .filter-control select {
                padding: 0.5rem;
                border: 1px solid var(--border-color);
                border-radius: 4px;
                font-size: 0.875rem;
            }

            .search-results {
                border-top: 1px solid var(--border-color);
                max-height: 300px;
                overflow-y: auto;
            }

            .result-item {
                padding: 1rem;
                border-bottom: 1px solid var(--border-light);
                cursor: pointer;
                transition: background-color 0.2s ease;
            }

            .result-item:hover {
                background: var(--bg-light);
            }

            .result-item:last-child {
                border-bottom: none;
            }

            .result-title {
                font-weight: 500;
                margin-bottom: 0.25rem;
            }

            .result-meta {
                font-size: 0.875rem;
                color: var(--text-secondary);
                display: flex;
                gap: 1rem;
            }

            .saved-searches {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .saved-search {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0.75rem;
                background: var(--bg-light);
                border-radius: 6px;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }

            .saved-search:hover {
                background: var(--bg-tertiary);
            }

            .saved-search-actions {
                display: flex;
                gap: 0.5rem;
            }

            .saved-search-btn {
                background: none;
                border: none;
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 4px;
                transition: background-color 0.2s ease;
            }

            .saved-search-btn:hover {
                background: var(--bg-secondary);
            }

            /* Dark mode styles */
            .dark-mode .search-suggestions {
                background: var(--bg-primary);
                border-color: var(--border-color);
            }

            .dark-mode .advanced-search-content {
                background: var(--bg-primary);
            }

            .dark-mode .search-header {
                background: var(--bg-tertiary);
            }
        `;
        document.head.appendChild(styles);
    }

    enhanceSearchBox() {
        const searchBox = document.querySelector('.search-box');
        if (!searchBox) return;

        searchBox.classList.add('search-box-enhanced');
        const input = searchBox.querySelector('input');
        if (!input) return;

        // Add search suggestions container
        const suggestions = document.createElement('div');
        suggestions.className = 'search-suggestions';
        suggestions.id = 'searchSuggestions';
        searchBox.appendChild(suggestions);

        // Enhance input with advanced features
        input.addEventListener('input', (e) => this.handleSearchInput(e));
        input.addEventListener('keydown', (e) => this.handleSearchKeydown(e));
        input.addEventListener('focus', () => this.showRecentSearches());
        input.addEventListener('blur', () => {
            // Delay hiding to allow clicking on suggestions
            setTimeout(() => this.hideSuggestions(), 200);
        });

        // Add advanced search button
        const advancedBtn = document.createElement('button');
        advancedBtn.className = 'search-advanced-btn';
        advancedBtn.innerHTML = '<i class="fas fa-sliders-h"></i>';
        advancedBtn.title = 'Advanced Search (Ctrl+Shift+F)';
        advancedBtn.addEventListener('click', () => this.showAdvancedSearch());
        searchBox.appendChild(advancedBtn);

        // Add button styles
        const buttonStyles = document.createElement('style');
        buttonStyles.textContent = `
            .search-advanced-btn {
                position: absolute;
                right: 2.5rem;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: var(--text-light);
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 4px;
                transition: all 0.2s ease;
            }

            .search-advanced-btn:hover {
                background: var(--bg-tertiary);
                color: var(--text-primary);
            }
        `;
        document.head.appendChild(buttonStyles);
    }

    setupGlobalSearch() {
        // Global search shortcut (Ctrl+K or /)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && e.target.tagName !== 'INPUT')) {
                e.preventDefault();
                this.focusSearch();
            }
            
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                this.showAdvancedSearch();
            }
        });
    }

    handleSearchInput(e) {
        const query = e.target.value.trim();
        
        if (query.length === 0) {
            this.showRecentSearches();
            return;
        }

        if (query.length < 2) {
            this.hideSuggestions();
            return;
        }

        // Show live suggestions
        this.showLiveSuggestions(query);
    }

    handleSearchKeydown(e) {
        const suggestions = document.getElementById('searchSuggestions');
        const highlighted = suggestions.querySelector('.highlighted');

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.highlightNextSuggestion();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.highlightPrevSuggestion();
                break;
            case 'Enter':
                e.preventDefault();
                if (highlighted) {
                    this.selectSuggestion(highlighted);
                } else {
                    this.performSearch(e.target.value);
                }
                break;
            case 'Escape':
                this.hideSuggestions();
                e.target.blur();
                break;
        }
    }

    showRecentSearches() {
        const suggestions = document.getElementById('searchSuggestions');
        if (!suggestions) return;

        const recentSearches = this.searchHistory.slice(-5);
        const savedSearches = this.savedSearches.slice(0, 3);

        let html = '';

        if (savedSearches.length > 0) {
            html += '<div class="search-suggestion"><div class="suggestion-icon"><i class="fas fa-star"></i></div><div class="suggestion-content"><div class="suggestion-title">Saved Searches</div></div></div>';
            savedSearches.forEach(search => {
                html += `
                    <div class="search-suggestion" data-action="saved-search" data-query="${search.query}">
                        <div class="suggestion-icon"><i class="fas fa-bookmark"></i></div>
                        <div class="suggestion-content">
                            <div class="suggestion-title">${search.name}</div>
                            <div class="suggestion-subtitle">${search.query}</div>
                        </div>
                    </div>
                `;
            });
        }

        if (recentSearches.length > 0) {
            html += '<div class="search-suggestion"><div class="suggestion-icon"><i class="fas fa-history"></i></div><div class="suggestion-content"><div class="suggestion-title">Recent Searches</div></div></div>';
            recentSearches.forEach(search => {
                html += `
                    <div class="search-suggestion" data-action="search" data-query="${search}">
                        <div class="suggestion-icon"><i class="fas fa-clock"></i></div>
                        <div class="suggestion-content">
                            <div class="suggestion-title">${search}</div>
                        </div>
                    </div>
                `;
            });
        }

        // Add shortcuts
        html += `
            <div class="search-suggestion" data-action="advanced">
                <div class="suggestion-icon"><i class="fas fa-sliders-h"></i></div>
                <div class="suggestion-content">
                    <div class="suggestion-title">Advanced Search</div>
                    <div class="suggestion-subtitle">More filtering options</div>
                </div>
                <div class="suggestion-shortcut">Ctrl+Shift+F</div>
            </div>
        `;

        suggestions.innerHTML = html;
        this.showSuggestions();
        this.bindSuggestionEvents();
    }

    showLiveSuggestions(query) {
        // Simulate search suggestions - in production, this would call an API
        const suggestions = this.generateSuggestions(query);
        const suggestionContainer = document.getElementById('searchSuggestions');
        
        let html = '';
        suggestions.forEach(suggestion => {
            html += `
                <div class="search-suggestion" data-action="search" data-query="${suggestion.query}">
                    <div class="suggestion-icon"><i class="${suggestion.icon}"></i></div>
                    <div class="suggestion-content">
                        <div class="suggestion-title">${suggestion.title}</div>
                        <div class="suggestion-subtitle">${suggestion.subtitle}</div>
                    </div>
                </div>
            `;
        });

        suggestionContainer.innerHTML = html;
        this.showSuggestions();
        this.bindSuggestionEvents();
    }

    generateSuggestions(query) {
        const suggestions = [];
        const lowerQuery = query.toLowerCase();

        // Product suggestions
        if (lowerQuery.includes('product') || lowerQuery.includes('item')) {
            suggestions.push({
                icon: 'fas fa-box',
                title: `Search products: "${query}"`,
                subtitle: 'Find products in inventory',
                query: `products:${query}`,
                type: 'product'
            });
        }

        // Order suggestions
        if (lowerQuery.includes('order') || lowerQuery.includes('#')) {
            suggestions.push({
                icon: 'fas fa-shopping-cart',
                title: `Search orders: "${query}"`,
                subtitle: 'Find orders by number or customer',
                query: `orders:${query}`,
                type: 'order'
            });
        }

        // Customer suggestions
        if (lowerQuery.includes('customer') || lowerQuery.includes('client')) {
            suggestions.push({
                icon: 'fas fa-user',
                title: `Search customers: "${query}"`,
                subtitle: 'Find customers by name or details',
                query: `customers:${query}`,
                type: 'customer'
            });
        }

        // SKU suggestions
        if (lowerQuery.match(/^[A-Z]{3}\\d{3}$/) || lowerQuery.includes('sku')) {
            suggestions.push({
                icon: 'fas fa-barcode',
                title: `Search by SKU: "${query}"`,
                subtitle: 'Find product by SKU code',
                query: `sku:${query}`,
                type: 'sku'
            });
        }

        // Category suggestions
        const categories = ['Electronics', 'Furniture', 'Beverages', 'Food', 'Clothing'];
        const matchingCategories = categories.filter(cat => 
            cat.toLowerCase().includes(lowerQuery)
        );
        
        matchingCategories.forEach(category => {
            suggestions.push({
                icon: 'fas fa-folder',
                title: `${category} products`,
                subtitle: `View all products in ${category}`,
                query: `category:${category}`,
                type: 'category'
            });
        });

        // Generic search
        suggestions.push({
            icon: 'fas fa-search',
            title: `Search everything for "${query}"`,
            subtitle: 'Search across all data',
            query: query,
            type: 'global'
        });

        return suggestions.slice(0, 6);
    }

    bindSuggestionEvents() {
        const suggestions = document.querySelectorAll('.search-suggestion');
        suggestions.forEach(suggestion => {
            suggestion.addEventListener('click', () => {
                this.selectSuggestion(suggestion);
            });
        });
    }

    selectSuggestion(suggestion) {
        const action = suggestion.dataset.action;
        const query = suggestion.dataset.query;

        switch (action) {
            case 'search':
                this.performSearch(query);
                break;
            case 'saved-search':
                this.loadSavedSearch(query);
                break;
            case 'advanced':
                this.showAdvancedSearch();
                break;
        }

        this.hideSuggestions();
    }

    performSearch(query) {
        if (!query) return;

        // Add to search history
        this.addToHistory(query);

        // Update search input
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.value = query;
        }

        // Parse search query and perform search
        const parsedQuery = this.parseSearchQuery(query);
        this.executeSearch(parsedQuery);

        showNotification(`Searching for: ${query}`, 'info');
    }

    parseSearchQuery(query) {
        const parsed = {
            text: query,
            filters: {},
            type: 'global'
        };

        // Parse special syntax
        if (query.includes(':')) {
            const parts = query.split(':');
            if (parts.length === 2) {
                parsed.type = parts[0];
                parsed.text = parts[1];
            }
        }

        return parsed;
    }

    executeSearch(parsedQuery) {
        // This would integrate with your actual search API
        console.log('Executing search:', parsedQuery);
        
        // Simulate search results
        this.currentResults = this.simulateSearchResults(parsedQuery);
        
        // Update UI based on search results
        this.displaySearchResults();
    }

    simulateSearchResults(query) {
        // Simulate realistic search results
        return [
            {
                type: 'product',
                title: 'Premium Laptop',
                subtitle: 'Electronics • SKU: LAP001',
                meta: { price: '₹75,000', stock: '25 units' }
            },
            {
                type: 'order',
                title: 'Order #ORD12345',
                subtitle: 'Customer: John Doe',
                meta: { date: '2025-08-30', amount: '₹15,000' }
            }
        ];
    }

    displaySearchResults() {
        // This would update the main content area with search results
        const resultsCount = this.currentResults.length;
        showNotification(`Found ${resultsCount} result${resultsCount !== 1 ? 's' : ''}`, 'success');
    }

    createAdvancedSearchModal() {
        const modal = document.createElement('div');
        modal.className = 'advanced-search-modal';
        modal.id = 'advancedSearchModal';
        modal.innerHTML = `
            <div class="advanced-search-content">
                <div class="search-header">
                    <h2>Advanced Search</h2>
                    <button onclick="advancedSearch.hideAdvancedSearch()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                <div class="search-body">
                    <div class="search-tabs">
                        <button class="search-tab active" data-tab="filters">Filters</button>
                        <button class="search-tab" data-tab="saved">Saved Searches</button>
                        <button class="search-tab" data-tab="history">History</button>
                    </div>
                    <div id="searchTabContent">
                        <!-- Tab content will be dynamically loaded -->
                    </div>
                </div>
                <div class="search-results" id="advancedSearchResults" style="display: none;">
                    <!-- Search results will appear here -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Bind tab events
        const tabs = modal.querySelectorAll('.search-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.loadTabContent(tab.dataset.tab);
            });
        });

        // Load initial content
        this.loadTabContent('filters');
    }

    loadTabContent(tab) {
        const content = document.getElementById('searchTabContent');
        
        switch (tab) {
            case 'filters':
                content.innerHTML = this.getFiltersContent();
                break;
            case 'saved':
                content.innerHTML = this.getSavedSearchesContent();
                break;
            case 'history':
                content.innerHTML = this.getHistoryContent();
                break;
        }
    }

    getFiltersContent() {
        return `
            <div class="filter-group">
                <h4>Product Filters</h4>
                <div class="filter-controls">
                    <div class="filter-control">
                        <label>Category</label>
                        <select id="filterCategory">
                            <option value="">All Categories</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Furniture">Furniture</option>
                            <option value="Beverages">Beverages</option>
                        </select>
                    </div>
                    <div class="filter-control">
                        <label>Price Range (₹)</label>
                        <input type="text" id="filterPriceRange" placeholder="e.g., 1000-5000">
                    </div>
                    <div class="filter-control">
                        <label>Stock Level</label>
                        <select id="filterStock">
                            <option value="">Any Stock Level</option>
                            <option value="low">Low Stock</option>
                            <option value="normal">Normal Stock</option>
                            <option value="high">High Stock</option>
                        </select>
                    </div>
                    <div class="filter-control">
                        <label>GST Rate</label>
                        <select id="filterGST">
                            <option value="">Any GST Rate</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="filter-group">
                <h4>Order Filters</h4>
                <div class="filter-controls">
                    <div class="filter-control">
                        <label>Date Range</label>
                        <input type="date" id="filterDateFrom" placeholder="From">
                    </div>
                    <div class="filter-control">
                        <label>&nbsp;</label>
                        <input type="date" id="filterDateTo" placeholder="To">
                    </div>
                    <div class="filter-control">
                        <label>Order Status</label>
                        <select id="filterOrderStatus">
                            <option value="">Any Status</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <div class="filter-control">
                        <label>Customer Name</label>
                        <input type="text" id="filterCustomer" placeholder="Enter customer name">
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                <button onclick="advancedSearch.clearFilters()" class="btn btn-secondary">Clear Filters</button>
                <button onclick="advancedSearch.applyFilters()" class="btn btn-primary">Apply Filters</button>
            </div>
        `;
    }

    getSavedSearchesContent() {
        let html = '<div class="saved-searches">';
        
        if (this.savedSearches.length === 0) {
            html += '<p>No saved searches yet. Create some filters and save them for quick access!</p>';
        } else {
            this.savedSearches.forEach((search, index) => {
                html += `
                    <div class="saved-search">
                        <div>
                            <div class="saved-search-name">${search.name}</div>
                            <div class="saved-search-query">${search.query}</div>
                        </div>
                        <div class="saved-search-actions">
                            <button class="saved-search-btn" onclick="advancedSearch.loadSavedSearch(${index})" title="Load">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="saved-search-btn" onclick="advancedSearch.deleteSavedSearch(${index})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        return html;
    }

    getHistoryContent() {
        let html = '<div class="search-history">';
        
        if (this.searchHistory.length === 0) {
            html += '<p>No search history yet.</p>';
        } else {
            this.searchHistory.slice().reverse().forEach((search, index) => {
                html += `
                    <div class="search-suggestion" onclick="advancedSearch.performSearch('${search}')">
                        <div class="suggestion-icon"><i class="fas fa-history"></i></div>
                        <div class="suggestion-content">
                            <div class="suggestion-title">${search}</div>
                        </div>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        return html;
    }

    showAdvancedSearch() {
        const modal = document.getElementById('advancedSearchModal');
        if (modal) {
            modal.classList.add('visible');
        }
    }

    hideAdvancedSearch() {
        const modal = document.getElementById('advancedSearchModal');
        if (modal) {
            modal.classList.remove('visible');
        }
    }

    applyFilters() {
        // Collect filter values
        const filters = {
            category: document.getElementById('filterCategory')?.value,
            priceRange: document.getElementById('filterPriceRange')?.value,
            stock: document.getElementById('filterStock')?.value,
            gst: document.getElementById('filterGST')?.value,
            dateFrom: document.getElementById('filterDateFrom')?.value,
            dateTo: document.getElementById('filterDateTo')?.value,
            orderStatus: document.getElementById('filterOrderStatus')?.value,
            customer: document.getElementById('filterCustomer')?.value
        };

        // Remove empty filters
        Object.keys(filters).forEach(key => {
            if (!filters[key]) {
                delete filters[key];
            }
        });

        // Build search query
        let query = 'filtered search';
        const filterParts = [];
        
        Object.entries(filters).forEach(([key, value]) => {
            filterParts.push(`${key}:${value}`);
        });

        if (filterParts.length > 0) {
            query = filterParts.join(' ');
        }

        this.performSearch(query);
        this.hideAdvancedSearch();
    }

    clearFilters() {
        const inputs = document.querySelectorAll('#searchTabContent input, #searchTabContent select');
        inputs.forEach(input => {
            input.value = '';
        });
    }

    // Utility methods
    showSuggestions() {
        const suggestions = document.getElementById('searchSuggestions');
        if (suggestions) {
            suggestions.classList.add('visible');
        }
    }

    hideSuggestions() {
        const suggestions = document.getElementById('searchSuggestions');
        if (suggestions) {
            suggestions.classList.remove('visible');
        }
    }

    highlightNextSuggestion() {
        const suggestions = document.querySelectorAll('.search-suggestion');
        const current = document.querySelector('.search-suggestion.highlighted');
        
        if (current) {
            current.classList.remove('highlighted');
            const next = current.nextElementSibling;
            if (next && next.classList.contains('search-suggestion')) {
                next.classList.add('highlighted');
            } else if (suggestions.length > 0) {
                suggestions[0].classList.add('highlighted');
            }
        } else if (suggestions.length > 0) {
            suggestions[0].classList.add('highlighted');
        }
    }

    highlightPrevSuggestion() {
        const suggestions = document.querySelectorAll('.search-suggestion');
        const current = document.querySelector('.search-suggestion.highlighted');
        
        if (current) {
            current.classList.remove('highlighted');
            const prev = current.previousElementSibling;
            if (prev && prev.classList.contains('search-suggestion')) {
                prev.classList.add('highlighted');
            } else if (suggestions.length > 0) {
                suggestions[suggestions.length - 1].classList.add('highlighted');
            }
        } else if (suggestions.length > 0) {
            suggestions[suggestions.length - 1].classList.add('highlighted');
        }
    }

    focusSearch() {
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }

    addToHistory(query) {
        if (!this.searchHistory.includes(query)) {
            this.searchHistory.push(query);
            if (this.searchHistory.length > 20) {
                this.searchHistory.shift();
            }
            this.saveSearchHistory();
        }
    }

    saveSearchHistory() {
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
    }

    loadSavedSearches() {
        const saved = localStorage.getItem('savedSearches');
        if (saved) {
            this.savedSearches = JSON.parse(saved);
        }

        const history = localStorage.getItem('searchHistory');
        if (history) {
            this.searchHistory = JSON.parse(history);
        }
    }

    saveSearch(name, query) {
        this.savedSearches.push({ name, query, date: new Date() });
        localStorage.setItem('savedSearches', JSON.stringify(this.savedSearches));
    }

    loadSavedSearch(index) {
        const search = this.savedSearches[index];
        if (search) {
            this.performSearch(search.query);
        }
    }

    deleteSavedSearch(index) {
        this.savedSearches.splice(index, 1);
        localStorage.setItem('savedSearches', JSON.stringify(this.savedSearches));
        this.loadTabContent('saved'); // Refresh the saved searches tab
    }
}

// Initialize Advanced Search Manager
const advancedSearch = new AdvancedSearchManager();

// Export for use in other modules
window.AdvancedSearchManager = AdvancedSearchManager;
window.advancedSearch = advancedSearch;