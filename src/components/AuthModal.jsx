import React, { useState } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';

const AuthModal = ({ onClose, onLogin, onSignup }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [apiError, setApiError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const validateEmail = (email) => {
    return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
  };

  const validateForm = () => {
    const errors = { name: '', email: '', password: '' };
    let isValid = true;

    if (!isLogin) {
      if (!formData.name.trim()) {
        errors.name = 'Name is required';
        isValid = false;
      } else if (formData.name.trim().length > 50) {
        errors.name = 'Name must be 50 characters or fewer';
        isValid = false;
      }
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!isLogin && !validateEmail(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    } else if (formData.password.length > 128) {
      errors.password = 'Password must be 128 characters or fewer';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await onLogin(formData.email, formData.password);
      } else {
        await onSignup(formData);
      }
    } catch (err) {
      setApiError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear field error when user starts typing
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setApiError('');
    setFieldErrors({ name: '', email: '', password: '' });
  };

  const prefillAdmin = () => {
    setIsLogin(true);
    setFormData({ ...formData, email: 'gullylaila509@gmail.com' });
    setApiError('');
    setFieldErrors({ name: '', email: '', password: '' });
  };

  const fieldErrorStyle = {
    color: '#dc2626',
    fontSize: '0.8rem',
    marginTop: '0.25rem',
    fontWeight: '500'
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal fade-in">
        <button className="close-btn" onClick={onClose}><X size={24} /></button>
        
        <div className="auth-header">
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Login to continue your order' : 'Join GourmetGo for a better experience'}</p>
        </div>

        {apiError && <div className="auth-error">{apiError}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label><User size={18} /> Full Name</label>
              <input 
                type="text" 
                name="name" 
                placeholder="Enter your name" 
                value={formData.name}
                onChange={handleChange}
                style={fieldErrors.name ? { borderColor: '#dc2626' } : {}}
              />
              {fieldErrors.name && <div style={fieldErrorStyle}>{fieldErrors.name}</div>}
            </div>
          )}
          <div className="form-group">
            <label><Mail size={18} /> Email Address</label>
            <input 
              type="email" 
              name="email" 
              placeholder="Enter your email" 
              value={formData.email}
              onChange={handleChange}
              style={fieldErrors.email ? { borderColor: '#dc2626' } : {}}
            />
            {fieldErrors.email && <div style={fieldErrorStyle}>{fieldErrors.email}</div>}
          </div>
          <div className="form-group">
            <label><Lock size={18} /> Password</label>
            <input 
              type="password" 
              name="password" 
              placeholder="Enter your password (6-128 chars)" 
              value={formData.password}
              onChange={handleChange}
              style={fieldErrors.password ? { borderColor: '#dc2626' } : {}}
            />
            {fieldErrors.password && <div style={fieldErrorStyle}>{fieldErrors.password}</div>}
          </div>
          
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? <><LogIn size={20} /> Login</> : <><UserPlus size={20} /> Sign Up</>)}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button onClick={handleModeSwitch}>
              {isLogin ? 'Sign Up Now' : 'Login Now'}
            </button>
          </p>
          
          <div className="admin-quick-login mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={prefillAdmin} className="text-sm font-semibold text-gray-500 hover:text-primary transition">
              Are you an Admin? Click here
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .auth-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          z-index: 3000;
          overflow-y: auto;
          padding: 2rem 1rem;
        }
        .auth-modal {
          margin: auto;
          background: white;
          width: 100%;
          max-width: 450px;
          padding: 3rem;
          border-radius: 2rem;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .close-btn {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: var(--bg-main);
          border-radius: 50%;
          padding: 0.5rem;
          color: var(--text-muted);
        }
        .close-btn:hover { color: var(--primary); transform: rotate(90deg); }
        
        .auth-header { text-align: center; margin-bottom: 2.5rem; }
        .auth-header h2 { font-size: 2rem; color: var(--text-main); margin-bottom: 0.5rem; }
        
        .auth-error { background: #fee2e2; color: #b91c1c; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-weight: 500; text-align: center; border: 1px solid #f87171; }

        .form-group { margin-bottom: 1.5rem; }
        .form-group label { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--text-main); }
        .form-group input { width: 100%; padding: 1rem; border-radius: 12px; border: 1px solid var(--border); font-family: inherit; font-size: 1rem; outline: none; transition: var(--transition); }
        .form-group input:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1); }
        
        .submit-btn { width: 100%; background: var(--primary); color: white; padding: 1.25rem; border-radius: 12px; font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-top: 2rem; }
        .submit-btn:hover { background: var(--primary-hover); transform: translateY(-2px); }
        
        .auth-footer { text-align: center; margin-top: 2rem; }
        .auth-footer button { background: transparent; color: var(--primary); font-weight: 700; margin-left: 0.5rem; text-decoration: underline; }
      `}</style>
    </div>
  );
};

export default AuthModal;
