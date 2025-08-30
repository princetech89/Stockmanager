# Stock Inventory Management System

A comprehensive web-based inventory management system designed specifically for Indian businesses, featuring GST compliance, modern UI, and complete business workflow management.

## 🚀 Features

### Core Functionality
- **Product Management** - Add, edit, delete products with HSN codes
- **Inventory Tracking** - Real-time stock levels with low stock alerts
- **Order Processing** - Sales and purchase order management
- **GST Compliance** - Automatic CGST/SGST/IGST calculations
- **Invoice Generation** - Professional invoices with QR codes
- **Reporting** - Comprehensive business reports and analytics

### Advanced Features
- **Multi-device Responsive Design** - Works on desktop, tablet, and mobile
- **Progressive Web App (PWA)** - Install like a native app
- **Barcode Scanning** - Quick product identification
- **Advanced Analytics** - Profit tracking and business insights
- **Multi-location Support** - Manage inventory across locations
- **Vendor Management** - Supplier relationship management

### Indian Business Compliance
- **HSN Code Integration** - Product classification for GST
- **GST Rate Management** - Support for 5%, 12%, 18%, 28% rates
- **State Code Management** - Automatic inter/intra-state detection
- **Indian Number Formatting** - Rupee symbol and Indian number system

## 🛠 Tech Stack

- **Backend**: Flask (Python)
- **Database**: PostgreSQL / SQLite
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **PDF Generation**: jsPDF
- **Server**: Gunicorn

## 📋 Prerequisites

- Python 3.8 or higher
- PostgreSQL (recommended) or SQLite
- Modern web browser

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/stock-inventory-management.git
cd stock-inventory-management
```

### 2. Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements-github.txt
```

### 4. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 5. Database Setup
```bash
# For PostgreSQL
createdb stockmanagement

# For SQLite (development)
# Database will be created automatically
```

### 6. Initialize Database
```bash
python -c "from app import app, db; app.app_context().push(); db.create_all()"
```

### 7. Run the Application
```bash
# Development
python main.py

# Production
gunicorn --bind 0.0.0.0:5000 main:app
```

Visit `http://localhost:5000` in your browser.

## ⚙️ Configuration

### Environment Variables (.env file)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | Yes |
| `SESSION_SECRET` | Flask session secret key | Yes |
| `TWILIO_ACCOUNT_SID` | Twilio account SID (for SMS) | No |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | No |
| `TWILIO_PHONE_NUMBER` | Twilio phone number | No |

### Database URLs

- **PostgreSQL**: `postgresql://username:password@localhost/dbname`
- **SQLite**: `sqlite:///database.db`

## 🚀 Deployment

### Heroku
```bash
# Install Heroku CLI
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

### Railway
```bash
# Connect GitHub repository to Railway
# Add environment variables in Railway dashboard
```

### DigitalOcean App Platform
- Connect GitHub repository
- Configure environment variables
- Deploy automatically

## 📖 Usage

### Getting Started
1. **Dashboard** - Overview of business metrics
2. **Add Products** - Go to Inventory → Add Product
3. **Create Orders** - Go to Orders → Create Order
4. **Generate Invoices** - Go to Billing → Create Invoice
5. **View Reports** - Go to Reports → Select report type

### Key Workflows
- **Stock Management**: Monitor inventory levels and receive alerts
- **Order Processing**: Create, track, and fulfill customer orders
- **GST Compliance**: Automatic tax calculations and filing reports
- **Business Analytics**: Track sales, profits, and performance

## 🎨 UI Features

### Modern Design
- **Organic UI** - Curved edges and floating elements
- **Purple Gradient Theme** - Professional color scheme
- **Responsive Layout** - Works on all screen sizes
- **Dark/Light Mode** - User preference support

### Interactive Elements
- **Animated Transitions** - Smooth UI interactions
- **Real-time Updates** - Live data refresh
- **Modal Forms** - Overlay-based data entry
- **Contextual Menus** - Quick action access

## 🔒 Security

- Session-based authentication
- CSRF protection
- SQL injection prevention
- XSS protection
- Secure password handling

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the Help & Support section in the application
- Review the documentation

## 🙏 Acknowledgments

- Flask community for the excellent web framework
- Chart.js for beautiful data visualization
- Font Awesome for comprehensive icons
- Indian GST system for compliance requirements

---

**Made with ❤️ for Indian businesses**