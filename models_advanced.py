# Advanced Models for Enterprise Features
from models import db
from datetime import datetime
from sqlalchemy import func

# Multi-location inventory management
class Warehouse(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    address = db.Column(db.Text)
    manager_name = db.Column(db.String(100))
    phone = db.Column(db.String(15))
    email = db.Column(db.String(120))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class WarehouseStock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouse.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    available_qty = db.Column(db.Integer, default=0)
    reserved_qty = db.Column(db.Integer, default=0)  # Reserved for orders
    min_qty = db.Column(db.Integer, default=10)
    max_qty = db.Column(db.Integer, default=1000)
    location = db.Column(db.String(50))  # Shelf/bin location
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    warehouse = db.relationship('Warehouse', backref=db.backref('stocks', lazy=True))
    product = db.relationship('Product', backref=db.backref('warehouse_stocks', lazy=True))

# Purchase Order System
class PurchaseOrder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    po_number = db.Column(db.String(50), unique=True, nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('supplier.id'), nullable=False)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouse.id'), nullable=False)
    status = db.Column(db.String(20), default='draft')  # draft, sent, received, cancelled
    order_date = db.Column(db.DateTime, default=datetime.utcnow)
    expected_date = db.Column(db.DateTime)
    received_date = db.Column(db.DateTime)
    total_amount = db.Column(db.Float, default=0.0)
    notes = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    supplier = db.relationship('Supplier', backref=db.backref('purchase_orders', lazy=True))
    warehouse = db.relationship('Warehouse', backref=db.backref('purchase_orders', lazy=True))
    created_by_user = db.relationship('User', backref=db.backref('created_pos', lazy=True))

class PurchaseOrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    po_id = db.Column(db.Integer, db.ForeignKey('purchase_order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    ordered_qty = db.Column(db.Integer, nullable=False)
    received_qty = db.Column(db.Integer, default=0)
    unit_cost = db.Column(db.Float, nullable=False)
    total_cost = db.Column(db.Float, nullable=False)
    
    purchase_order = db.relationship('PurchaseOrder', backref=db.backref('items', lazy=True))
    product = db.relationship('Product', backref=db.backref('po_items', lazy=True))

# Return/Exchange Management
class ReturnOrder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    return_number = db.Column(db.String(50), unique=True, nullable=False)
    original_order_id = db.Column(db.Integer, db.ForeignKey('order.id'))
    return_type = db.Column(db.String(20), nullable=False)  # customer_return, supplier_return
    reason = db.Column(db.String(200))
    status = db.Column(db.String(20), default='pending')  # pending, approved, completed
    total_amount = db.Column(db.Float, default=0.0)
    refund_amount = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    processed_at = db.Column(db.DateTime)
    processed_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    
    original_order = db.relationship('Order', backref=db.backref('returns', lazy=True))
    processed_by_user = db.relationship('User', backref=db.backref('processed_returns', lazy=True))

class ReturnOrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    return_id = db.Column(db.Integer, db.ForeignKey('return_order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    condition = db.Column(db.String(50))  # good, damaged, expired
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    
    return_order = db.relationship('ReturnOrder', backref=db.backref('items', lazy=True))
    product = db.relationship('Product', backref=db.backref('return_items', lazy=True))

# Automated Reordering System
class ReorderRule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouse.id'), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('supplier.id'), nullable=False)
    min_qty = db.Column(db.Integer, nullable=False)
    reorder_qty = db.Column(db.Integer, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    auto_create_po = db.Column(db.Boolean, default=False)
    lead_time_days = db.Column(db.Integer, default=7)
    
    product = db.relationship('Product', backref=db.backref('reorder_rules', lazy=True))
    warehouse = db.relationship('Warehouse', backref=db.backref('reorder_rules', lazy=True))
    supplier = db.relationship('Supplier', backref=db.backref('reorder_rules', lazy=True))

# Audit Trail System
class AuditLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)  # create, update, delete
    table_name = db.Column(db.String(50), nullable=False)
    record_id = db.Column(db.Integer, nullable=False)
    old_values = db.Column(db.Text)  # JSON string of old values
    new_values = db.Column(db.Text)  # JSON string of new values
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('audit_logs', lazy=True))

# Analytics and Reporting
class SalesAnalytics(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouse.id'), nullable=False)
    quantity_sold = db.Column(db.Integer, default=0)
    revenue = db.Column(db.Float, default=0.0)
    profit = db.Column(db.Float, default=0.0)
    customer_count = db.Column(db.Integer, default=0)
    
    product = db.relationship('Product', backref=db.backref('sales_analytics', lazy=True))
    warehouse = db.relationship('Warehouse', backref=db.backref('sales_analytics', lazy=True))

# Notification System
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), default='info')  # info, warning, error, success
    is_read = db.Column(db.Boolean, default=False)
    action_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read_at = db.Column(db.DateTime)
    
    user = db.relationship('User', backref=db.backref('notifications', lazy=True))

# System Settings and Configurations
class SystemSetting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))
    data_type = db.Column(db.String(20), default='string')  # string, int, float, bool, json
    is_public = db.Column(db.Boolean, default=False)  # Can non-admin users see this?
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Product Pricing History
class PriceHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    old_price = db.Column(db.Float, nullable=False)
    new_price = db.Column(db.Float, nullable=False)
    changed_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reason = db.Column(db.String(200))
    effective_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    product = db.relationship('Product', backref=db.backref('price_history', lazy=True))
    changed_by_user = db.relationship('User', backref=db.backref('price_changes', lazy=True))

# Customer Enhanced Model
class CustomerEnhanced(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(120))
    phone = db.Column(db.String(15))
    gst_number = db.Column(db.String(15))
    address = db.Column(db.Text)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    pincode = db.Column(db.String(10))
    # Enhanced features
    customer_type = db.Column(db.String(20), default='regular')  # regular, premium, wholesale
    credit_limit = db.Column(db.Float, default=0.0)
    current_balance = db.Column(db.Float, default=0.0)
    payment_terms = db.Column(db.String(50), default='immediate')
    loyalty_points = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_purchase = db.Column(db.DateTime)

# Barcode Management
class ProductBarcode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    barcode = db.Column(db.String(100), unique=True, nullable=False)
    barcode_type = db.Column(db.String(20), default='CODE128')  # CODE128, EAN13, UPC, etc.
    is_primary = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    product = db.relationship('Product', backref=db.backref('barcodes', lazy=True))