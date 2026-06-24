import React, { useState, useEffect } from 'react';
import { ArrowRight, Utensils, Clock, ShieldCheck, Star, Heart, Flame, Sparkles } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const Home = ({ onExploreMenu, onAddToCart, onToggleWishlist, wishlist }) => {
  const [trendingFoods, setTrendingFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5001/api/ml/trending')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTrendingFoods(data);
        }
      })
      .catch(err => console.error("Error fetching trending foods:", err))
      .finally(() => setLoading(false));
  }, []);

  const categoriesTeaser = [
    { name: "Fast Food", icon: "🍔", count: "10+ Items", color: "#fee2e2" },
    { name: "BBQ", icon: "🍖", count: "10+ Items", color: "#ffedd5" },
    { name: "Desi", icon: "🥘", count: "10+ Items", color: "#fef9c3" },
    { name: "Ice Cream", icon: "🍦", count: "10+ Items", color: "#dcfce7" }
  ];

  return (
    <div className="home-page fade-in">
      {/* Hero Section */}
      <section className="hero">
        <div className="container grid gap-8">
          <div className="hero-content">
            <span className="badge">Best Food in Pakistan</span>
            <h1>Authentic Flavors, Delivered <span>Today</span>.</h1>
            <p>Experience the finest gourmet cuisine and traditional Pakistani dishes from the comfort of your home. Fresh ingredients, expert chefs.</p>
            <div className="hero-btns flex gap-4">
              <button className="primary-btn" onClick={onExploreMenu}>
                Order Now <ArrowRight size={20} />
              </button>
              <button className="secondary-btn" onClick={onExploreMenu}>Explore Menu</button>
            </div>
            
            <div className="hero-stats flex gap-8 mt-12">
              <div className="stat">
                <h3>50k+</h3>
                <p>Happy Customers</p>
              </div>
              <div className="stat">
                <h3>4.9/5</h3>
                <p>Average Rating</p>
              </div>
              <div className="stat">
                <h3>30m</h3>
                <p>Avg Delivery</p>
              </div>
            </div>
          </div>
          
          <div className="hero-image">
            <div className="image-stack">
              <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200" alt="Delicious Food" />
              <div className="floating-card top">
                <Star size={20} fill="#fbbf24" color="#fbbf24" />
                <div>
                  <h4>Top Rated</h4>
                  <p>Traditional BBQ</p>
                </div>
              </div>
              <div className="floating-card bottom">
                <Heart size={20} fill="#ef4444" color="#ef4444" />
                <div>
                  <h4>Fresh Always</h4>
                  <p>100% Organic</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="home-categories section-padding">
        <div className="container">
          <div className="section-header text-center mb-12">
            <h2>Explore Our <span>Categories</span></h2>
            <p>From fast food to traditional desi cuisine, we have it all.</p>
          </div>
          
          <div className="categories-grid grid gap-6">
            {categoriesTeaser.map((cat, idx) => (
              <div key={idx} className="cat-teaser-card" style={{ background: cat.color }}>
                <div className="cat-icon">{cat.icon}</div>
                <h3>{cat.name}</h3>
                <p>{cat.count}</p>
                <button onClick={onExploreMenu}>Explore <ArrowRight size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Trending Foods Section (ML Engine Powered) */}
      {!loading && trendingFoods.length > 0 && (
        <section className="trending-foods section-padding bg-gray-50 border-y border-gray-100">
          <div className="container">
            <div className="flex flex-col items-center text-center mb-12">
              <span className="badge-trending flex items-center gap-1">
                <Flame size={16} fill="#f97316" color="#f97316" /> Popular Demand
              </span>
              <h2 className="text-4xl font-bold mt-4">Trending <span>Flavors</span></h2>
              <p className="max-width-600 mx-auto mt-4 text-gray-500">
                Dishes with the highest ordering volume calculated by our ML popularity engine.
              </p>
            </div>

            <div className="products-grid">
              {trendingFoods.map(product => (
                <ProductCard 
                  key={`trending-${product.id}`} 
                  product={product} 
                  onAddToCart={onAddToCart} 
                  onToggleWishlist={onToggleWishlist}
                  isWishlisted={wishlist?.some(w => w.id === product.id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="features section-padding">
        <div className="container grid gap-8">
          <div className="feature-card">
            <div className="icon-wrapper"><Utensils size={32} /></div>
            <h3>Premium Quality</h3>
            <p>We use only the freshest and highest quality ingredients for all our dishes.</p>
          </div>
          <div className="feature-card">
            <div className="icon-wrapper"><Clock size={32} /></div>
            <h3>Quick Service</h3>
            <p>Our dedicated delivery team ensures your food arrives hot and fresh.</p>
          </div>
          <div className="feature-card">
            <div className="icon-wrapper"><ShieldCheck size={32} /></div>
            <h3>Hygiene First</h3>
            <p>Strict hygiene standards and contactless delivery for your peace of mind.</p>
          </div>
        </div>
      </section>

      <style>{`
        .hero {
          padding: 6rem 0;
          background: linear-gradient(135deg, #fff 0%, #fff7ed 100%);
          overflow: hidden;
        }
        .hero .grid {
          grid-template-columns: 1fr 1fr;
          align-items: center;
        }
        .hero-content h1 {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -1px;
        }
        .hero-content h1 span { color: var(--primary); }
        .hero-content p {
          font-size: 1.15rem;
          margin-bottom: 2.5rem;
          max-width: 500px;
          color: var(--text-muted);
        }
        .badge {
          display: inline-block;
          padding: 0.6rem 1.25rem;
          background: var(--accent);
          color: var(--primary);
          border-radius: 50px;
          font-weight: 700;
          font-size: 0.8rem;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .badge-trending {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1.25rem;
          background: #ffebe6;
          color: #ff3b00;
          border-radius: 50px;
          font-weight: 700;
          font-size: 0.8rem;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .hero-btns { margin-bottom: 3rem; }
        .primary-btn {
          background: var(--primary);
          color: white;
          padding: 1.25rem 2.5rem;
          border-radius: 50px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 1.1rem;
        }
        .primary-btn:hover { background: var(--primary-hover); transform: translateY(-3px); box-shadow: 0 10px 25px rgba(249, 115, 22, 0.4); }
        
        .secondary-btn {
          background: white;
          color: var(--text-main);
          padding: 1.25rem 2.5rem;
          border-radius: 50px;
          font-weight: 700;
          border: 2px solid var(--border);
          font-size: 1.1rem;
        }
        .secondary-btn:hover { border-color: var(--primary); color: var(--primary); }

        .hero-stats h3 { font-size: 2rem; color: var(--text-main); margin-bottom: 0.25rem; }
        .hero-stats p { font-size: 0.9rem; font-weight: 600; }
        
        .hero-image { position: relative; }
        .image-stack { position: relative; width: 100%; max-width: 550px; margin: 0 auto; }
        .image-stack img {
          width: 100%;
          border-radius: 3rem;
          box-shadow: 0 30px 60px rgba(0,0,0,0.12);
          transform: rotate(-2deg);
        }
        .floating-card {
          position: absolute;
          background: white;
          padding: 1.25rem 1.75rem;
          border-radius: 1.5rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          gap: 1rem;
          z-index: 10;
          animation: float 4s ease-in-out infinite;
        }
        .floating-card.top { top: 2rem; right: -2rem; }
        .floating-card.bottom { bottom: 2rem; left: -2rem; animation-delay: 1s; }
        .floating-card h4 { font-weight: 800; font-size: 1rem; }
        .floating-card p { font-size: 0.8rem; font-weight: 600; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }

        .categories-grid { grid-template-columns: repeat(4, 1fr); }
        .cat-teaser-card {
          padding: 2.5rem;
          border-radius: 2rem;
          text-align: center;
          transition: var(--transition);
          cursor: pointer;
        }
        .cat-teaser-card:hover { transform: scale(1.05); box-shadow: 0 15px 30px rgba(0,0,0,0.05); }
        .cat-icon { font-size: 3.5rem; margin-bottom: 1.5rem; }
        .cat-teaser-card h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
        .cat-teaser-card p { font-weight: 600; color: rgba(0,0,0,0.5); margin-bottom: 1.5rem; }
        .cat-teaser-card button {
          background: white;
          padding: 0.75rem 1.5rem;
          border-radius: 50px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 auto;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 2.5rem;
        }

        .features .grid { grid-template-columns: repeat(3, 1fr); }
        .feature-card {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 2.5rem;
          transition: var(--transition);
          border: 1px solid var(--border);
        }
        .feature-card:hover { border-color: var(--primary); transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
        .icon-wrapper {
          width: 90px;
          height: 90px;
          background: var(--accent);
          color: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem;
        }
        .feature-card h3 { margin-bottom: 1rem; font-size: 1.5rem; }

        @media (max-width: 1024px) {
          .hero .grid { grid-template-columns: 1fr; text-align: center; gap: 5rem; }
          .hero-content h1 { font-size: 3.5rem; }
          .hero-content p { margin: 0 auto 2.5rem; }
          .hero-btns, .hero-stats { justify-content: center; }
          .categories-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .features .grid { grid-template-columns: 1fr; }
          .categories-grid { grid-template-columns: 1fr; }
          .products-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Home;
