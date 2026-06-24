import React from 'react';
import ProductCard from '../components/ProductCard';

const Wishlist = ({ wishlistItems, onAddToCart, onToggleWishlist }) => {
  return (
    <div className="wishlist-page section-padding fade-in">
      <div className="container">
        <div className="text-center mb-12">
          <span className="badge">Your Favorites</span>
          <h2>My <span>Wishlist</span></h2>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center empty-state mt-12">
            <h3>Your wishlist is empty</h3>
            <p className="text-muted mt-4">Browse our menu and click the heart icon to save your favorite dishes here.</p>
          </div>
        ) : (
          <div className="menu-grid grid gap-8">
            {wishlistItems.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                isWishlisted={true}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .empty-state h3 { font-size: 1.5rem; color: var(--text-main); }
        .text-muted { color: var(--text-muted); }
        .badge { display: inline-block; padding: 0.5rem 1rem; background: var(--accent); color: var(--primary); border-radius: 50px; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
      `}</style>
    </div>
  );
};

export default Wishlist;
