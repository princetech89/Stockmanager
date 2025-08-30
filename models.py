from app import db
from datetime import datetime
from sqlalchemy import func

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    role = db.Column(db.String(20), default='staff')  # admin, staff, customer
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    sku = db.Column(db.String(50), unique=True, nullable=False)
    hsn_code = db.Column(db.String(20), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    gst_rate = db.Column(db.Float, default=18.0)  # GST percentage
    description = db.Column(db.Text)
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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
