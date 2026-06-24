import React from 'react';
import { ShoppingCart, Search, UtensilsCrossed, User, LogIn, Heart } from 'lucide-react';

const Navbar = ({ cartCount, wishlistCount, onCartClick, onWishlistClick, onMenuClick, onHomeClick, onPageChange, onSearch, searchValue, user }) => {
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Left: Logo */}
        <div className="logo flex items-center gap-2" onClick={onHomeClick}>
          <div className="logo-icon">
            <UtensilsCrossed size={20} color="white" />
          </div>
          <h1>Gourmet<span>Go</span></h1>
        </div>

        {/* Center: Navigation Links */}
        <div className="nav-links-center">
          <button className="nav-link" onClick={onHomeClick}>Home</button>
          <button className="nav-link" onClick={onMenuClick}>Menu</button>
          <button className="nav-link" onClick={() => onPageChange('about')}>About</button>
          <button className="nav-link" onClick={() => onPageChange('reviews')}>Reviews</button>
          <button className="nav-link" onClick={() => onPageChange('contact')}>Contact</button>
        </div>

        {/* Right: Search, Cart, Profile */}
        <div className="nav-actions-right">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search food..." 
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>

          <div className="action-icons">
            {user ? (
              <div className="user-profile-nav" onClick={() => onPageChange('profile')}>
                <div className="avatar-small">
                  <User size={16} />
                </div>
                <span className="user-name-nav">{user.name.split(' ')[0]}</span>
              </div>
            ) : (
              <div className="icon-btn" onClick={() => onPageChange('profile')} title="Login">
                <LogIn size={22} />
              </div>
            )}
            
            {user?.isAdmin && (
              <button className="admin-nav-btn" onClick={() => onPageChange('admin')}>
                Admin Panel
              </button>
            )}
            
            <div className="icon-btn cart-btn" onClick={onWishlistClick} title="Wishlist">
              <Heart size={22} />
              {wishlistCount > 0 && <span className="cart-badge">{wishlistCount}</span>}
            </div>

            <div className="icon-btn cart-btn" onClick={onCartClick} title="Cart">
              <ShoppingCart size={22} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .navbar {
          background: white;
          padding: 0.75rem 0;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          border-bottom: 1px solid var(--border);
        }
        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 60px;
          gap: 1rem;
        }

        .logo { cursor: pointer; min-width: auto; }
        .logo h1 { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.5px; }
        .logo span { color: var(--primary); }
        .logo-icon { background: var(--primary); padding: 0.4rem; border-radius: 10px; display: flex; }

        .nav-links-center {
          display: flex;
          gap: 2rem;
          flex: 1;
          justify-content: center;
        }
        .nav-link { font-weight: 600; color: var(--text-main); background: transparent; font-size: 0.95rem; transition: var(--transition); position: relative; }
        .nav-link:after { content: ''; position: absolute; bottom: -5px; left: 0; width: 0; height: 2px; background: var(--primary); transition: var(--transition); }
        .nav-link:hover { color: var(--primary); }
        .nav-link:hover:after { width: 100%; }

        .nav-actions-right { display: flex; align-items: center; gap: 1rem; justify-content: flex-end; }

        .search-wrapper { background: var(--bg-main); padding: 0.5rem 1rem; border-radius: 50px; display: flex; align-items: center; width: 160px; border: 1px solid var(--border); transition: var(--transition); }
        .search-wrapper:focus-within { width: 200px; border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1); }
        .search-wrapper input { background: transparent; border: none; outline: none; margin-left: 0.5rem; width: 100%; font-size: 0.85rem; font-weight: 500; }
        
        .action-icons { display: flex; gap: 1rem; align-items: center; }
        .icon-btn { cursor: pointer; color: var(--text-main); transition: var(--transition); display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; }
        .icon-btn:hover { background: var(--accent); color: var(--primary); }

        .user-profile-nav { display: flex; align-items: center; gap: 0.75rem; background: var(--bg-main); padding: 0.4rem 1rem 0.4rem 0.4rem; border-radius: 50px; cursor: pointer; border: 1px solid var(--border); transition: var(--transition); }
        .user-profile-nav:hover { border-color: var(--primary); background: white; }
        .avatar-small { width: 32px; height: 32px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .user-name-nav { font-weight: 700; font-size: 0.85rem; color: var(--text-main); }

        .cart-btn { position: relative; }
        .cart-badge { position: absolute; top: 0; right: 0; background: var(--primary); color: white; font-size: 0.7rem; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; }

        .admin-nav-btn { background: #1f2937; color: white; border: none; padding: 0.4rem 1rem; border-radius: 50px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: 0.3s; }
        .admin-nav-btn:hover { background: var(--primary); }

        @media (max-width: 1024px) {
          .nav-links-center { gap: 1.5rem; }
          .search-wrapper { display: none; }
        }
        @media (max-width: 850px) {
          .nav-links-center { display: none; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
