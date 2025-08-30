// Progressive Web App (PWA) Implementation
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.init();
    }

    init() {
        this.checkInstallation();
        this.setupServiceWorker();
        this.setupInstallPrompt();
        this.setupNotifications();
        this.createManifest();
    }

    createManifest() {
        // Check if manifest already exists
        if (document.querySelector('link[rel="manifest"]')) {
            return;
        }

        // Create manifest dynamically
        const manifest = {
            name: "StockManager Pro - Inventory Management",
            short_name: "StockManager Pro",
            description: "Professional inventory management system for Indian businesses",
            start_url: "/dashboard",
            display: "standalone",
            background_color: "#1e40af",
            theme_color: "#3b82f6",
            orientation: "portrait-primary",
            categories: ["business", "productivity", "finance"],
            icons: [
                {
                    src: "data:image/svg+xml;base64," + btoa(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" fill="#3b82f6">
                            <rect x="20" y="40" width="152" height="120" rx="8" fill="currentColor"/>
                            <rect x="40" y="60" width="30" height="20" fill="white"/>
                            <rect x="80" y="60" width="30" height="20" fill="white"/>
                            <rect x="120" y="60" width="30" height="20" fill="white"/>
                            <rect x="40" y="90" width="30" height="20" fill="white"/>
                            <rect x="80" y="90" width="30" height="20" fill="white"/>
                            <rect x="120" y="90" width="30" height="20" fill="white"/>
                            <rect x="40" y="120" width="30" height="20" fill="white"/>
                            <rect x="80" y="120" width="30" height="20" fill="white"/>
                            <rect x="120" y="120" width="30" height="20" fill="white"/>
                        </svg>
                    `),
                    sizes: "192x192",
                    type: "image/svg+xml"
                },
                {
                    src: "data:image/svg+xml;base64," + btoa(`
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#3b82f6">
                            <rect x="50" y="100" width="412" height="312" rx="20" fill="currentColor"/>
                            <rect x="100" y="150" width="80" height="50" fill="white"/>
                            <rect x="210" y="150" width="80" height="50" fill="white"/>
                            <rect x="320" y="150" width="80" height="50" fill="white"/>
                            <rect x="100" y="230" width="80" height="50" fill="white"/>
                            <rect x="210" y="230" width="80" height="50" fill="white"/>
                            <rect x="320" y="230" width="80" height="50" fill="white"/>
                            <rect x="100" y="310" width="80" height="50" fill="white"/>
                            <rect x="210" y="310" width="80" height="50" fill="white"/>
                            <rect x="320" y="310" width="80" height="50" fill="white"/>
                        </svg>
                    `),
                    sizes: "512x512",
                    type: "image/svg+xml"
                }
            ],
            shortcuts: [
                {
                    name: "Dashboard",
                    short_name: "Dashboard",
                    description: "View business dashboard",
                    url: "/dashboard",
                    icons: [{ src: "/static/favicon.ico", sizes: "96x96" }]
                },
                {
                    name: "Add Product",
                    short_name: "Add Product",
                    description: "Add new product",
                    url: "/inventory",
                    icons: [{ src: "/static/favicon.ico", sizes: "96x96" }]
                },
                {
                    name: "New Order",
                    short_name: "New Order",
                    description: "Create new order",
                    url: "/orders",
                    icons: [{ src: "/static/favicon.ico", sizes: "96x96" }]
                }
            ]
        };

        // Create and add manifest file
        const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
            type: 'application/json'
        });
        const manifestURL = URL.createObjectURL(manifestBlob);
        
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = manifestURL;
        document.head.appendChild(link);

        // Add theme color meta tag
        const themeColor = document.createElement('meta');
        themeColor.name = 'theme-color';
        themeColor.content = '#3b82f6';
        document.head.appendChild(themeColor);

        // Add viewport meta tag if not exists
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';
            document.head.appendChild(viewport);
        }
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                // Create service worker content dynamically
                const swContent = this.generateServiceWorkerContent();
                const swBlob = new Blob([swContent], { type: 'application/javascript' });
                const swURL = URL.createObjectURL(swBlob);
                
                const registration = await navigator.serviceWorker.register(swURL);
                console.log('Service Worker registered successfully');
                
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    generateServiceWorkerContent() {
        return `
            const CACHE_NAME = 'stockmanager-pro-v1';
            const urlsToCache = [
                '/',
                '/dashboard',
                '/inventory',
                '/orders',
                '/billing',
                '/reports',
                '/static/css/style.css',
                '/static/js/storage.js',
                '/static/js/animations.js',
                '/static/js/dark-mode.js',
                '/static/js/quick-actions.js',
                'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
                'https://cdn.jsdelivr.net/npm/chart.js'
            ];

            self.addEventListener('install', (event) => {
                event.waitUntil(
                    caches.open(CACHE_NAME)
                        .then((cache) => cache.addAll(urlsToCache))
                );
            });

            self.addEventListener('fetch', (event) => {
                event.respondWith(
                    caches.match(event.request)
                        .then((response) => {
                            // Return cached version or fetch from network
                            return response || fetch(event.request);
                        }
                    )
                );
            });

            self.addEventListener('push', (event) => {
                const options = {
                    body: event.data ? event.data.text() : 'New notification from StockManager Pro',
                    icon: '/static/favicon.ico',
                    badge: '/static/favicon.ico',
                    vibrate: [100, 50, 100],
                    data: {
                        dateOfArrival: Date.now(),
                        primaryKey: '2'
                    },
                    actions: [
                        {
                            action: 'explore',
                            title: 'View Details',
                            icon: '/static/favicon.ico'
                        },
                        {
                            action: 'close',
                            title: 'Close',
                            icon: '/static/favicon.ico'
                        }
                    ]
                };

                event.waitUntil(
                    self.registration.showNotification('StockManager Pro', options)
                );
            });

            self.addEventListener('notificationclick', (event) => {
                event.notification.close();

                if (event.action === 'explore') {
                    event.waitUntil(clients.openWindow('/dashboard'));
                }
            });
        `;
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallButton();
            showNotification('App installed successfully!', 'success');
        });
    }

    showInstallButton() {
        // Add install button to topbar
        const topbar = document.querySelector('.topbar-right');
        if (topbar && !document.getElementById('installButton')) {
            const installBtn = document.createElement('button');
            installBtn.id = 'installButton';
            installBtn.className = 'pwa-install-btn';
            installBtn.innerHTML = '<i class="fas fa-download"></i>';
            installBtn.title = 'Install App';
            installBtn.addEventListener('click', () => this.promptInstall());
            
            topbar.insertBefore(installBtn, topbar.firstChild);

            // Add styles
            const styles = document.createElement('style');
            styles.textContent = `
                .pwa-install-btn {
                    background: linear-gradient(135deg, #10b981, #059669);
                    border: none;
                    color: white;
                    font-size: 1rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    animation: pulse 2s infinite;
                }

                .pwa-install-btn:hover {
                    transform: scale(1.1);
                    background: linear-gradient(135deg, #059669, #047857);
                }
            `;
            document.head.appendChild(styles);
        }
    }

    hideInstallButton() {
        const installBtn = document.getElementById('installButton');
        if (installBtn) {
            installBtn.remove();
        }
    }

    async promptInstall() {
        if (!this.deferredPrompt) {
            showNotification('Install prompt not available', 'warning');
            return;
        }

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            showNotification('Installing app...', 'info');
        } else {
            showNotification('Installation cancelled', 'info');
        }

        this.deferredPrompt = null;
        this.hideInstallButton();
    }

    checkInstallation() {
        // Check if app is installed
        if (window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true) {
            this.isInstalled = true;
            document.body.classList.add('pwa-installed');
        }
    }

    async setupNotifications() {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            let permission = Notification.permission;
            
            if (permission === 'default') {
                // Show notification permission request after user interaction
                setTimeout(() => {
                    this.requestNotificationPermission();
                }, 5000);
            }
        }
    }

    async requestNotificationPermission() {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            showNotification('Notifications enabled!', 'success');
            this.scheduleTestNotification();
        } else {
            showNotification('Notifications disabled', 'warning');
        }
    }

    scheduleTestNotification() {
        // Send a test notification after 30 seconds
        setTimeout(() => {
            this.sendNotification('Welcome to StockManager Pro!', 'Your inventory management system is ready to use.');
        }, 30000);
    }

    sendNotification(title, body, data = {}) {
        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                    body: body,
                    icon: '/static/favicon.ico',
                    badge: '/static/favicon.ico',
                    vibrate: [200, 100, 200],
                    data: data,
                    actions: [
                        {
                            action: 'view',
                            title: 'View',
                            icon: '/static/favicon.ico'
                        }
                    ]
                });
            });
        } else {
            // Fallback to regular notification
            if (Notification.permission === 'granted') {
                new Notification(title, {
                    body: body,
                    icon: '/static/favicon.ico'
                });
            }
        }
    }

    showUpdateNotification() {
        const updateBar = document.createElement('div');
        updateBar.className = 'pwa-update-bar';
        updateBar.innerHTML = `
            <div class="update-content">
                <span>New version available!</span>
                <button onclick="location.reload()" class="update-btn">Update</button>
                <button onclick="this.parentElement.parentElement.remove()" class="close-btn">&times;</button>
            </div>
        `;

        const styles = document.createElement('style');
        styles.textContent = `
            .pwa-update-bar {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #3b82f6, #1e40af);
                color: white;
                padding: 1rem;
                z-index: 10001;
                animation: slideInFromTop 0.5s ease;
            }

            .update-content {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                max-width: 1200px;
                margin: 0 auto;
            }

            .update-btn {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .update-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.25rem 0.5rem;
            }
        `;
        document.head.appendChild(styles);
        document.body.appendChild(updateBar);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (updateBar.parentElement) {
                updateBar.remove();
            }
        }, 10000);
    }

    // Offline detection
    setupOfflineDetection() {
        window.addEventListener('online', () => {
            showNotification('Back online!', 'success');
            document.body.classList.remove('offline');
        });

        window.addEventListener('offline', () => {
            showNotification('You are offline. Some features may be limited.', 'warning');
            document.body.classList.add('offline');
        });

        // Initial check
        if (!navigator.onLine) {
            document.body.classList.add('offline');
        }
    }

    // Background sync for offline actions
    setupBackgroundSync() {
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then((registration) => {
                // Register for background sync
                return registration.sync.register('background-sync');
            }).catch((error) => {
                console.error('Background sync registration failed:', error);
            });
        }
    }

    // Public methods
    isAppInstalled() {
        return this.isInstalled;
    }

    async shareContent(title, text, url) {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: text,
                    url: url
                });
            } catch (error) {
                console.error('Sharing failed:', error);
            }
        } else {
            // Fallback - copy to clipboard
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(url);
                showNotification('Link copied to clipboard!', 'success');
            }
        }
    }
}

// Initialize PWA Manager
const pwaManager = new PWAManager();

// Export for use in other modules
window.PWAManager = PWAManager;
window.pwaManager = pwaManager;