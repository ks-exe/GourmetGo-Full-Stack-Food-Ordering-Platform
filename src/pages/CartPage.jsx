import React, { useState } from 'react';
import CartItem from '../components/CartItem';
import { ShoppingBag, ArrowLeft, CheckCircle } from 'lucide-react';

const CartPage = ({ user, cart, onUpdateQuantity, onRemove, onBackToMenu, onClearCart, onRequestLogin }) => {
  const [isOrdered, setIsOrdered] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 0 ? 250 : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (!user) {
      onRequestLogin();
      return;
    }
    
    setLoading(true);
    setCheckoutError(null);
    try {
      const orderData = {
        userId: user.id,
        customerName: user.name,
        items: cart,
        totalAmount: total
      };
      
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to place order. Please try again.');
      }
      
      const savedOrder = await res.json();
      setOrderId(savedOrder._id.substring(savedOrder._id.length - 6).toUpperCase()); // Short ID for display
      setIsOrdered(true);
      onClearCart();
    } catch (err) {
      console.error(err);
      setCheckoutError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isOrdered) {
    return (
      <div className="cart-page section-padding fade-in">
        <div className="container text-center">
          <div className="order-success-card">
            <div className="success-icon">
              <CheckCircle size={80} color="#059669" />
            </div>
            <h1>Order <span>Placed!</span></h1>
            <p>Thank you for your order. Your delicious food is being prepared and will be delivered within 30-45 minutes.</p>
            <div className="order-details-box mt-8">
              <p>Order ID: <strong>#GOURMET-{orderId}</strong></p>
              <p>Delivery Address: <strong>Gulberg III, Lahore</strong></p>
            </div>
            <button className="primary-btn mt-8" onClick={onBackToMenu}>Back to Menu</button>
          </div>
        </div>

        <style>{`
          .order-success-card { background: white; padding: 4rem; border-radius: 2rem; box-shadow: var(--shadow); max-width: 600px; margin: 0 auto; }
          .success-icon { margin-bottom: 2rem; }
          .order-details-box { background: var(--bg-main); padding: 2rem; border-radius: 1rem; border: 1px solid var(--border); }
          .order-details-box p { margin-bottom: 0.5rem; font-size: 1rem; }
          .order-details-box strong { color: var(--text-main); }
          .mt-8 { margin-top: 2rem; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="cart-page section-padding fade-in">
      <div className="container">
        <div className="section-header mb-12">
          <h2>Your <span>Shopping Cart</span></h2>
          <p>You have {cart.length} items in your cart.</p>
        </div>

        <div className="cart-layout grid gap-12">
          <div className="cart-items-section">
            {cart.length > 0 ? (
              <div className="cart-list grid gap-6">
                {cart.map((item) => (
                  <CartItem 
                    key={item.id} 
                    item={item} 
                    onUpdateQuantity={onUpdateQuantity}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-cart text-center py-12">
                <div className="icon-circle mb-6">
                  <ShoppingBag size={48} />
                </div>
                <h3>Your cart is empty</h3>
                <p>Looks like you haven't added anything to your cart yet.</p>
                <button className="primary-btn mt-6" onClick={onBackToMenu}>Start Ordering</button>
              </div>
            )}
          </div>

          <div className="cart-summary-section">
            <div className="summary-card">
              <h3>Order Summary</h3>
              <div className="summary-details mt-6">
                <div className="flex justify-between mb-4">
                  <span>Subtotal</span>
                  <span className="font-bold">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span>Delivery Fee</span>
                  <span className="font-bold">Rs. {deliveryFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mb-6 divider">
                  <span>Tax (GST)</span>
                  <span className="text-green-600 font-bold">Included</span>
                </div>
                <div className="flex justify-between total-row pt-6">
                  <span>Total Amount</span>
                  <span className="total-price">Rs. {total.toLocaleString()}</span>
                </div>
              </div>
              
              {checkoutError && (
                <div className="checkout-error" role="alert">
                  <span>{checkoutError}</span>
                  <button className="dismiss-error" onClick={() => setCheckoutError(null)}>&times;</button>
                </div>
              )}

              <button 
                className={`checkout-btn mt-8 ${cart.length === 0 ? 'disabled' : ''}`}
                disabled={cart.length === 0 || loading}
                onClick={handleCheckout}
              >
                {loading ? 'Processing...' : 'Proceed to Checkout'}
              </button>
              
              <div className="payment-icons flex justify-center gap-4 mt-6">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" width="40" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" width="40" />
                <span>Cash on Delivery</span>
              </div>
            </div>
            
            <button className="back-link flex items-center justify-center gap-2 mt-6" onClick={onBackToMenu}>
              <ArrowLeft size={18} /> Continue Shopping
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .cart-layout { grid-template-columns: 1.5fr 1fr; align-items: start; }
        
        .empty-cart { background: white; padding: 4rem; border-radius: var(--radius); border: 2px dashed var(--border); }
        .icon-circle { width: 100px; height: 100px; background: var(--accent); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
        
        .summary-card { background: white; padding: 2.5rem; border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow); position: sticky; top: 100px; }
        .summary-card h3 { font-size: 1.5rem; border-bottom: 2px solid var(--bg-main); padding-bottom: 1rem; }
        
        .divider { border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
        .font-bold { font-weight: 700; color: var(--text-main); }
        .text-green-600 { color: #059669; }
        
        .total-row { border-top: 2px solid var(--bg-main); }
        .total-row span:first-child { font-weight: 700; font-size: 1.1rem; }
        .total-price { font-size: 1.75rem; font-weight: 800; color: var(--primary); }
        
        .checkout-btn { width: 100%; background: var(--primary); color: white; padding: 1.25rem; border-radius: 50px; font-weight: 700; font-size: 1.1rem; transition: var(--transition); }
        .checkout-btn:hover:not(.disabled) { background: var(--primary-hover); transform: translateY(-3px); box-shadow: 0 10px 20px rgba(249, 115, 22, 0.3); }
        .checkout-btn.disabled { opacity: 0.5; cursor: not-allowed; }
        
        .checkout-error { background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; padding: 1rem 1.25rem; border-radius: 0.75rem; margin-top: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; font-size: 0.9rem; font-weight: 500; }
        .dismiss-error { background: none; border: none; color: #dc2626; font-size: 1.25rem; cursor: pointer; padding: 0; line-height: 1; }
        
        .back-link { color: var(--text-muted); font-weight: 600; cursor: pointer; transition: var(--transition); }
        .back-link:hover { color: var(--primary); }

        .payment-icons { opacity: 0.6; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); align-items: center; }

        @media (max-width: 1024px) {
          .cart-layout { grid-template-columns: 1fr; }
          .summary-card { position: static; }
        }
      `}</style>
    </div>
  );
};

export default CartPage;
