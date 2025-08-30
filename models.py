from app import db
from datetime import datetime
from sqlalchemy import func

class User(db.Model):
    __tablename__ = 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    role = db.Column(db.String(20), default='staff')  # admin, manager, staff, viewer
    # Enhanced user management
    is_active = db.Column(db.Boolean, default=True)
    last_login = db.Column(db.DateTime)
    permissions = db.Column(db.Text)  # JSON string of permissions
    department = db.Column(db.String(50))
    phone = db.Column(db.String(15))
    profile_image = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    sku = db.Column(db.String(50), unique=True, nullable=False)
    hsn_code = db.Column(db.String(20), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    purchase_price = db.Column(db.Float, nullable=False, default=0.0)  # For profit calculation
    gst_rate = db.Column(db.Float, default=18.0)  # GST percentage
    description = db.Column(db.Text)
    # Multi-unit support
    base_unit = db.Column(db.String(20), default='piece')  # piece, kg, liter, box
    conversion_factor = db.Column(db.Integer, default=1)  # 1 box = 12 pieces
    # Batch and expiry tracking
    track_batches = db.Column(db.Boolean, default=False)
    has_expiry = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Stock(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    available_qty = db.Column(db.Integer, default=0)
    min_qty = db.Column(db.Integer, default=10)  # Alert threshold
    product = db.relationship('Product', backref=db.backref('stock', uselist=False))

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False)
    order_type = db.Column(db.String(20), nullable=False)  # sales, purchase
    customer_name = db.Column(db.String(200))
    customer_mobile = db.Column(db.String(15))
    customer_gst = db.Column(db.String(15))
    total_amount = db.Column(db.Float, default=0.0)
    gst_amount = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(20), default='pending')  # pending, completed, cancelled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    order = db.relationship('Order', backref=db.backref('items', lazy=True))
    product = db.relationship('Product', backref=db.backref('order_items', lazy=True))

class Supplier(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    contact_person = db.Column(db.String(100))
    mobile = db.Column(db.String(15))
    email = db.Column(db.String(120))
    gst_number = db.Column(db.String(15))
    address = db.Column(db.Text)
    # Enhanced vendor management
    payment_terms = db.Column(db.String(100), default='Net 30')  # Payment terms
    credit_limit = db.Column(db.Float, default=0.0)
    current_balance = db.Column(db.Float, default=0.0)
    rating = db.Column(db.Integer, default=5)  # 1-5 star rating
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Batch tracking for products with expiry dates
class ProductBatch(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    batch_number = db.Column(db.String(50), nullable=False)
    expiry_date = db.Column(db.Date)
    available_qty = db.Column(db.Integer, default=0)
    purchase_date = db.Column(db.Date, default=datetime.utcnow)
    product = db.relationship('Product', backref=db.backref('batches', lazy=True))

# Customer credit tracking (bahi-khata style)
class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    mobile = db.Column(db.String(15), unique=True)
    email = db.Column(db.String(120))
    gst_number = db.Column(db.String(15))
    address = db.Column(db.Text)
    credit_limit = db.Column(db.Float, default=0.0)
    outstanding_amount = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Credit transactions for customers
class CreditTransaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=True)
    transaction_type = db.Column(db.String(20), nullable=False)  # 'sale', 'payment', 'adjustment'
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    customer = db.relationship('Customer', backref=db.backref('transactions', lazy=True))

# Indian State GST codes for automatic tax calculation
class GSTState(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    state_name = db.Column(db.String(100), nullable=False)
    state_code = db.Column(db.String(2), unique=True, nullable=False)
    
    @staticmethod
    def initialize_states():
        """Initialize Indian states with their GST codes"""
        states = [
            ('Andhra Pradesh', '37'), ('Arunachal Pradesh', '12'), ('Assam', '18'),
            ('Bihar', '10'), ('Chhattisgarh', '22'), ('Delhi', '07'), ('Goa', '30'),
            ('Gujarat', '24'), ('Haryana', '06'), ('Himachal Pradesh', '02'),
            ('Jharkhand', '20'), ('Karnataka', '29'), ('Kerala', '32'),
            ('Madhya Pradesh', '23'), ('Maharashtra', '27'), ('Manipur', '14'),
            ('Meghalaya', '17'), ('Mizoram', '15'), ('Nagaland', '13'),
            ('Odisha', '21'), ('Punjab', '03'), ('Rajasthan', '08'),
            ('Sikkim', '11'), ('Tamil Nadu', '33'), ('Telangana', '36'),
            ('Tripura', '16'), ('Uttar Pradesh', '09'), ('Uttarakhand', '05'),
            ('West Bengal', '19'), ('Jammu and Kashmir', '01'), ('Ladakh', '38'),
            ('Chandigarh', '04'), ('Dadra and Nagar Haveli and Daman and Diu', '26'),
            ('Lakshadweep', '31'), ('Puducherry', '34'), ('Andaman and Nicobar Islands', '35')
        ]
        
        for state_name, code in states:
            if not GSTState.query.filter_by(state_code=code).first():
                state = GSTState(state_name=state_name, state_code=code)
                db.session.add(state)
