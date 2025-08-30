# Enhanced features for Stock Inventory Management System

from flask import Blueprint, jsonify, request
from extensions import db
from models import Product, Stock, Order, OrderItem, Customer, GSTState
import qrcode
import io
import base64

# Create blueprint for enhanced features
enhanced_bp = Blueprint('enhanced', __name__, url_prefix='/api/enhanced')

@enhanced_bp.route('/low-stock-alerts')
def low_stock_alerts():
    """Get products that are below minimum stock level"""
    try:
        low_stock_products = db.session.query(
            Product.name, Product.sku, Stock.available_qty, Stock.min_qty
        ).join(Stock).filter(Stock.available_qty <= Stock.min_qty).all()
        
        alerts = []
        for product_name, sku, available, minimum in low_stock_products:
            alerts.append({
                'name': product_name,
                'sku': sku,
                'available_qty': available,
                'min_qty': minimum,
                'shortage': minimum - available
            })
        
        return jsonify(alerts)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@enhanced_bp.route('/profit-analytics')
def profit_analytics():
    """Calculate profit/loss analytics"""
    try:
        # Get all completed sales orders with their items
        sales_orders = Order.query.filter_by(order_type='sales', status='completed').all()
        
        total_revenue = 0
        total_cost = 0
        product_profits = {}
        
        for order in sales_orders:
            for item in order.items:
                product = item.product
                revenue = item.total_price
                cost = getattr(product, 'purchase_price', product.unit_price * 0.7) * item.quantity
                profit = revenue - cost
                
                total_revenue += revenue
                total_cost += cost
                
                if product.name not in product_profits:
                    product_profits[product.name] = {
                        'revenue': 0, 'cost': 0, 'profit': 0, 'units_sold': 0
                    }
                
                product_profits[product.name]['revenue'] += revenue
                product_profits[product.name]['cost'] += cost
                product_profits[product.name]['profit'] += profit
                product_profits[product.name]['units_sold'] += item.quantity
        
        # Top selling products
        top_products = sorted(
            product_profits.items(), 
            key=lambda x: x[1]['units_sold'], 
            reverse=True
        )[:10]
        
        return jsonify({
            'total_revenue': total_revenue,
            'total_cost': total_cost,
            'gross_profit': total_revenue - total_cost,
            'profit_margin': ((total_revenue - total_cost) / total_revenue * 100) if total_revenue > 0 else 0,
            'top_products': [{'name': name, **data} for name, data in top_products]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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

@enhanced_bp.route('/upi-qr/<int:order_id>')
def generate_invoice_qr(order_id):
    """Generate UPI QR code for invoice payment"""
    try:
        order = Order.query.get_or_404(order_id)
        total_amount = order.total_amount + order.gst_amount
        
        qr_code = generate_upi_qr(
            amount=total_amount,
            business_name="Your Business Name",
            order_number=order.order_number
        )
        
        return jsonify({
            'qr_code': qr_code,
            'amount': total_amount,
            'order_number': order.order_number
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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