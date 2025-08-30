# Overview

This is a comprehensive Stock Inventory Management System designed specifically for Indian businesses, with built-in GST support and compliance features. The application is a Flask-based web system that handles product inventory, order management, billing with GST calculations, and comprehensive reporting. It serves as a complete business solution for managing stock, generating invoices, tracking sales and purchases, and maintaining regulatory compliance.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Backend Architecture
- **Framework**: Flask web framework with SQLAlchemy ORM for database operations
- **Database**: SQLite as default with PostgreSQL support via environment configuration
- **Models**: Core entities include User (role-based access), Product (with HSN codes and GST rates), Stock (inventory tracking), Order (sales/purchase), and OrderItem (order line items)
- **API Design**: RESTful API endpoints under `/api/` prefix for data operations and dashboard statistics
- **Session Management**: Flask sessions with configurable secret keys for security

## Frontend Architecture
- **Template Engine**: Jinja2 templating with a base template pattern for consistent UI
- **CSS Framework**: Custom CSS with CSS variables for theming and responsive design
- **JavaScript Architecture**: Modular JavaScript classes for different sections (DashboardManager, InventoryManager, OrdersManager, ReportsManager, BillingManager)
- **Data Persistence**: LocalStorage integration for client-side caching and settings
- **Charts & Visualization**: Chart.js for data visualization and reporting

## Database Design
- **Products**: SKU-based product management with HSN codes for GST compliance
- **Stock Management**: Separate stock table with minimum quantity thresholds for alerts
- **Order System**: Dual-purpose orders for both sales and purchase operations
- **User Management**: Role-based access control (admin, staff, customer)
- **GST Integration**: Built-in GST rate management and calculation support

## UI/UX Architecture
- **Responsive Design**: Mobile-first approach with collapsible sidebar navigation
- **Role-Based Interface**: Different dashboard views based on user roles
- **Real-time Updates**: Auto-refresh functionality for dashboard metrics
- **Modal-Based Forms**: Overlay forms for CRUD operations
- **Notification System**: Toast notifications for user feedback

## Business Logic
- **GST Compliance**: Automatic GST calculations based on product rates and customer GST status
- **Inventory Alerts**: Low stock threshold monitoring with dashboard alerts
- **Order Workflow**: Complete order lifecycle from creation to completion
- **Reporting Engine**: Multi-format export capabilities (CSV, Excel, PDF) for various business reports

# External Dependencies

## Core Dependencies
- **Flask**: Web framework and core application server
- **SQLAlchemy**: ORM for database operations and model management
- **Werkzeug**: WSGI utilities and middleware for production deployment

## Frontend Libraries
- **Chart.js**: Data visualization and dashboard charts
- **Font Awesome**: Icon library for UI elements
- **jsPDF**: Client-side PDF generation for invoices and reports

## Database Support
- **SQLite**: Default database for development and small deployments
- **PostgreSQL**: Production database support via DATABASE_URL environment variable

## Indian Business Compliance
- **HSN Code System**: Product classification for GST compliance
- **GST Rate Management**: Support for multiple GST rates (5%, 12%, 18%, 28%)
- **State Code Integration**: GST state code management for inter-state transactions

## Development Tools
- **Environment Configuration**: Support for development and production environments
- **Debug Mode**: Flask debug mode for development
- **Proxy Support**: ProxyFix middleware for deployment behind reverse proxies