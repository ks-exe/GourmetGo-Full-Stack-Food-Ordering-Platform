import React, { useState, useEffect } from 'react';
import { User, Settings, Package, Heart, LogOut, MapPin, Phone, Mail, ChevronRight, Edit2, Clock } from 'lucide-react';

const Profile = ({ user, onLogout }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetch(`http://localhost:5000/api/orders/user/${user.id}`)
        .then(res => res.json())
        .then(data => setOrders(data))
        .catch(err => console.error(err));
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="profile-page section-padding fade-in">
      <div className="container">
        <div className="profile-layout grid gap-12">
          {/* Sidebar */}
          <div className="profile-sidebar">
            <div className="user-profile-card">
              <div className="avatar-section">
                <div className="avatar-inner">
                  <User size={48} />
                </div>
                <button className="edit-avatar-btn"><Edit2 size={16} /></button>
              </div>
              <div className="user-basics mt-6 text-center">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
                <div className="member-badge mt-2">Gold Member</div>
              </div>
            </div>
            
            <nav className="profile-menu mt-8">
              <button className="menu-item active">
                <Package size={20} /> 
                <span>My Orders</span>
                <ChevronRight size={16} className="ml-auto" />
              </button>
              <button className="menu-item">
                <Heart size={20} /> 
                <span>Wishlist</span>
                <ChevronRight size={16} className="ml-auto" />
              </button>
              <button className="menu-item">
                <Settings size={20} /> 
                <span>Account Settings</span>
                <ChevronRight size={16} className="ml-auto" />
              </button>
              <button className="menu-item logout" onClick={onLogout}>
                <LogOut size={20} /> 
                <span>Sign Out</span>
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="profile-main">
            <div className="content-card">
              <div className="card-header flex justify-between items-center mb-8">
                <div>
                  <h2>Personal <span>Information</span></h2>
                  <p>Manage your personal details and addresses</p>
                </div>
                <button className="edit-profile-btn">Edit Profile</button>
              </div>

              <div className="info-grid-premium grid gap-6">
                <div className="premium-info-item">
                  <div className="info-icon"><User size={20} /></div>
                  <div className="info-body">
                    <label>Full Name</label>
                    <p>{user.name}</p>
                  </div>
                </div>
                <div className="premium-info-item">
                  <div className="info-icon"><Mail size={20} /></div>
                  <div className="info-body">
                    <label>Email Address</label>
                    <p>{user.email}</p>
                  </div>
                </div>
                <div className="premium-info-item">
                  <div className="info-icon"><Phone size={20} /></div>
                  <div className="info-body">
                    <label>Phone Number</label>
                    <p>+92 300 1234567</p>
                  </div>
                </div>
                <div className="premium-info-item full">
                  <div className="info-icon"><MapPin size={20} /></div>
                  <div className="info-body">
                    <label>Default Delivery Address</label>
                    <p>House #42, Street 7, Gulberg III, Lahore, Pakistan</p>
                  </div>
                </div>
              </div>

              <div className="recent-activity mt-12 pt-12 border-t border-gray-100">
                <h3>Order History</h3>
                
                {orders.length > 0 ? (
                  <div className="orders-list mt-6 grid gap-6">
                    {orders.map(order => (
                      <div key={order._id} className="order-history-card">
                        <div className="order-history-header flex justify-between items-center mb-4">
                          <div>
                            <span className="order-id">#GOURMET-{order._id.substring(order._id.length - 6).toUpperCase()}</span>
                            <span className="order-date ml-4 text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <span className={`order-status badge-${order.status.replace(/\s+/g, '-').toLowerCase()}`}>
                            {order.status}
                          </span>
                        </div>
                        
                        <div className="order-history-items">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="history-item flex justify-between">
                              <span>{item.quantity}x {item.name}</span>
                              <span className="font-semibold">Rs. {item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="order-history-footer flex justify-between mt-4 pt-4 border-t border-gray-100">
                          <span className="text-gray-500 text-sm flex items-center gap-2">
                            <MapPin size={14} /> {order.deliveryAddress}
                          </span>
                          <span className="font-bold text-primary">Total: Rs. {order.totalAmount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="order-placeholder-premium text-center py-16">
                    <div className="icon-bg-muted">
                      <Package size={40} />
                    </div>
                    <h4>No orders yet</h4>
                    <p>Looks like you haven't placed any orders. Discover our menu and start your first order!</p>
                    <button className="primary-btn mt-6">Browse Menu</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .profile-layout { grid-template-columns: 350px 1fr; align-items: start; }
        
        .user-profile-card { background: white; padding: 3rem 2rem; border-radius: 2.5rem; border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .avatar-section { position: relative; width: 120px; height: 120px; margin: 0 auto; }
        .avatar-inner { width: 100%; height: 100%; background: var(--accent); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .edit-avatar-btn { position: absolute; bottom: 0; right: 0; background: var(--primary); color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        
        .user-basics h3 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.25rem; }
        .user-basics p { color: var(--text-muted); font-size: 0.9rem; font-weight: 600; }
        .member-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 0.4rem 1rem; border-radius: 50px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }

        .profile-menu { background: white; border-radius: 2rem; border: 1px solid var(--border); overflow: hidden; padding: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .menu-item { width: 100%; display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; border-radius: 1rem; border: none; background: transparent; cursor: pointer; transition: var(--transition); font-weight: 700; color: var(--text-muted); font-size: 1rem; }
        .menu-item:hover { background: var(--bg-main); color: var(--primary); padding-left: 2rem; }
        .menu-item.active { background: var(--accent); color: var(--primary); }
        .menu-item.logout { color: #ef4444; margin-top: 1rem; border-top: 1px solid var(--bg-main); padding-top: 1.5rem; }
        .menu-item.logout:hover { background: #fee2e2; color: #dc2626; }
        .ml-auto { margin-left: auto; }

        .content-card { background: white; padding: 4rem; border-radius: 3rem; border: 1px solid var(--border); box-shadow: 0 20px 50px rgba(0,0,0,0.06); }
        .card-header h2 { font-size: 2rem; font-weight: 800; }
        .card-header h2 span { color: var(--primary); }
        .card-header p { font-weight: 600; font-size: 0.9rem; }
        
        .edit-profile-btn { background: var(--bg-main); color: var(--text-main); padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700; border: 1px solid var(--border); transition: var(--transition); }
        .edit-profile-btn:hover { border-color: var(--primary); color: var(--primary); }

        .info-grid-premium { grid-template-columns: 1fr 1fr; }
        .premium-info-item { display: flex; gap: 1.5rem; padding: 2rem; background: var(--bg-main); border-radius: 1.5rem; border: 1px solid transparent; transition: var(--transition); }
        .premium-info-item:hover { background: white; border-color: var(--primary); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .premium-info-item.full { grid-column: span 2; }
        
        .info-icon { width: 48px; height: 48px; background: white; color: var(--primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); flex-shrink: 0; }
        .info-body label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.25rem; letter-spacing: 0.5px; }
        .info-body p { font-weight: 700; color: var(--text-main); font-size: 1.1rem; margin: 0; }

        .order-placeholder-premium { border: 2px dashed var(--border); border-radius: 2rem; margin-top: 2rem; }
        .icon-bg-muted { width: 80px; height: 80px; background: var(--bg-main); color: var(--text-muted); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
        .order-placeholder-premium h4 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; }
        .order-placeholder-premium p { max-width: 400px; margin: 0 auto; color: var(--text-muted); font-weight: 600; line-height: 1.6; }

        .order-history-card { background: white; border: 1px solid var(--border); border-radius: 1.5rem; padding: 1.5rem; transition: var(--transition); }
        .order-history-card:hover { border-color: var(--primary); box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
        .order-id { font-weight: 800; color: var(--text-main); }
        .history-item { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 0.5rem; }
        
        .order-status { padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .badge-pending { background: #fef3c7; color: #b45309; }
        .badge-preparing { background: #e0e7ff; color: #4338ca; }
        .badge-out-for-delivery { background: #fce7f3; color: #be185d; }
        .badge-delivered { background: #d1fae5; color: #047857; }
        .badge-cancelled { background: #fee2e2; color: #b91c1c; }

        @media (max-width: 1280px) {
          .profile-layout { grid-template-columns: 1fr; }
          .profile-sidebar { max-width: 400px; margin: 0 auto; width: 100%; }
        }
        @media (max-width: 768px) {
          .info-grid-premium { grid-template-columns: 1fr; }
          .premium-info-item.full { grid-column: span 1; }
          .content-card { padding: 2rem; }
        }
      `}</style>
    </div>
  );
};

export default Profile;
