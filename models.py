from app import db
from datetime import datetime
from sqlalchemy import func

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False, default=0.0)
    cost_price = db.Column(db.Float, nullable=False, default=0.0)
    gst_rate = db.Column(db.Float, nullable=False, default=18.0)
    hsn_code = db.Column(db.String(20))
    
    # Stock management
    stock_quantity = db.Column(db.Integer, nullable=False, default=0)
    min_stock_level = db.Column(db.Integer, nullable=False, default=10)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order_items = db.relationship('OrderItem', backref='product', lazy=True)
    
    def __repr__(self):
        return f'<Product {self.sku}: {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'sku': self.sku,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'price': self.price,
            'cost_price': self.cost_price,
            'gst_rate': self.gst_rate,
            'hsn_code': self.hsn_code,
            'stock_quantity': self.stock_quantity,
            'min_stock_level': self.min_stock_level,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.min_stock_level

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False)
    order_type = db.Column(db.String(20), nullable=False, default='sale')  # 'sale' or 'purchase'
    status = db.Column(db.String(20), nullable=False, default='pending')  # 'pending', 'completed', 'cancelled'
    
    # Customer/Vendor details
    customer_name = db.Column(db.String(200))
    customer_email = db.Column(db.String(200))
    customer_phone = db.Column(db.String(20))
    customer_address = db.Column(db.Text)
    customer_gst_number = db.Column(db.String(20))
    
    # Order totals
    subtotal = db.Column(db.Float, nullable=False, default=0.0)
    gst_amount = db.Column(db.Float, nullable=False, default=0.0)
    total_amount = db.Column(db.Float, nullable=False, default=0.0)
    
    # Payment
    payment_status = db.Column(db.String(20), nullable=False, default='unpaid')  # 'paid', 'unpaid', 'partial'
    payment_method = db.Column(db.String(50))
    
    # Timestamps
    order_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    order_items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Order {self.order_number}: {self.order_type}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_number': self.order_number,
            'order_type': self.order_type,
            'status': self.status,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'customer_address': self.customer_address,
            'customer_gst_number': self.customer_gst_number,
            'subtotal': self.subtotal,
            'gst_amount': self.gst_amount,
            'total_amount': self.total_amount,
            'payment_status': self.payment_status,
            'payment_method': self.payment_method,
            'order_date': self.order_date.isoformat() if self.order_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'order_items': [item.to_dict() for item in (self.order_items or [])]
        }

class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    gst_rate = db.Column(db.Float, nullable=False, default=18.0)
    
    # Calculated fields
    line_total = db.Column(db.Float, nullable=False, default=0.0)
    gst_amount = db.Column(db.Float, nullable=False, default=0.0)
    
    def __repr__(self):
        return f'<OrderItem Order:{self.order_id} Product:{self.product_id} Qty:{self.quantity}>'
    
    def to_dict(self):
        product_name = None
        product_sku = None
        if hasattr(self, 'product') and self.product:
            product_name = self.product.name
            product_sku = self.product.sku
        return {
            'id': self.id,
            'order_id': self.order_id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'gst_rate': self.gst_rate,
            'line_total': self.line_total,
            'gst_amount': self.gst_amount,
            'product_name': product_name,
            'product_sku': product_sku
        }
    
    def calculate_totals(self):
        """Calculate line total and GST amount"""
        base_amount = self.quantity * self.unit_price
        self.gst_amount = (base_amount * self.gst_rate) / 100
        self.line_total = base_amount + self.gst_amount

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    role = db.Column(db.String(20), nullable=False, default='staff')  # 'admin', 'staff', 'customer'
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class GSTState(db.Model):
    __tablename__ = 'gst_states'
    
    id = db.Column(db.Integer, primary_key=True)
    state_name = db.Column(db.String(100), nullable=False)
    state_code = db.Column(db.String(5), unique=True, nullable=False)
    
    @classmethod
    def initialize_states(cls):
        """Initialize Indian states with GST codes"""
        indian_states = [
            ('Andhra Pradesh', '37'), ('Arunachal Pradesh', '12'), ('Assam', '18'),
            ('Bihar', '10'), ('Chhattisgarh', '22'), ('Goa', '30'), ('Gujarat', '24'),
            ('Haryana', '06'), ('Himachal Pradesh', '02'), ('Jharkhand', '20'),
            ('Karnataka', '29'), ('Kerala', '32'), ('Madhya Pradesh', '23'),
            ('Maharashtra', '27'), ('Manipur', '14'), ('Meghalaya', '17'),
            ('Mizoram', '15'), ('Nagaland', '13'), ('Odisha', '21'), ('Punjab', '03'),
            ('Rajasthan', '08'), ('Sikkim', '11'), ('Tamil Nadu', '33'),
            ('Telangana', '36'), ('Tripura', '16'), ('Uttar Pradesh', '09'),
            ('Uttarakhand', '05'), ('West Bengal', '19'), ('Delhi', '07'),
            ('Jammu and Kashmir', '01'), ('Ladakh', '38'), ('Puducherry', '34'),
            ('Chandigarh', '04'), ('Dadra and Nagar Haveli and Daman and Diu', '26'),
            ('Lakshadweep', '31'), ('Andaman and Nicobar Islands', '35')
        ]
        
        for state_name, state_code in indian_states:
            if not cls.query.filter_by(state_code=state_code).first():
                state = cls(state_name=state_name, state_code=state_code)
                db.session.add(state)