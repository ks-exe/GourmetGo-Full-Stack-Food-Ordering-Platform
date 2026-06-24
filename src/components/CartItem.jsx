import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <div className="cart-item fade-in">
      <div className="item-details flex items-center gap-4">
        <img src={item.image} alt={item.name} className="item-img" />
        <div>
          <h3>{item.name}</h3>
          <p>Rs. {item.price.toLocaleString()}</p>
        </div>
      </div>

      <div className="item-actions flex items-center gap-8">
        <div className="quantity-controls flex items-center gap-4">
          <button 
            className="qty-btn" 
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus size={16} />
          </button>
          <span className="quantity">{item.quantity}</span>
          <button 
            className="qty-btn" 
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          >
            <Plus size={16} />
          </button>
        </div>
        
        <div className="item-total">
          <p>Rs. {(item.price * item.quantity).toLocaleString()}</p>
        </div>

        <button className="remove-btn" onClick={() => onRemove(item.id)}>
          <Trash2 size={20} />
        </button>
      </div>

      <style jsx>{`
        .cart-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: white;
          border-radius: var(--radius);
          margin-bottom: 1rem;
          border: 1px solid var(--border);
        }
        .item-img {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 12px;
        }
        .qty-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--bg-main);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-main);
        }
        .qty-btn:hover:not(:disabled) {
          background: var(--primary);
          color: white;
        }
        .qty-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .quantity {
          font-weight: 600;
          min-width: 20px;
          text-align: center;
        }
        .item-total p {
          font-weight: 700;
          color: var(--text-main);
          font-size: 1.1rem;
          min-width: 120px;
          text-align: right;
        }
        .remove-btn {
          color: #ef4444;
          background: transparent;
          padding: 0.5rem;
          border-radius: 8px;
        }
        .remove-btn:hover {
          background: #fee2e2;
        }

        @media (max-width: 640px) {
          .cart-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .item-actions {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
};

export default CartItem;
