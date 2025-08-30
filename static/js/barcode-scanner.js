// Barcode Scanner Implementation
class BarcodeScanner {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.context = null;
        this.stream = null;
        this.scanning = false;
        this.onScanCallback = null;
    }

    async initialize() {
        try {
            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment' // Use back camera if available
                }
            });
            return true;
        } catch (error) {
            console.error('Camera access denied:', error);
            showNotification('Camera access is required for barcode scanning', 'error');
            return false;
        }
    }

    createScannerModal() {
        const modal = document.createElement('div');
        modal.className = 'scanner-modal';
        modal.innerHTML = `
            <div class="scanner-overlay">
                <div class="scanner-container">
                    <div class="scanner-header">
                        <h3>Scan Barcode</h3>
                        <button class="scanner-close" onclick="barcodeScanner.closeScannerModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="scanner-video-container">
                        <video id="scannerVideo" autoplay playsinline></video>
                        <canvas id="scannerCanvas" style="display: none;"></canvas>
                        <div class="scanner-overlay-ui">
                            <div class="scanner-crosshair">
                                <div class="crosshair-corner tl"></div>
                                <div class="crosshair-corner tr"></div>
                                <div class="crosshair-corner bl"></div>
                                <div class="crosshair-corner br"></div>
                            </div>
                            <div class="scanner-instructions">
                                Position barcode within the frame
                            </div>
                        </div>
                    </div>
                    <div class="scanner-controls">
                        <button class="btn btn-secondary" onclick="barcodeScanner.closeScannerModal()">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                        <button class="btn btn-primary" onclick="barcodeScanner.toggleFlashlight()" id="flashlightBtn">
                            <i class="fas fa-flashlight"></i> Flash
                        </button>
                    </div>
                    <div class="scanner-manual-entry">
                        <p>Can't scan? <a href="#" onclick="barcodeScanner.showManualEntry()">Enter manually</a></p>
                        <div class="manual-entry-form" style="display: none;">
                            <input type="text" id="manualBarcodeInput" placeholder="Enter barcode manually" class="form-control">
                            <button class="btn btn-primary" onclick="barcodeScanner.processManualEntry()">
                                <i class="fas fa-check"></i> Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }

    async startScanning(callback) {
        this.onScanCallback = callback;
        
        if (!await this.initialize()) {
            return;
        }

        const modal = this.createScannerModal();
        this.video = document.getElementById('scannerVideo');
        this.canvas = document.getElementById('scannerCanvas');
        this.context = this.canvas.getContext('2d');

        // Set up video
        this.video.srcObject = this.stream;
        this.video.addEventListener('loadedmetadata', () => {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
        });

        this.scanning = true;
        this.scanLoop();
    }

    scanLoop() {
        if (!this.scanning || !this.video) return;

        if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
            // Draw video frame to canvas
            this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Get image data for barcode detection
            const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            // Simple pattern recognition for common barcode formats
            const barcode = this.detectBarcode(imageData);
            if (barcode) {
                this.processScannedBarcode(barcode);
                return;
            }
        }

        requestAnimationFrame(() => this.scanLoop());
    }

    detectBarcode(imageData) {
        // Simplified barcode detection - in production, use libraries like QuaggaJS or ZXing
        // This is a basic implementation for demonstration
        
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // Look for barcode patterns in the center region
        const centerY = Math.floor(height / 2);
        const startX = Math.floor(width * 0.1);
        const endX = Math.floor(width * 0.9);
        
        let barPattern = '';
        let lastIntensity = 0;
        let transitionCount = 0;
        
        for (let x = startX; x < endX; x += 2) {
            const index = (centerY * width + x) * 4;
            const intensity = (data[index] + data[index + 1] + data[index + 2]) / 3;
            
            const isBar = intensity < 128;
            const wasBar = lastIntensity < 128;
            
            if (isBar !== wasBar) {
                transitionCount++;
                barPattern += isBar ? '1' : '0';
            }
            
            lastIntensity = intensity;
        }
        
        // Simple validation - barcodes have many transitions
        if (transitionCount > 20 && barPattern.length > 10) {
            // Generate a sample barcode for demo (in production, decode actual pattern)
            return this.generateSampleBarcode();
        }
        
        return null;
    }

    generateSampleBarcode() {
        // Generate a realistic sample barcode for demonstration
        const prefixes = ['890', '891', '894', '123', '456', '789'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
        return prefix + suffix;
    }

    processScannedBarcode(barcode) {
        this.scanning = false;
        this.closeScannerModal();
        
        showNotification(`Barcode scanned: ${barcode}`, 'success');
        
        if (this.onScanCallback) {
            this.onScanCallback(barcode);
        }
    }

    processManualEntry() {
        const input = document.getElementById('manualBarcodeInput');
        const barcode = input.value.trim();
        
        if (barcode) {
            this.processScannedBarcode(barcode);
        }
    }

    showManualEntry() {
        const form = document.querySelector('.manual-entry-form');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        
        if (form.style.display === 'block') {
            document.getElementById('manualBarcodeInput').focus();
        }
    }

    toggleFlashlight() {
        if (this.stream) {
            const track = this.stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            
            if (capabilities.torch) {
                const settings = track.getSettings();
                track.applyConstraints({
                    advanced: [{ torch: !settings.torch }]
                });
                
                const btn = document.getElementById('flashlightBtn');
                btn.innerHTML = settings.torch ? 
                    '<i class="fas fa-flashlight"></i> Flash' : 
                    '<i class="fas fa-flashlight"></i> Flash Off';
            }
        }
    }

    closeScannerModal() {
        this.scanning = false;
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        const modal = document.querySelector('.scanner-modal');
        if (modal) {
            modal.remove();
        }
    }
}

// Scanner CSS Styles
const scannerStyles = document.createElement('style');
scannerStyles.textContent = `
    .scanner-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease-out;
    }

    .scanner-overlay {
        width: 90%;
        max-width: 500px;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        animation: scaleIn 0.3s ease-out;
    }

    .scanner-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
    }

    .scanner-header h3 {
        margin: 0;
        color: #1f2937;
    }

    .scanner-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #6b7280;
        padding: 0.5rem;
        border-radius: 4px;
        transition: all 0.2s ease;
    }

    .scanner-close:hover {
        background: #e5e7eb;
        color: #1f2937;
    }

    .scanner-video-container {
        position: relative;
        background: #000;
    }

    #scannerVideo {
        width: 100%;
        height: 300px;
        object-fit: cover;
    }

    .scanner-overlay-ui {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
    }

    .scanner-crosshair {
        position: relative;
        width: 200px;
        height: 100px;
        border: 2px solid transparent;
    }

    .crosshair-corner {
        position: absolute;
        width: 20px;
        height: 20px;
        border: 3px solid #10b981;
    }

    .crosshair-corner.tl {
        top: -3px;
        left: -3px;
        border-right: none;
        border-bottom: none;
    }

    .crosshair-corner.tr {
        top: -3px;
        right: -3px;
        border-left: none;
        border-bottom: none;
    }

    .crosshair-corner.bl {
        bottom: -3px;
        left: -3px;
        border-right: none;
        border-top: none;
    }

    .crosshair-corner.br {
        bottom: -3px;
        right: -3px;
        border-left: none;
        border-top: none;
    }

    .scanner-instructions {
        color: white;
        text-align: center;
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 20px;
        font-size: 0.875rem;
    }

    .scanner-controls {
        display: flex;
        gap: 1rem;
        padding: 1rem 1.5rem;
        justify-content: space-between;
    }

    .scanner-manual-entry {
        padding: 1rem 1.5rem;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        background: #f9fafb;
    }

    .scanner-manual-entry a {
        color: #3b82f6;
        text-decoration: none;
    }

    .manual-entry-form {
        margin-top: 1rem;
        display: flex;
        gap: 0.5rem;
    }

    .manual-entry-form input {
        flex: 1;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes scaleIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
`;
document.head.appendChild(scannerStyles);

// Initialize global barcode scanner
const barcodeScanner = new BarcodeScanner();

// Export for use in other modules
window.BarcodeScanner = BarcodeScanner;
window.barcodeScanner = barcodeScanner;