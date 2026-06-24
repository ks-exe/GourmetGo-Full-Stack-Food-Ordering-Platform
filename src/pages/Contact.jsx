import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from 'lucide-react';

const Contact = ({ onNotification }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    // Name: required, 1-100 characters
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    // Email: required, valid format
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Subject: required, 1-200 characters
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.trim().length > 200) {
      newErrors.subject = 'Subject must be 200 characters or less';
    }

    // Message: required, 1-2000 characters
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length > 2000) {
      newErrors.message = 'Message must be 2000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Show success notification
      if (onNotification) {
        onNotification(`Thank you ${formData.name.trim()}! Your message has been sent successfully.`);
      }
      setFormData({ name: '', email: '', subject: '', message: '' });
      setErrors({});
    } catch (err) {
      console.error(err);
      if (onNotification) {
        onNotification('Failed to send message. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <div className="contact-page section-padding fade-in">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge">Connect With Us</span>
          <h2>We're Here to <span>Help</span></h2>
          <p className="max-width-600 mx-auto mt-4">Have a question about our menu, delivery, or hosting an event? Drop us a message and we'll respond faster than we deliver!</p>
        </div>

        <div className="contact-layout grid gap-12">
          {/* Left: Contact Info */}
          <div className="contact-sidebar">
            <div className="contact-info-stack grid gap-6">
              <div className="info-card-premium">
                <div className="icon-circle-bg"><MapPin size={24} /></div>
                <div className="info-text">
                  <h4>Headquarters</h4>
                  <p>123 Gourmet Street, Gulberg III, Lahore, Pakistan</p>
                </div>
              </div>
              <div className="info-card-premium">
                <div className="icon-circle-bg"><Phone size={24} /></div>
                <div className="info-text">
                  <h4>Phone Support</h4>
                  <p>+92 300 1234567</p>
                  <p>Mon - Sun, 10am - 11pm</p>
                </div>
              </div>
              <div className="info-card-premium">
                <div className="icon-circle-bg"><Mail size={24} /></div>
                <div className="info-text">
                  <h4>Email Inquiry</h4>
                  <p>support@gourmetgo.com</p>
                  <p>careers@gourmetgo.com</p>
                </div>
              </div>
              <div className="info-card-premium">
                <div className="icon-circle-bg"><Clock size={24} /></div>
                <div className="info-text">
                  <h4>Delivery Hours</h4>
                  <p>Lahore: 24/7 Service</p>
                  <p>Karachi: 11am - 2am</p>
                </div>
              </div>
            </div>

            <div className="social-connect mt-12 text-center p-8 bg-gray-50 rounded-3xl border border-gray-100">
              <h4>Follow Our Journey</h4>
              <p className="mb-4">Get the latest updates and offers!</p>
              <div className="flex justify-center gap-4">
                <button className="social-btn">FB</button>
                <button className="social-btn">IG</button>
                <button className="social-btn">TW</button>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="contact-form-box">
            <div className="form-header flex items-center gap-4 mb-8">
              <div className="icon-bg-primary"><MessageCircle size={32} /></div>
              <div>
                <h3>Send us a <span>Message</span></h3>
                <p>Typical response time: Within 2 hours</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="premium-form" noValidate>
              <div className="form-row grid gap-6">
                <div className="form-group">
                  <label>Your Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="e.g. Ali Ahmed"
                    maxLength={100}
                    className={errors.name ? 'input-error' : ''}
                  />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="e.g. ali@example.com"
                    className={errors.email ? 'input-error' : ''}
                  />
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>
              </div>

              <div className="form-group mt-6">
                <label>Subject</label>
                <input 
                  type="text" 
                  name="subject" 
                  value={formData.subject} 
                  onChange={handleChange} 
                  placeholder="How can we help you?"
                  maxLength={200}
                  className={errors.subject ? 'input-error' : ''}
                />
                {errors.subject && <span className="field-error">{errors.subject}</span>}
              </div>

              <div className="form-group mt-6">
                <label>Detailed Message</label>
                <textarea 
                  name="message" 
                  value={formData.message} 
                  onChange={handleChange} 
                  placeholder="Tell us more about your inquiry..." 
                  rows="6"
                  maxLength={2000}
                  className={errors.message ? 'input-error' : ''}
                ></textarea>
                {errors.message && <span className="field-error">{errors.message}</span>}
              </div>

              <button type="submit" className="premium-submit-btn mt-8" disabled={loading}>
                {loading ? 'Sending...' : <><Send size={20} /> Send Your Message</>}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .contact-layout { grid-template-columns: 1fr 1.6fr; align-items: start; }
        
        .info-card-premium { display: flex; gap: 1.5rem; align-items: flex-start; padding: 2rem; background: white; border-radius: 1.5rem; border: 1px solid var(--border); transition: var(--transition); }
        .info-card-premium:hover { border-color: var(--primary); transform: translateX(10px); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .icon-circle-bg { width: 56px; height: 56px; background: var(--accent); color: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .info-text h4 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem; }
        .info-text p { font-size: 0.95rem; font-weight: 600; line-height: 1.6; margin-bottom: 0; }

        .contact-form-box { background: white; padding: 4rem; border-radius: 3rem; box-shadow: 0 40px 80px rgba(0,0,0,0.08); border: 1px solid var(--border); }
        .icon-bg-primary { width: 64px; height: 64px; background: var(--primary); color: white; border-radius: 20px; display: flex; align-items: center; justify-content: center; }
        .form-header h3 { font-size: 2rem; font-weight: 800; }
        .form-header h3 span { color: var(--primary); }
        .form-header p { font-weight: 600; font-size: 0.9rem; }

        .form-row { grid-template-columns: 1fr 1fr; }
        .form-group label { display: block; margin-bottom: 0.75rem; font-weight: 800; font-size: 0.85rem; text-transform: uppercase; color: var(--text-main); letter-spacing: 0.5px; }
        .form-group input, .form-group textarea { width: 100%; padding: 1.25rem; border: 2px solid var(--bg-main); background: var(--bg-main); border-radius: 1rem; font-family: inherit; font-size: 1rem; outline: none; transition: var(--transition); font-weight: 500; }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--primary); background: white; box-shadow: 0 10px 20px rgba(249, 115, 22, 0.05); }
        .form-group input.input-error, .form-group textarea.input-error { border-color: #ef4444; background: #fef2f2; }
        .form-group input.input-error:focus, .form-group textarea.input-error:focus { border-color: #ef4444; box-shadow: 0 10px 20px rgba(239, 68, 68, 0.1); }

        .field-error { display: block; color: #ef4444; font-size: 0.8rem; font-weight: 600; margin-top: 0.5rem; }

        .premium-submit-btn { width: 100%; background: var(--primary); color: white; padding: 1.5rem; border-radius: 1rem; font-weight: 800; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 0.75rem; transition: var(--transition); }
        .premium-submit-btn:hover { background: var(--primary-hover); transform: translateY(-3px); box-shadow: 0 20px 40px rgba(249, 115, 22, 0.3); }
        .premium-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        .social-btn { width: 45px; height: 45px; border-radius: 50%; background: white; border: 1px solid var(--border); font-weight: 800; font-size: 0.75rem; transition: var(--transition); }
        .social-btn:hover { background: var(--primary); color: white; border-color: var(--primary); transform: translateY(-5px); }

        @media (max-width: 1024px) {
          .contact-layout { grid-template-columns: 1fr; }
          .contact-form-box { padding: 3rem 2rem; }
        }
        @media (max-width: 640px) {
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Contact;
