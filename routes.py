from flask import render_template, request, jsonify, redirect, url_for
from app import app, db
from models import Product, Stock, Order, OrderItem, Supplier, ProductBatch, Customer, CreditTransaction, GSTState
from datetime import datetime, timedelta
import json
import qrcode
import io
import base64

@app.route('/')
def landing():
    return render_template('landing.html')

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

@app.route('/settings')
def settings():
    return render_template('settings.html')

# Utility Functions
def calculate_gst_split(amount, gst_rate, business_state_code, customer_gst):
    """Calculate CGST/SGST or IGST based on state codes"""
    gst_amount = (amount * gst_rate) / 100
    
    # Get customer state from GST number (first 2 digits)
    if customer_gst and len(customer_gst) >= 2:
        customer_state_code = customer_gst[:2]
    else:
        customer_state_code = business_state_code  # Same state if no GST
    
    if customer_state_code == business_state_code:
        # Same state - CGST + SGST
        return {
            'cgst': gst_amount / 2,
            'sgst': gst_amount / 2,
            'igst': 0,
            'total_gst': gst_amount
        }
    else:
        # Different state - IGST
        return {
            'cgst': 0,
            'sgst': 0,
            'igst': gst_amount,
            'total_gst': gst_amount
        }

def generate_upi_qr(amount, business_name, order_number):
    """Generate UPI QR code for payment"""
    # UPI URL format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=DESCRIPTION
    upi_url = f"upi://pay?pa=merchant@upi&pn={business_name}&am={amount}&cu=INR&tn=Invoice {order_number}"
    
    qr = qrcode.QRCode(version=1, box_size=6, border=5)
    qr.add_data(upi_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    # Return base64 encoded image
    return base64.b64encode(buffer.getvalue()).decode()

# API Routes for data operations
@app.route('/api/dashboard-stats')
def dashboard_stats():
    try:
        # Calculate dashboard statistics
        total_products = Product.query.count()
        total_stock = db.session.query(db.func.sum(Stock.available_qty)).scalar() or 0
        low_stock_count = Stock.query.filter(Stock.available_qty <= Stock.min_qty).count()
        
        # Sales data for current month
        current_month = datetime.now().replace(day=1)
        monthly_sales = Order.query.filter(
            Order.order_type == 'sales',
            Order.created_at >= current_month
        ).count()
        
        return jsonify({
            'total_products': total_products,
            'total_stock': total_stock,
            'low_stock_count': low_stock_count,
            'monthly_sales': monthly_sales
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products', methods=['GET', 'POST'])
def handle_products():
    if request.method == 'GET':
        try:
            products = Product.query.all()
            product_list = []
            for product in products:
                stock = Stock.query.filter_by(product_id=product.id).first()
                product_data = {
                    'id': product.id,
                    'name': product.name,
                    'sku': product.sku,
                    'hsn_code': product.hsn_code,
                    'category': product.category,
                    'unit_price': product.unit_price,
                    'gst_rate': product.gst_rate,
                    'description': product.description,
                    'available_qty': stock.available_qty if stock else 0,
                    'min_qty': stock.min_qty if stock else 10
                }
                product_list.append(product_data)
            return jsonify(product_list)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            
            # Create new product
            product = Product(
                name=data['name'],
                sku=data['sku'],
                hsn_code=data['hsn_code'],
                category=data['category'],
                unit_price=float(data['unit_price']),
                gst_rate=float(data['gst_rate']),
                description=data.get('description', '')
            )
            
            db.session.add(product)
            db.session.flush()  # To get the product ID
            
            # Create stock entry
            stock = Stock(
                product_id=product.id,
                available_qty=int(data.get('available_qty', 0)),
                min_qty=int(data.get('min_qty', 10))
            )
            
            db.session.add(stock)
            db.session.commit()
            
            return jsonify({'success': True, 'message': 'Product added successfully'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['PUT', 'DELETE'])
def handle_product(product_id):
    if request.method == 'PUT':
        try:
            product = Product.query.get_or_404(product_id)
            data = request.get_json()
            
            product.name = data['name']
            product.sku = data['sku']
            product.hsn_code = data['hsn_code']
            product.category = data['category']
            product.unit_price = float(data['unit_price'])
            product.gst_rate = float(data['gst_rate'])
            product.description = data.get('description', '')
            product.updated_at = datetime.utcnow()
            
            # Update stock
            stock = Stock.query.filter_by(product_id=product_id).first()
            if stock:
                stock.available_qty = int(data.get('available_qty', stock.available_qty))
                stock.min_qty = int(data.get('min_qty', stock.min_qty))
            
            db.session.commit()
            return jsonify({'success': True, 'message': 'Product updated successfully'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'DELETE':
        try:
            product = Product.query.get_or_404(product_id)
            
            # Delete associated stock
            Stock.query.filter_by(product_id=product_id).delete()
            
            # Delete product
            db.session.delete(product)
            db.session.commit()
            
            return jsonify({'success': True, 'message': 'Product deleted successfully'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

@app.route('/api/orders', methods=['GET', 'POST'])
def handle_orders():
    if request.method == 'GET':
        try:
            order_type = request.args.get('type', 'sales')
            orders = Order.query.filter_by(order_type=order_type).order_by(Order.created_at.desc()).all()
            
            order_list = []
            for order in orders:
                order_data = {
                    'id': order.id,
                    'order_number': order.order_number,
                    'customer_name': order.customer_name,
                    'customer_mobile': order.customer_mobile,
                    'total_amount': order.total_amount,
                    'gst_amount': order.gst_amount,
                    'status': order.status,
                    'created_at': order.created_at.strftime('%Y-%m-%d %H:%M'),
                    'items': len(order.items)
                }
                order_list.append(order_data)
            
            return jsonify(order_list)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            
            # Generate order number
            order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{Order.query.count() + 1:04d}"
            
            # Create order
            order = Order(
                order_number=order_number,
                order_type=data['order_type'],
                customer_name=data.get('customer_name', ''),
                customer_mobile=data.get('customer_mobile', ''),
                customer_gst=data.get('customer_gst', ''),
                status='pending'
            )
            
            db.session.add(order)
            db.session.flush()
            
            # Add order items
            total_amount = 0
            total_gst = 0
            
            for item_data in data['items']:
                product = Product.query.get(item_data['product_id'])
                if not product:
                    raise ValueError(f"Product with ID {item_data['product_id']} not found")
                
                quantity = int(item_data['quantity'])
                unit_price = float(item_data['unit_price'])
                item_total = quantity * unit_price
                
                # Calculate GST
                gst_amount = (item_total * product.gst_rate) / 100
                
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=item_total
                )
                
                db.session.add(order_item)
                
                total_amount += item_total
                total_gst += gst_amount
                
                # Update stock for sales orders
                if data['order_type'] == 'sales':
                    stock = Stock.query.filter_by(product_id=product.id).first()
                    if stock:
                        stock.available_qty = max(0, stock.available_qty - quantity)
            
            order.total_amount = total_amount
            order.gst_amount = total_gst
            
            db.session.commit()
            
            return jsonify({'success': True, 'message': 'Order created successfully', 'order_id': order.id})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

@app.route('/api/sales-chart')
def sales_chart():
    try:
        # Get sales data for the last 7 days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=6)
        
        sales_data = []
        labels = []
        
        for i in range(7):
            current_date = start_date + timedelta(days=i)
            day_start = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            daily_sales = db.session.query(db.func.sum(Order.total_amount)).filter(
                Order.order_type == 'sales',
                Order.created_at >= day_start,
                Order.created_at < day_end
            ).scalar() or 0
            
            sales_data.append(float(daily_sales))
            labels.append(current_date.strftime('%d/%m'))
        
        return jsonify({
            'labels': labels,
            'data': sales_data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/category-chart')
def category_chart():
    try:
        # Get product count by category
        categories = db.session.query(
            Product.category,
            db.func.count(Product.id)
        ).group_by(Product.category).all()
        
        labels = [cat[0] for cat in categories]
        data = [cat[1] for cat in categories]
        
        return jsonify({
            'labels': labels,
            'data': data
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
