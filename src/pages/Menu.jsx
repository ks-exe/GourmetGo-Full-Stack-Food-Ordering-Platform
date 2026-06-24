import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import CategoryFilter from '../components/CategoryFilter';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';

const Menu = ({ 
  products, 
  categories, 
  activeCategory, 
  onCategoryChange, 
  onAddToCart,
  onToggleWishlist,
  wishlist,
  searchQuery,
  productError,
  onRetryProducts
}) => {
  const [sortBy, setSortBy] = useState('default');
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  // Fetch ML recommendations when user searches
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length >= 2) {
      setRecLoading(true);
      fetch(`http://localhost:5001/api/ml/recommendations?query=${encodeURIComponent(trimmedQuery)}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setRecommendations(data);
          } else {
            setRecommendations([]);
          }
        })
        .catch(err => {
          console.error("Failed to fetch ML recommendations:", err);
          setRecommendations([]);
        })
        .finally(() => setRecLoading(false));
    } else {
      setRecommendations([]);
    }
  }, [searchQuery]);

  // Filter by category and search query
  let processedProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort products
  if (sortBy === 'price-low') {
    processedProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    processedProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'name-asc') {
    processedProducts.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'name-desc') {
    processedProducts.sort((a, b) => b.name.localeCompare(a.name));
  }

  return (
    <div className="menu-page section-padding fade-in">
      <div className="container">
        <div className="menu-header mb-12 text-center">
          <span className="badge">Gourmet Selection</span>
          <h2 className="text-4xl font-bold mt-4">Discover Our <span>Culinary Art</span></h2>
          <p className="max-width-600 mx-auto mt-4 text-gray-500">From the streets of Lahore to global kitchens, we bring you the finest flavors crafted with precision and passion.</p>
        </div>

        <div className="filter-controls-wrapper mb-12">
          <div className="category-wrapper">
            <CategoryFilter 
              categories={categories} 
              activeCategory={activeCategory} 
              onCategoryChange={onCategoryChange} 
            />
          </div>
          
          <div className="sort-wrapper">
            <div className="sort-icon-bg">
              <SlidersHorizontal size={18} />
            </div>
            <select 
              className="sort-select" 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">Sort By: Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
              <option value="name-desc">Name: Z to A</option>
            </select>
          </div>
        </div>

        {products.length === 0 && productError ? (
          <div className="empty-state-premium py-24 text-center">
            <div className="icon-search-bg mb-6 error-icon-bg">
              <Search size={48} />
            </div>
            <h3>Unable to Load Products</h3>
            <p>{productError}</p>
            <button className="primary-btn mt-8" onClick={onRetryProducts}>Retry</button>
          </div>
        ) : processedProducts.length > 0 ? (
          <div className="products-grid-container">
            <div className="products-grid">
              {processedProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={onAddToCart} 
                  onToggleWishlist={onToggleWishlist}
                  isWishlisted={wishlist?.some(w => w.id === product.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state-premium py-24 text-center">
            <div className="icon-search-bg mb-6">
              <Search size={48} />
            </div>
            <h3>No Flavors Found</h3>
            <p>We couldn't find any dish matching "{searchQuery}". Try exploring our other categories!</p>
            <button className="primary-btn mt-8" onClick={() => { onCategoryChange('All'); setSortBy('default'); }}>Reset Filters</button>
          </div>
        )}

        {/* AI Recommendations Display */}
        {searchQuery.trim().length >= 2 && (
          <div className="ai-recommendations-wrapper mt-16 pt-12 border-t border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <div className="rec-header">
                <span className="badge-ml flex items-center gap-1.5">
                  <Sparkles size={14} /> Smart AI recommendations
                </span>
                <h3 className="text-3xl font-extrabold mt-2">Dishes You <span>May Also Like</span></h3>
                <p className="text-gray-500 mt-1">Based on content similarity and popularity history.</p>
              </div>
            </div>

            {recLoading ? (
              <div className="text-center py-12 text-gray-500">
                <div className="spinner mb-2"></div>
                Analyzing flavors...
              </div>
            ) : recommendations.length > 0 ? (
              <div className="products-grid">
                {recommendations.map(product => (
                  <ProductCard 
                    key={`rec-${product.id}`} 
                    product={product} 
                    onAddToCart={onAddToCart} 
                    onToggleWishlist={onToggleWishlist}
                    isWishlisted={wishlist?.some(w => w.id === product.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border border-dashed">
                No related recommendations available for this query.
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .badge { display: inline-block; padding: 0.5rem 1rem; background: var(--accent); color: var(--primary); border-radius: 50px; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
        
        .badge-ml {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          background: #f3e8ff;
          color: #7c3aed;
          border-radius: 50px;
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .text-4xl { font-size: 3rem; }
        .text-3xl { font-size: 2.25rem; }
        .font-bold { font-weight: 800; }
        .font-extrabold { font-weight: 850; }
        .mt-4 { margin-top: 1rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-8 { margin-top: 2rem; }
        .mt-16 { margin-top: 4rem; }
        .pt-12 { padding-top: 3rem; }
        .border-t { border-top: 1px solid var(--border); }
        .mb-12 { margin-bottom: 3rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .max-width-600 { max-width: 600px; }

        .menu-header h2 span, .rec-header h3 span { color: var(--primary); }
        
        .filter-controls-wrapper { display: flex; flex-direction: column; gap: 1.5rem; align-items: center; }
        .category-wrapper { width: 100%; display: flex; justify-content: center; }
        
        .sort-wrapper { align-self: flex-end; display: flex; align-items: center; background: white; border: 1px solid var(--border); border-radius: 50px; padding: 0.25rem 1rem 0.25rem 0.25rem; box-shadow: 0 4px 15px rgba(0,0,0,0.02); position: relative; z-index: 10; margin-right: 1rem; }
        .sort-icon-bg { background: var(--bg-main); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-main); }
        .sort-select { border: none; background: transparent; outline: none; padding: 0.5rem 1rem; font-weight: 600; color: var(--text-main); cursor: pointer; appearance: none; -webkit-appearance: none; -moz-appearance: none; font-size: 0.95rem; }
        
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2.5rem;
        }

        .empty-state-premium {
          background: white;
          border-radius: 3rem;
          border: 2px dashed var(--border);
          padding: 6rem 2rem;
        }
        .icon-search-bg {
          width: 100px; height: 100px; background: var(--bg-main); color: var(--text-muted); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;
        }
        .empty-state-premium h3 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; }
        .empty-state-premium p { font-size: 1.1rem; color: var(--text-muted); max-width: 450px; margin: 0 auto; }
        .error-icon-bg { background: #fef2f2; color: #dc2626; }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(124, 58, 237, 0.1);
          border-left-color: #7c3aed;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .products-grid { grid-template-columns: 1fr; }
          .menu-header h2 { font-size: 2.5rem; }
          .rec-header h3 { font-size: 1.75rem; }
          .sort-wrapper { align-self: center; margin-right: 0; }
        }
      `}</style>
    </div>
  );
};

export default Menu;
