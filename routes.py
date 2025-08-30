from flask import render_template, request, jsonify, redirect, url_for, flash
from app import app, db
from models import Product, Order, OrderItem, User, GSTState
from datetime import datetime, timedelta
from sqlalchemy import func
import json

# Dashboard Routes
@app.route('/')
@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/inventory')
def inventory():
    return render_template('inventory.html')

@app.route('/orders')
def orders():
    return render_template('orders.html')

@app.route('/billing')
def billing():
    return render_template('billing.html')

@app.route('/reports')
def reports():
    return render_template('reports.html')

# API Routes
@app.route('/api/dashboard/stats')
def api_dashboard_stats():
    """Get dashboard statistics"""
    try:
        # Get basic counts
        total_products = Product.query.count()
        total_stock = db.session.query(func.sum(Product.stock_quantity)).scalar() or 0
        low_stock_count = Product.query.filter(Product.stock_quantity <= Product.min_stock_level).count()
        
        # Get sales data (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        monthly_sales = db.session.query(func.sum(Order.total_amount)).filter(
            Order.order_type == 'sale',
            Order.status == 'completed',
            Order.order_date >= thirty_days_ago
        ).scalar() or 0
        
        # Get recent orders
        recent_orders = Order.query.filter_by(order_type='sale').order_by(Order.order_date.desc()).limit(5).all()
        
        return jsonify({
            'status': 'success',
            'data': {
                'total_products': total_products,
                'total_stock': int(total_stock),
                'low_stock_count': low_stock_count,
                'monthly_sales': float(monthly_sales),
                'recent_orders': [order.to_dict() for order in recent_orders]
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/products', methods=['GET'])
def api_get_products():
    """Get all products"""
    try:
        products = Product.query.all()
        return jsonify({
            'status': 'success',
            'data': [product.to_dict() for product in products]
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/products', methods=['POST'])
def api_create_product():
    """Create a new product"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'category', 'price']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'status': 'error', 'message': f'{field} is required'}), 400
        
        # Generate SKU if not provided
        if not data.get('sku'):
            # Generate SKU from name and category
            name_part = ''.join([c.upper() for c in data['name'] if c.isalnum()])[:4]
            cat_part = ''.join([c.upper() for c in data['category'] if c.isalnum()])[:3]
            count = Product.query.count() + 1
            data['sku'] = f"{name_part}{cat_part}{count:03d}"
        
        # Create product
        product = Product(
            sku=data['sku'],
            name=data['name'],
            description=data.get('description', ''),
            category=data['category'],
            price=float(data['price']),
            cost_price=float(data.get('cost_price', 0)),
            gst_rate=float(data.get('gst_rate', 18)),
            hsn_code=data.get('hsn_code', ''),
            stock_quantity=int(data.get('stock_quantity', 0)),
            min_stock_level=int(data.get('min_stock_level', 10))
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': 'Product created successfully',
            'data': product.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Chart data endpoints
@app.route('/api/charts/sales')
def api_sales_chart():
    """Get sales chart data for last 7 days"""
    try:
        # Get last 7 days of sales
        days = []
        sales = []
        
        for i in range(6, -1, -1):
            date = datetime.now() - timedelta(days=i)
            day_sales = db.session.query(func.sum(Order.total_amount)).filter(
                Order.order_type == 'sale',
                Order.status == 'completed',
                func.date(Order.order_date) == date.date()
            ).scalar() or 0
            
            days.append(date.strftime('%b %d'))
            sales.append(float(day_sales))
        
        return jsonify({
            'status': 'success',
            'data': {
                'labels': days,
                'datasets': [{
                    'label': 'Sales',
                    'data': sales,
                    'borderColor': '#3b82f6',
                    'backgroundColor': 'rgba(59, 130, 246, 0.1)',
                    'tension': 0.4
                }]
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/charts/categories')
def api_categories_chart():
    """Get product distribution by category"""
    try:
        # Get product count by category
        categories = db.session.query(
            Product.category,
            func.count(Product.id).label('count')
        ).group_by(Product.category).all()
        
        labels = [cat[0] for cat in categories]
        data = [cat[1] for cat in categories]
        colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#f97316']
        
        return jsonify({
            'status': 'success',
            'data': {
                'labels': labels,
                'datasets': [{
                    'data': data,
                    'backgroundColor': colors[:len(labels)],
                    'borderWidth': 2,
                    'borderColor': '#ffffff'
                }]
            }
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

