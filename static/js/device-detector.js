// Comprehensive Device Detection and Responsive Management
class DeviceDetector {
    constructor() {
        this.deviceInfo = null;
        this.initialize();
    }

    initialize() {
        this.detectDevice();
        this.setupResponsiveHandlers();
        this.optimizeForDevice();
        console.log('Device Detector initialized:', this.deviceInfo);
    }

    detectDevice() {
        const userAgent = navigator.userAgent.toLowerCase();
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        const isMobile = /iphone|ipad|android|blackberry|windows phone|mobile/.test(userAgent);
        const isTablet = /ipad|android(?!.*mobile)|tablet/.test(userAgent);
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);
        
        this.deviceInfo = {
            isMobile,
            isTablet,
            isTouch,
            isIOS,
            isAndroid,
            isDesktop: !isMobile && !isTablet,
            screenWidth: width,
            screenHeight: height,
            pixelRatio: window.devicePixelRatio || 1,
            orientation: width > height ? 'landscape' : 'portrait',
            isSmallMobile: width <= 479,
            isLargeMobile: width > 479 && width <= 767,
            isTabletSize: width > 767 && width <= 1023,
            isDesktopSize: width > 1023
        };

        // Add device classes to body
        document.body.className = document.body.className.replace(/device-\w+/g, '');
        document.body.classList.add(
            isMobile ? 'device-mobile' : isTablet ? 'device-tablet' : 'device-desktop',
            isTouch ? 'device-touch' : 'device-no-touch',
            isIOS ? 'device-ios' : isAndroid ? 'device-android' : 'device-other',
            this.deviceInfo.orientation === 'landscape' ? 'orientation-landscape' : 'orientation-portrait'
        );

        // Store globally
        window.deviceInfo = this.deviceInfo;
        return this.deviceInfo;
    }

    setupResponsiveHandlers() {
        // Debounced resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 100);
        });

        // Orientation change handler
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Visual viewport API for mobile browsers
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                this.handleViewportResize();
            });
        }
    }

    handleResize() {
        const oldInfo = { ...this.deviceInfo };
        this.detectDevice();
        
        // Only update if device category changed
        if (oldInfo.isSmallMobile !== this.deviceInfo.isSmallMobile ||
            oldInfo.isLargeMobile !== this.deviceInfo.isLargeMobile ||
            oldInfo.isTabletSize !== this.deviceInfo.isTabletSize ||
            oldInfo.isDesktopSize !== this.deviceInfo.isDesktopSize) {
            this.optimizeForDevice();
        }
    }

    handleOrientationChange() {
        this.detectDevice();
        this.optimizeForDevice();
        
        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('deviceOrientationChange', {
            detail: this.deviceInfo
        }));
    }

    handleViewportResize() {
        // Handle mobile browser address bar showing/hiding
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    }

    optimizeForDevice() {
        if (this.deviceInfo.isSmallMobile) {
            this.optimizeForSmallMobile();
        } else if (this.deviceInfo.isLargeMobile) {
            this.optimizeForMobile();
        } else if (this.deviceInfo.isTabletSize) {
            this.optimizeForTablet();
        } else {
            this.optimizeForDesktop();
        }

        if (this.deviceInfo.isTouch) {
            this.optimizeForTouch();
        }
    }

    optimizeForSmallMobile() {
        // Extra small screen optimizations
        const charts = document.querySelectorAll('.chart-container');
        charts.forEach(chart => chart.style.height = '180px');

        // Stack everything vertically
        const buttonGroups = document.querySelectorAll('.btn-group');
        buttonGroups.forEach(group => {
            group.style.flexDirection = 'column';
            group.style.gap = '0.25rem';
        });

        // Reduce padding
        const pageContent = document.querySelector('.page-content');
        if (pageContent) pageContent.style.padding = '0.5rem';
    }

    optimizeForMobile() {
        const charts = document.querySelectorAll('.chart-container');
        charts.forEach(chart => chart.style.height = '250px');

        // Hide search on mobile
        const searchBox = document.querySelector('.search-box');
        if (searchBox) searchBox.style.display = 'none';

        // Ensure sidebar is collapsed
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.add('collapsed');
    }

    optimizeForTablet() {
        const charts = document.querySelectorAll('.chart-container');
        charts.forEach(chart => chart.style.height = '300px');

        // Limited search on tablet
        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
            searchBox.style.display = 'block';
            searchBox.style.maxWidth = '200px';
        }
    }

    optimizeForDesktop() {
        const charts = document.querySelectorAll('.chart-container');
        charts.forEach(chart => chart.style.height = '350px');

        // Full search on desktop
        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
            searchBox.style.display = 'block';
            searchBox.style.maxWidth = 'none';
        }
    }

    optimizeForTouch() {
        // Ensure touch targets are large enough
        const buttons = document.querySelectorAll('.btn, .nav-link, button');
        buttons.forEach(btn => {
            const computedStyle = window.getComputedStyle(btn);
            const height = parseInt(computedStyle.height);
            if (height < 44) {
                btn.style.minHeight = '44px';
                btn.style.padding = '0.75rem 1rem';
            }
        });

        // Add touch-friendly hover states
        document.body.classList.add('touch-optimized');
    }

    // Utility methods for other scripts
    isMobile() { return this.deviceInfo.isMobile || this.deviceInfo.isSmallMobile || this.deviceInfo.isLargeMobile; }
    isTablet() { return this.deviceInfo.isTablet || this.deviceInfo.isTabletSize; }
    isDesktop() { return this.deviceInfo.isDesktop || this.deviceInfo.isDesktopSize; }
    isTouch() { return this.deviceInfo.isTouch; }
    getScreenSize() { return { width: this.deviceInfo.screenWidth, height: this.deviceInfo.screenHeight }; }
}

// Initialize device detector when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.deviceDetector = new DeviceDetector();
    });
} else {
    window.deviceDetector = new DeviceDetector();
}