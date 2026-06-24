import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Menu from './pages/Menu';
import CartPage from './pages/CartPage';
import About from './pages/About';
import Contact from './pages/Contact';
import Reviews from './pages/Reviews';
import Profile from './pages/Profile';
import Notification from './components/Notification';
import AuthModal from './components/AuthModal';
import Wishlist from './pages/Wishlist';
import AdminDashboard from './pages/AdminDashboard';
import { categories as staticCategories } from './data/products';

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(staticCategories);
  const [productError, setProductError] = useState(null);

  // Reusable function to fetch products from backend API
  const fetchProducts = () => {
    setProductError(null);
    fetch('http://localhost:5000/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
        setProductError(null);
      })
      .catch(err => {
        console.error("Failed to fetch products from backend.", err);
        setProductError('Failed to load products. Please try again.');
      });
  };

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);
  // --- State Management ---
  const [currentPage, setCurrentPage] = useState('home');
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('gourmet-go-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('gourmet-go-cart-pk-v3');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem('gourmet-go-wishlist');
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });
  const [sessionRestored, setSessionRestored] = useState(!currentUser);
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // --- Effects ---
  useEffect(() => {
    if (!sessionRestored) return;
    if (currentUser) {
      fetch(`http://localhost:5000/api/users/${currentUser.id}/cart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart })
      }).catch(console.error);
    } else {
      localStorage.setItem('gourmet-go-cart-pk-v3', JSON.stringify(cart));
    }
  }, [cart, currentUser, sessionRestored]);

  useEffect(() => {
    if (!sessionRestored) return;
    if (currentUser) {
      localStorage.setItem('gourmet-go-wishlist', JSON.stringify(wishlist));
      fetch(`http://localhost:5000/api/users/${currentUser.id}/wishlist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wishlist })
      }).catch(console.error);
    }
  }, [wishlist, currentUser, sessionRestored]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('gourmet-go-user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('gourmet-go-user');
    }
  }, [currentUser]);

  // Restore cart and wishlist from server when user is restored from localStorage on reload
  useEffect(() => {
    if (currentUser && currentUser.id) {
      fetch(`http://localhost:5000/api/users/${currentUser.id}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch user data');
          return res.json();
        })
        .then(data => {
          if (data.cart) {
            setCart(data.cart);
          }
          if (data.wishlist) {
            setWishlist(data.wishlist);
          }
        })
        .catch(err => console.error('Failed to restore user session data:', err))
        .finally(() => setSessionRestored(true));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Auth Handlers ---
  const handleSignup = async (userData) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up');
      }
      
      setCart(data.cart || []);
      setWishlist(data.wishlist || []);
      setCurrentUser(data);
      setShowAuthModal(false);
      setNotification(`Welcome, ${data.name}!`);
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw err;
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }

      setCart(data.cart || []);
      setWishlist(data.wishlist || []);
      setCurrentUser(data);
      setShowAuthModal(false);
      setNotification(`Welcome back, ${data.name}!`);
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw err;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentPage('home');
    setCart([]);
    setWishlist([]);
    localStorage.removeItem('gourmet-go-user');
    localStorage.removeItem('gourmet-go-cart-pk-v3');
    localStorage.removeItem('gourmet-go-wishlist');
    setNotification("Logged out successfully!");
  };

  // --- Handlers ---
  const addToCart = (product) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setNotification(`${product.name} added to cart!`);
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setCart(prevCart => 
      prevCart.map(item => item.id === id ? { ...item, quantity } : item)
    );
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const toggleWishlist = (product) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    const isWishlisted = wishlist.some(item => item.id === product.id);
    if (isWishlisted) {
      setWishlist(prev => prev.filter(item => item.id !== product.id));
      setNotification(`${product.name} removed from wishlist!`);
    } else {
      setWishlist(prev => [...prev, product]);
      setNotification(`${product.name} added to wishlist!`);
    }
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Home 
            onExploreMenu={() => setCurrentPage('menu')} 
            onAddToCart={addToCart} 
            onToggleWishlist={toggleWishlist}
            wishlist={wishlist}
          />
        );
      case 'menu':
        return (
          <Menu 
            products={products} 
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
            wishlist={wishlist}
            searchQuery={searchQuery}
            productError={productError}
            onRetryProducts={fetchProducts}
          />
        );
      case 'cart':
        return (
          <CartPage 
            user={currentUser}
            cart={cart} 
            onUpdateQuantity={updateQuantity} 
            onRemove={removeFromCart} 
            onBackToMenu={() => setCurrentPage('menu')} 
            onClearCart={() => setCart([])}
            onRequestLogin={() => setShowAuthModal(true)}
          />
        );
      case 'wishlist':
        return (
          <Wishlist 
            wishlistItems={wishlist}
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
          />
        );
      case 'about':
        return <About />;
      case 'contact':
        return <Contact onNotification={setNotification} />;
      case 'reviews':
        return <Reviews user={currentUser} onLoginRequest={() => setShowAuthModal(true)} />;
      case 'profile':
        return <Profile user={currentUser} onLogout={handleLogout} />;
      case 'admin':
        return (
          <AdminDashboard 
            user={currentUser} 
            products={products} 
            onProductsUpdate={setProducts} 
          />
        );
      default:
        return <Home onExploreMenu={() => setCurrentPage('menu')} />;
    }
  };

  return (
    <div className="app">
      <Navbar 
        cartCount={cartCount}
        wishlistCount={wishlist.length}
        onCartClick={() => setCurrentPage('cart')}
        onWishlistClick={() => setCurrentPage('wishlist')}
        onMenuClick={() => setCurrentPage('menu')}
        onHomeClick={() => setCurrentPage('home')}
        onPageChange={setCurrentPage}
        onSearch={setSearchQuery}
        searchValue={searchQuery}
        user={currentUser}
      />
      
      <main>
        {renderPage()}
      </main>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onLogin={handleLogin}
          onSignup={handleSignup}
        />
      )}

      {notification && (
        <Notification 
          message={notification} 
          onClose={() => setNotification(null)} 
        />
      )}

      <footer className="footer section-padding">
        <div className="container">
          <div className="footer-grid grid gap-8">
            <div className="footer-brand">
              <h2>Gourmet<span>Go</span></h2>
              <p>Bringing the finest Pakistani flavors and global favorites to your doorstep since 2020.</p>
            </div>
            <div className="footer-links">
              <h4>Quick Links</h4>
              <ul>
                <li onClick={() => setCurrentPage('home')}>Home</li>
                <li onClick={() => setCurrentPage('menu')}>Menu</li>
                <li onClick={() => setCurrentPage('about')}>About Us</li>
                <li onClick={() => {
                  if (currentUser) setCurrentPage('profile');
                  else setShowAuthModal(true);
                }}>My Profile</li>
              </ul>
            </div>
            <div className="footer-contact">
              <h4>Contact Us</h4>
              <p>123 Gourmet St, Lahore</p>
              <p>+92 300 1234567</p>
              <p>info@gourmetgo.com</p>
            </div>
          </div>
          <div className="footer-bottom text-center mt-8 pt-8">
            <p>&copy; 2026 GourmetGo. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        main { flex: 1; }
        .footer { background: #111827; color: #9ca3af; border-top: 1px solid #1f2937; }
        .footer-grid { grid-template-columns: 2fr 1fr 1.5fr; }
        .footer-brand h2 { color: white; margin-bottom: 1rem; }
        .footer-brand span { color: var(--primary); }
        .footer-links h4, .footer-contact h4 { color: white; margin-bottom: 1.5rem; }
        .footer-links ul li { margin-bottom: 0.75rem; cursor: pointer; transition: 0.3s; }
        .footer-links ul li:hover { color: var(--primary); transform: translateX(5px); }
        .footer-bottom { border-top: 1px solid #1f2937; }
        .text-center { text-align: center; }
        .mt-8 { margin-top: 2rem; }
        .pt-8 { padding-top: 2rem; }

        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

export default App;
