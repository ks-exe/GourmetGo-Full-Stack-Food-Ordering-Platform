import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Package, MessageCircle, ShoppingBag, TrendingUp, AlertTriangle, BarChart3, Sun, Snowflake, CloudRain, Calendar } from 'lucide-react';

const AdminDashboard = ({ user, products, onProductsUpdate }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [productList, setProductList] = useState(products);
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // ML Prediction States
  const [weather, setWeather] = useState('Mild');
  const [temperature, setTemperature] = useState(25);
  const [weekend, setWeekend] = useState('No');
  const [occasion, setOccasion] = useState('None');
  const [predictions, setPredictions] = useState([]);
  const [predLoading, setPredLoading] = useState(false);
  const [predError, setPredError] = useState('');

  const [formData, setFormData] = useState({
    id: '', name: '', price: '', category: 'Fast Food', image: '', description: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setProductList(products);
  }, [products]);

  // Fetch handler for other tabs
  useEffect(() => {
    if (activeTab === 'orders') {
      fetch('http://localhost:5000/api/orders')
        .then(res => res.json())
        .then(data => setOrders(data))
        .catch(err => console.error(err));
    } else if (activeTab === 'messages') {
      fetch('http://localhost:5000/api/messages')
        .then(res => res.json())
        .then(data => setMessages(data))
        .catch(err => console.error(err));
    } else if (activeTab === 'predictions') {
      fetchPredictions();
    }
  }, [activeTab]);

  const fetchPredictions = () => {
    setPredLoading(true);
    setPredError('');
    fetch('http://localhost:5001/api/ml/predict-sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weather, temperature, weekend, occasion })
    })
      .then(res => {
        if (!res.ok) throw new Error("Flask ML server not responding or database is empty.");
        return res.json();
      })
      .then(data => {
        if (data && data.predictions) {
          setPredictions(data.predictions);
        } else {
          setPredictions([]);
        }
      })
      .catch(err => {
        console.error(err);
        setPredError("Make sure Python ML server is running on port 5001 and MongoDB contains products. " + err.message);
      })
      .finally(() => setPredLoading(false));
  };

  const handlePredictSubmit = (e) => {
    e.preventDefault();
    fetchPredictions();
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const resetForm = () => {
    setFormData({ id: '', name: '', price: '', category: 'Fast Food', image: '', description: '' });
    setEditingId(null);
    setShowForm(false);
    setFormError('');
  };

  const handleEdit = (product) => { setFormData(product); setEditingId(product.id); setShowForm(true); };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await fetch(`http://localhost:5000/api/products/${id}`, { method: 'DELETE' });
      const updatedList = productList.filter(p => p.id !== id);
      setProductList(updatedList);
      onProductsUpdate(updatedList);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    const url = editingId ? `http://localhost:5000/api/products/${editingId}` : 'http://localhost:5000/api/products';
    const method = editingId ? 'PUT' : 'POST';
    const finalData = { ...formData };
    if (!editingId) finalData.id = Date.now();

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(finalData) });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || data.error || 'Validation failed. Please check all fields.');
        return;
      }
      const updatedList = editingId ? productList.map(p => p.id === editingId ? data : p) : [...productList, data];
      setProductList(updatedList);
      onProductsUpdate(updatedList);
      resetForm();
    } catch (err) { 
      setFormError('Network error. Could not save product.');
    } finally { setLoading(false); }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) { console.error(err); }
  };

  // Temperature suggestion helper based on weather
  const handleWeatherChange = (e) => {
    const w = e.target.value;
    setWeather(w);
    if (w === 'Hot') setTemperature(38);
    else if (w === 'Cold') setTemperature(12);
    else if (w === 'Rainy') setTemperature(22);
    else setTemperature(25);
  };

  if (!user?.isAdmin) {
    return (
      <div className="section-padding text-center">
        <h2>Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  // Stock alert list filter
  const highDemandAlerts = predictions.filter(p => p.expected_sales >= 35);
  const maxExpectedSales = Math.max(...predictions.map(p => p.expected_sales), 1);

  return (
    <div className="admin-dashboard section-padding fade-in">
      <div className="container">
        <div className="mb-8">
          <span className="badge">Control Panel</span>
          <h2>Admin <span>Dashboard</span></h2>
        </div>

        {/* Tabs */}
        <div className="admin-tabs flex gap-4 mb-8 border-b border-gray-200 pb-4 overflow-x-auto">
          <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
            <ShoppingBag size={20} /> Products
          </button>
          <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <Package size={20} /> Orders
          </button>
          <button className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
            <MessageCircle size={20} /> Messages
          </button>
          <button className={`tab-btn ${activeTab === 'predictions' ? 'active' : ''}`} onClick={() => setActiveTab('predictions')}>
            <TrendingUp size={20} /> ML Demand Predictions
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            <div className="flex justify-end mb-6">
              <button className="primary-btn flex items-center gap-2" onClick={() => setShowForm(true)}>
                <Plus size={20} /> Add Product
              </button>
            </div>

            {showForm && (
              <div className="admin-form-container mb-12">
                <div className="flex justify-between items-center mb-6">
                  <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                  <button className="close-btn" onClick={resetForm}><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
                  {formError && (
                    <div className="col-span-2 form-error-banner">
                      <p className="text-red-600 font-semibold text-sm">{formError}</p>
                    </div>
                  )}
                  <div className="form-group col-span-2 sm-col-span-1">
                    <label>Product Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group col-span-2 sm-col-span-1">
                    <label>Price (Rs.)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} required />
                  </div>
                  <div className="form-group col-span-2 sm-col-span-1">
                    <label>Category</label>
                    <select name="category" value={formData.category} onChange={handleChange}>
                      <option value="Fast Food">Fast Food</option><option value="BBQ">BBQ</option><option value="Desi">Desi</option><option value="Special Dishes">Special Dishes</option><option value="Drinks">Drinks</option><option value="Ice Cream">Ice Cream</option><option value="Salad">Salad</option>
                    </select>
                  </div>
                  <div className="form-group col-span-2 sm-col-span-1">
                    <label>live image</label>
                    <input type="text" name="image" value={formData.image} onChange={handleChange} required />
                  </div>
                  <div className="form-group col-span-2">
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="3" required></textarea>
                  </div>
                  <div className="col-span-2 flex justify-end gap-4">
                    <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>
                    <button type="submit" className="primary-btn flex items-center gap-2" disabled={loading}>
                      <Check size={20} /> {loading ? 'Saving...' : 'Save Product'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="table-responsive">
              <table className="admin-table">
                <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Actions</th></tr></thead>
                <tbody>
                  {productList.map(product => (
                    <tr key={product.id}>
                      <td><img src={product.image} alt={product.name} className="table-img" /></td>
                      <td className="font-semibold">{product.name}</td>
                      <td><span className="cat-tag">{product.category}</span></td>
                      <td className="font-bold text-primary">Rs. {product.price}</td>
                      <td>
                        <div className="action-buttons">
                          <button className="edit-btn" onClick={() => handleEdit(product)} title="Edit"><Edit2 size={18} /></button>
                          <button className="delete-btn" onClick={() => handleDelete(product.id)} title="Delete"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="table-responsive">
            <table className="admin-table">
              <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th><th>Update</th></tr></thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id}>
                    <td className="font-semibold">#{order._id.substring(order._id.length - 6).toUpperCase()}</td>
                    <td>{order.customerName}</td>
                    <td className="font-bold text-primary">Rs. {order.totalAmount}</td>
                    <td>
                      <span className={`status-badge status-${order.status.toLowerCase().replace(' ', '-')}`}>{order.status}</span>
                    </td>
                    <td>
                      <select 
                        className="status-select" 
                        value={order.status} 
                        onChange={(e) => handleOrderStatusUpdate(order._id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan="5" className="text-center py-8">No orders found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="grid gap-6">
            {messages.map(msg => (
              <div key={msg._id} className="message-card">
                <div className="flex justify-between items-start mb-4 border-b pb-4">
                  <div>
                    <h4 className="font-bold text-lg">{msg.subject}</h4>
                    <p className="text-sm text-gray-500">From: <span className="font-semibold text-gray-800">{msg.name}</span> ({msg.email})</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))}
            {messages.length === 0 && <div className="text-center py-8 text-gray-500">No messages found.</div>}
          </div>
        )}

        {/* Demand Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="predictions-section fade-in">
            {/* Input Controls */}
            <div className="predictions-controls-card mb-8">
              <h3>Demand Forecasting Parameters</h3>
              <p className="text-sm text-gray-500 mb-6">Select environmental factors to calculate expected sales demand for all menu items using RandomForest regression.</p>
              
              <form onSubmit={handlePredictSubmit} className="grid grid-cols-4 gap-6 items-end">
                <div className="form-group col-span-4 sm-col-span-1">
                  <label className="flex items-center gap-1.5"><Sun size={16} /> Weather</label>
                  <select value={weather} onChange={handleWeatherChange}>
                    <option value="Mild">Mild</option>
                    <option value="Hot">Hot</option>
                    <option value="Cold">Cold</option>
                    <option value="Rainy">Rainy</option>
                  </select>
                </div>
                <div className="form-group col-span-4 sm-col-span-1">
                  <label>Temperature ({temperature}°C)</label>
                  <input 
                    type="range" 
                    min={weather === 'Cold' ? 5 : (weather === 'Hot' ? 30 : 15)} 
                    max={weather === 'Cold' ? 20 : (weather === 'Hot' ? 48 : 35)} 
                    value={temperature} 
                    onChange={(e) => setTemperature(parseInt(e.target.value))} 
                  />
                </div>
                <div className="form-group col-span-4 sm-col-span-1">
                  <label className="flex items-center gap-1.5"><Calendar size={16} /> Weekend</label>
                  <select value={weekend} onChange={(e) => setWeekend(e.target.value)}>
                    <option value="No">No (Weekday)</option>
                    <option value="Yes">Yes (Weekend)</option>
                  </select>
                </div>
                <div className="form-group col-span-4 sm-col-span-1">
                  <label>Occasion / Festival</label>
                  <select value={occasion} onChange={(e) => setOccasion(e.target.value)}>
                    <option value="None">None</option>
                    <option value="Eid">Eid Festival</option>
                    <option value="New Year">New Year</option>
                    <option value="Diwali">Diwali</option>
                  </select>
                </div>
                <div className="col-span-4 flex justify-end">
                  <button type="submit" className="primary-btn flex items-center gap-2" disabled={predLoading}>
                    <TrendingUp size={20} /> {predLoading ? 'Analyzing...' : 'Predict Sales Demand'}
                  </button>
                </div>
              </form>
            </div>

            {/* Error state */}
            {predError && (
              <div className="error-banner mb-8 flex items-start gap-3">
                <AlertTriangle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-800">Connection Error</h4>
                  <p className="text-sm text-red-700">{predError}</p>
                </div>
              </div>
            )}

            {/* Active Auto Stock Alert Banner */}
            {!predLoading && highDemandAlerts.length > 0 && (
              <div className="alert-banner mb-8 flex items-start gap-4">
                <div className="alert-icon-bg">
                  <AlertTriangle size={24} color="#ea580c" />
                </div>
                <div className="flex-1">
                  <h4>⚠️ Auto Stock Alert: High Demand Expected!</h4>
                  <p className="text-sm mt-1">
                    Based on the forecast, the following {highDemandAlerts.length} items will experience High Demand. Prepare additional ingredients to prevent stockouts:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {highDemandAlerts.map(item => (
                      <span key={`alert-badge-${item.id}`} className="high-demand-tag">
                        {item.name} (+{item.expected_sales} expected sales)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Loader */}
            {predLoading && (
              <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="spinner-large mb-4"></div>
                <h3>Calculating Predictor Matrices...</h3>
                <p className="text-gray-500">Estimating sales volumes using Random Forest regressors.</p>
              </div>
            )}

            {/* Prediction Results & Chart */}
            {!predLoading && predictions.length > 0 && (
              <div className="grid grid-cols-12 gap-8 items-start">
                
                {/* SVG Analytical Charts */}
                <div className="col-span-12 xl-col-span-5 chart-card">
                  <div className="flex justify-between items-center mb-6">
                    <h3>Sales Demand Chart</h3>
                    <span className="badge-analytics flex items-center gap-1"><BarChart3 size={14} /> Top Expected Sales</span>
                  </div>
                  
                  {/* SVG Bar Chart */}
                  <div className="svg-container">
                    <svg viewBox="0 0 500 380" className="w-full h-auto">
                      {/* Grid Lines */}
                      <line x1="150" y1="10" x2="150" y2="330" stroke="#e2e8f0" strokeWidth="2" />
                      <line x1="230" y1="10" x2="230" y2="330" stroke="#f1f5f9" strokeDasharray="4" />
                      <line x1="310" y1="10" x2="310" y2="330" stroke="#f1f5f9" strokeDasharray="4" />
                      <line x1="390" y1="10" x2="390" y2="330" stroke="#f1f5f9" strokeDasharray="4" />
                      <line x1="470" y1="10" x2="470" y2="330" stroke="#f1f5f9" strokeDasharray="4" />
                      
                      {/* Axes Labels */}
                      <text x="150" y="350" textAnchor="middle" fontSize="10" fill="#94a3b8">0</text>
                      <text x="310" y="350" textAnchor="middle" fontSize="10" fill="#94a3b8">{Math.round(maxExpectedSales / 2)}</text>
                      <text x="470" y="350" textAnchor="middle" fontSize="10" fill="#94a3b8">{maxExpectedSales}</text>
                      <text x="310" y="370" textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b">Predicted Quantity Sold</text>
                      
                      {/* Bars for Top 8 Products */}
                      {predictions.slice(0, 8).map((item, idx) => {
                        const yPos = idx * 40 + 20;
                        const barWidth = (item.expected_sales / maxExpectedSales) * 300;
                        const isHigh = item.expected_sales >= 35;
                        const isLow = item.expected_sales < 20;
                        const barColor = isHigh ? '#f97316' : (isLow ? '#94a3b8' : '#fbbf24');
                        
                        return (
                          <g key={`chart-item-${item.id}`}>
                            {/* Product Name Label */}
                            <text 
                              x="140" 
                              y={yPos + 12} 
                              textAnchor="end" 
                              fontSize="11" 
                              fontWeight="600" 
                              fill="#334155"
                            >
                              {item.name.length > 20 ? `${item.name.substring(0, 18)}...` : item.name}
                            </text>
                            
                            {/* Background Track */}
                            <rect 
                              x="150" 
                              y={yPos} 
                              width="320" 
                              height="18" 
                              rx="9" 
                              fill="#f8fafc" 
                            />
                            
                            {/* Value Fill Bar */}
                            <rect 
                              x="150" 
                              y={yPos} 
                              width={Math.max(barWidth, 8)} 
                              height="18" 
                              rx="9" 
                              fill={barColor}
                              className="chart-bar-transition"
                            />
                            
                            {/* Sales Value Label */}
                            <text 
                              x={Math.max(160, 150 + barWidth + 10)} 
                              y={yPos + 13} 
                              fontSize="11" 
                              fontWeight="800" 
                              fill={barColor}
                            >
                              {item.expected_sales}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Predictions Table */}
                <div className="col-span-12 xl-col-span-7 table-responsive shadow-sm">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Dish</th>
                        <th>Expected Sales</th>
                        <th>Demand Level</th>
                        <th>Stock Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictions.map(item => (
                        <tr key={`pred-row-${item.id}`}>
                          <td className="flex items-center gap-3">
                            <img src={item.image} alt={item.name} className="table-img" />
                            <div>
                              <div className="font-semibold text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-400">{item.category}</div>
                            </div>
                          </td>
                          <td className="font-bold text-center text-lg">{item.expected_sales} qty</td>
                          <td>
                            <span className={`status-badge ${
                              item.demand_level === 'High Demand' ? 'status-cancelled' : (
                                item.demand_level === 'Low Demand' ? 'status-pending' : 'status-preparing'
                              )
                            }`}>
                              {item.demand_level}
                            </span>
                          </td>
                          <td className="text-sm font-medium text-gray-600">
                            {item.stock_recommendation}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}
          </div>
        )}

      </div>

      <style>{`
        .badge { display: inline-block; padding: 0.5rem 1rem; background: var(--accent); color: var(--primary); border-radius: 50px; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
        .admin-dashboard h2 span { color: var(--primary); }
        .grid-cols-2 { grid-template-columns: 1fr 1fr; }
        .col-span-2 { grid-column: span 2; }
        
        .tab-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: transparent; border: none; font-weight: 700; color: var(--text-muted); cursor: pointer; border-radius: 50px; transition: var(--transition); white-space: nowrap; }
        .tab-btn:hover { background: var(--bg-main); }
        .tab-btn.active { background: var(--primary); color: white; }

        .admin-form-container { background: white; padding: 2rem; border-radius: 1.5rem; border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .admin-form-container h3 { font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
        
        .form-group label { display: block; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-main); }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.75rem 1rem; border-radius: 10px; border: 1px solid var(--border); font-family: inherit; font-size: 1rem; outline: none; transition: 0.3s; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1); }
        
        .cancel-btn { background: var(--bg-main); color: var(--text-main); border: none; padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.3s; }
        .cancel-btn:hover { background: #e2e8f0; }
        
        .form-error-banner { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 0.75rem 1rem; }
        
        .table-responsive { overflow-x: auto; background: white; border-radius: 1.5rem; border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,0.02); }
        .admin-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 700px; }
        .admin-table th, .admin-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); }
        .admin-table th { background: #f8fafc; font-weight: 700; color: var(--text-muted); text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px; }
        .admin-table tr:last-child td { border-bottom: none; }
        .admin-table tbody tr:hover { background: #f8fafc; }
        
        .table-img { width: 50px; height: 50px; border-radius: 10px; object-fit: cover; }
        .cat-tag { background: var(--bg-main); padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
        .text-primary { color: var(--primary); }
        
        .action-buttons { display: flex; gap: 0.5rem; }
        .edit-btn, .delete-btn { background: transparent; border: none; padding: 0.5rem; border-radius: 8px; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; }
        .edit-btn { color: #3b82f6; background: #eff6ff; }
        .edit-btn:hover { background: #bfdbfe; }
        .delete-btn { color: #ef4444; background: #fef2f2; }
        .delete-btn:hover { background: #fecaca; }

        .status-badge { padding: 0.4rem 0.8rem; border-radius: 50px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
        .status-pending { background: #fef3c7; color: #b45309; }
        .status-preparing { background: #e0e7ff; color: #4338ca; }
        .status-out-for-delivery { background: #fce7f3; color: #be185d; }
        .status-delivered { background: #d1fae5; color: #047857; }
        .status-cancelled { background: #fee2e2; color: #b91c1c; }
        
        .status-select { padding: 0.5rem; border-radius: 8px; border: 1px solid var(--border); font-family: inherit; font-size: 0.85rem; font-weight: 600; outline: none; cursor: pointer; }

        .message-card { background: white; padding: 2rem; border-radius: 1.5rem; border: 1px solid var(--border); box-shadow: 0 4px 15px rgba(0,0,0,0.02); }

        /* Predictions CSS */
        .predictions-controls-card {
          background: white;
          padding: 2.5rem;
          border-radius: 2rem;
          border: 1px solid var(--border);
          box-shadow: var(--shadow);
        }
        .predictions-controls-card h3 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; }
        
        .grid-cols-4 { display: grid; grid-template-columns: repeat(4, 1fr); }
        .col-span-4 { grid-column: span 4; }
        
        .form-group input[type="range"] {
          padding: 0;
          height: 8px;
          background: #e2e8f0;
          border-radius: 5px;
          outline: none;
          -webkit-appearance: none;
          cursor: pointer;
        }
        .form-group input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          background: var(--primary);
          border-radius: 50%;
          cursor: pointer;
          transition: 0.1s;
        }

        .alert-banner {
          background: #fff7ed;
          border: 1px solid #ffedd5;
          padding: 1.5rem;
          border-radius: 1.5rem;
          color: #c2410c;
        }
        .alert-banner h4 { font-weight: 800; font-size: 1.1rem; }
        .alert-icon-bg {
          background: #ffedd5;
          padding: 0.75rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .high-demand-tag {
          background: #ffedd5;
          color: #ea580c;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          border: 1px solid #fed7aa;
        }

        .error-banner {
          background: #fef2f2;
          border: 1px solid #fee2e2;
          padding: 1.5rem;
          border-radius: 1.5rem;
        }

        .spinner-large {
          width: 50px;
          height: 50px;
          border: 5px solid rgba(249, 115, 22, 0.1);
          border-left-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        
        .chart-card {
          background: white;
          padding: 2rem;
          border-radius: 1.5rem;
          border: 1px solid var(--border);
          box-shadow: 0 10px 30px rgba(0,0,0,0.01);
        }
        .chart-card h3 { font-size: 1.25rem; font-weight: 800; }
        .badge-analytics {
          padding: 0.4rem 0.8rem;
          background: #f1f5f9;
          color: #475569;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 50px;
        }
        .svg-container {
          margin-top: 1.5rem;
        }

        .chart-bar-transition {
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 1280px) {
          .grid-cols-12 { display: flex; flex-direction: column; gap: 2rem; }
          .xl-col-span-5, .xl-col-span-7 { width: 100%; }
        }

        @media (max-width: 1024px) {
          .grid-cols-4 { grid-template-columns: 1fr 1fr; }
          .col-span-4 { grid-column: span 2; }
        }

        @media (max-width: 768px) {
          .grid-cols-2 { grid-template-columns: 1fr; }
          .sm-col-span-1 { grid-column: span 2; }
          .grid-cols-4 { grid-template-columns: 1fr; }
          .col-span-4 { grid-column: span 1; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
