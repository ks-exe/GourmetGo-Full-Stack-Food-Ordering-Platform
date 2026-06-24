import React from 'react';
import { ShoppingCart, Star, Heart } from 'lucide-react';

const ProductCard = ({ product, onAddToCart, onToggleWishlist, isWishlisted }) => {
  const handleImageError = (e) => {
    e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800"; // Stable Salad fallback
  };

  return (
    <div className="product-card fade-in">
      <div className="product-image">
        <img 
          src={product.image} 
          alt={product.name} 
          onError={handleImageError}
          loading="lazy"
        />
        <div className="product-category-tag">{product.category}</div>
        <button 
          className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
          onClick={() => onToggleWishlist(product)}
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          <Heart size={20} fill={isWishlisted ? "var(--primary)" : "none"} color={isWishlisted ? "var(--primary)" : "var(--text-main)"} />
        </button>
      </div>
      
      <div className="product-info">
        <div className="flex justify-between items-center mb-2">
          <div className="rating flex items-center gap-1">
            <Star size={14} fill="var(--primary)" color="var(--primary)" />
            <span>4.5</span>
          </div>
        </div>
        
        <h3>{product.name}</h3>
        <p className="product-desc">{product.description}</p>
        
        <div className="product-footer flex justify-between items-center mt-4">
          <span className="price">Rs. {product.price.toLocaleString()}</span>
          <button 
            className="add-to-cart-btn" 
            onClick={() => onAddToCart(product)}
            title="Add to Cart"
          >
            <ShoppingCart size={18} />
            <span>Add</span>
          </button>
        </div>
      </div>

      <style>{`
        .product-card {
          background: white;
          border-radius: var(--radius);
          overflow: hidden;
          border: 1px solid var(--border);
          transition: var(--transition);
          position: relative;
        }
        .product-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          border-color: var(--primary);
        }
        
        .product-image {
          height: 200px;
          position: relative;
          overflow: hidden;
        }
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .product-card:hover .product-image img {
          transform: scale(1.1);
        }
        
        .product-category-tag {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: rgba(255, 255, 255, 0.9);
          padding: 0.25rem 0.75rem;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary);
          backdrop-filter: blur(4px);
        }
        
        .wishlist-btn {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          padding: 0.5rem;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
          backdrop-filter: blur(4px);
        }
        .wishlist-btn:hover {
          transform: scale(1.1);
        }
        .wishlist-btn.active {
          background: var(--accent);
        }
        
        .product-info { padding: 1.5rem; }
        .product-info h3 { font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-main); font-weight: 700; }
        .product-desc { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; height: 3rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        
        .rating { background: var(--accent); padding: 0.2rem 0.6rem; border-radius: 50px; font-size: 0.75rem; font-weight: 700; color: var(--primary); }
        
        .price { font-size: 1.25rem; font-weight: 800; color: var(--text-main); }
        
        .add-to-cart-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0.6rem 1.25rem;
          border-radius: 50px;
          cursor: pointer;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: var(--transition);
        }
        .add-to-cart-btn:hover { background: var(--primary-hover); box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3); }
        .add-to-cart-btn span { font-size: 0.9rem; }
      `}</style>
    </div>
  );
};

export default ProductCard;
