// Dark Mode Implementation
class DarkModeManager {
    constructor() {
        this.isDarkMode = false;
        this.init();
    }

    init() {
        // Load saved preference
        const saved = localStorage.getItem('darkMode');
        this.isDarkMode = saved === 'true';
        
        if (this.isDarkMode) {
            this.enableDarkMode();
        }

        this.createToggleButton();
        this.addDarkModeStyles();
    }

    createToggleButton() {
        // Add dark mode toggle to existing UI
        const topbar = document.querySelector('.topbar-right');
        if (topbar) {
            const toggle = document.createElement('button');
            toggle.className = 'dark-mode-toggle';
            toggle.innerHTML = `<i class="fas fa-${this.isDarkMode ? 'sun' : 'moon'}"></i>`;
            toggle.title = 'Toggle Dark Mode';
            toggle.addEventListener('click', () => this.toggle());
            
            topbar.insertBefore(toggle, topbar.firstChild);
        }
    }

    addDarkModeStyles() {
        const styles = document.createElement('style');
        styles.id = 'dark-mode-styles';
        styles.textContent = `
            .dark-mode-toggle {
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: 1.25rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 6px;
                transition: all 0.2s ease;
            }

            .dark-mode-toggle:hover {
                background: var(--bg-tertiary);
                color: var(--text-primary);
            }

            /* Dark mode color scheme */
            .dark-mode {
                --primary-color: #60a5fa;
                --primary-dark: #3b82f6;
                --secondary-color: #6b7280;
                --success-color: #34d399;
                --warning-color: #fbbf24;
                --danger-color: #f87171;
                --info-color: #38bdf8;
                
                --text-primary: #f9fafb;
                --text-secondary: #d1d5db;
                --text-light: #9ca3af;
                
                --bg-primary: #1f2937;
                --bg-secondary: #111827;
                --bg-tertiary: #374151;
                
                --border-color: #374151;
                --border-light: #4b5563;
            }

            .dark-mode body {
                background-color: var(--bg-secondary);
                color: var(--text-primary);
            }

            .dark-mode .sidebar {
                background: var(--bg-primary);
                border-right-color: var(--border-color);
            }

            .dark-mode .topbar {
                background: var(--bg-primary);
                border-bottom-color: var(--border-color);
                backdrop-filter: none;
            }

            .dark-mode .card,
            .dark-mode .metric-card {
                background: var(--bg-primary);
                border-color: var(--border-color);
            }

            .dark-mode .btn-primary {
                background: linear-gradient(45deg, var(--primary-color), var(--primary-dark));
            }

            .dark-mode .search-box input {
                background: var(--bg-tertiary);
                border-color: var(--border-color);
                color: var(--text-primary);
            }

            .dark-mode .search-box input::placeholder {
                color: var(--text-light);
            }

            .dark-mode table {
                background: var(--bg-primary);
            }

            .dark-mode th {
                background: var(--bg-tertiary);
                color: var(--text-primary);
            }

            .dark-mode td {
                border-color: var(--border-color);
                color: var(--text-secondary);
            }

            .dark-mode tr:hover {
                background: var(--bg-tertiary);
            }

            /* Form elements */
            .dark-mode input,
            .dark-mode select,
            .dark-mode textarea {
                background: var(--bg-tertiary);
                border-color: var(--border-color);
                color: var(--text-primary);
            }

            .dark-mode input:focus,
            .dark-mode select:focus,
            .dark-mode textarea:focus {
                border-color: var(--primary-color);
                background: var(--bg-primary);
            }

            /* Charts in dark mode */
            .dark-mode .chart-card {
                background: var(--bg-primary);
            }

            /* Smooth transitions */
            * {
                transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
            }
        `;
        document.head.appendChild(styles);
    }

    toggle() {
        this.isDarkMode = !this.isDarkMode;
        
        if (this.isDarkMode) {
            this.enableDarkMode();
        } else {
            this.disableDarkMode();
        }

        // Save preference
        localStorage.setItem('darkMode', this.isDarkMode);

        // Update toggle button
        const toggle = document.querySelector('.dark-mode-toggle i');
        if (toggle) {
            toggle.className = `fas fa-${this.isDarkMode ? 'sun' : 'moon'}`;
        }

        // Show notification
        showNotification(
            `${this.isDarkMode ? 'Enabled' : 'Disabled'} dark mode`,
            'success'
        );
    }

    enableDarkMode() {
        document.body.classList.add('dark-mode');
        
        // Update charts if they exist
        this.updateChartsForDarkMode(true);
    }

    disableDarkMode() {
        document.body.classList.remove('dark-mode');
        
        // Update charts if they exist
        this.updateChartsForDarkMode(false);
    }

    updateChartsForDarkMode(isDark) {
        // Update Chart.js charts for dark mode
        if (window.Chart) {
            Chart.defaults.color = isDark ? '#d1d5db' : '#374151';
            Chart.defaults.borderColor = isDark ? '#374151' : '#e5e7eb';
            Chart.defaults.backgroundColor = isDark ? '#1f2937' : '#ffffff';
            
            // Redraw existing charts
            Object.values(Chart.instances).forEach(chart => {
                chart.update();
            });
        }
    }

    // Method to check if dark mode is active
    isDark() {
        return this.isDarkMode;
    }
}

// Initialize Dark Mode Manager
window.darkModeManager = new DarkModeManager();