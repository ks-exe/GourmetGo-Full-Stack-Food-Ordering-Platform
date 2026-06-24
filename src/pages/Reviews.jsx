import React, { useState, useEffect } from 'react';
import { Star, Quote, Heart, CheckCircle } from 'lucide-react';

const Reviews = ({ user, onLoginRequest }) => {
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reviews');
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    }
  };

  const handleWriteReviewClick = () => {
    if (!user) {
      onLoginRequest();
    } else {
      setShowForm(true);
    }
  };

  const validateReview = () => {
    const newErrors = {};
    if (!newReview.rating || newReview.rating < 1 || newReview.rating > 5 || !Number.isInteger(newReview.rating)) {
      newErrors.rating = 'Please select a rating between 1 and 5 stars.';
    }
    if (!newReview.comment.trim()) {
      newErrors.comment = 'Comment is required.';
    } else if (newReview.comment.length > 500) {
      newErrors.comment = 'Comment must be 500 characters or fewer.';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      onLoginRequest();
      return;
    }

    const validationErrors = validateReview();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          comment: newReview.comment,
          rating: newReview.rating,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        })
      });
      if (res.ok) {
        setShowForm(false);
        setNewReview({ rating: 0, comment: '' });
        setErrors({});
        fetchReviews(); // Refresh list
      } else {
        const data = await res.json();
        setErrors({ submit: data.message || 'Failed to submit review. Please try again.' });
      }
    } catch (err) {
      console.error("Failed to submit review", err);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reviews-page section-padding fade-in">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge">Testimonials</span>
          <h2>What Our <span>Foodies</span> Say</h2>
          <p className="max-width-600 mx-auto mt-4">We take pride in our flavors and our community. Here's what some of our regular customers have to say.</p>
        </div>

        {/* Stats Row */}
        <div className="review-stats flex justify-center gap-12 mb-16">
          <div className="stat-item text-center">
            <h3 className="text-4xl font-bold">4.9</h3>
            <div className="flex gap-1 justify-center mt-2">
              {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#fbbf24" color="#fbbf24" />)}
            </div>
            <p className="mt-2 font-semibold">Average Rating</p>
          </div>
          <div className="stat-item text-center">
            <h3 className="text-4xl font-bold">{reviews.length}+</h3>
            <p className="mt-2 font-semibold text-gray-500">Total Reviews</p>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="reviews-grid grid gap-8 mt-8">
          {reviews.map((review) => (
            <div key={review._id} className="review-card-premium">
              <div className="review-top flex justify-between items-start mb-6">
                <div className="user-profile flex items-center gap-4">
                  <div className="img-wrapper">
                    <img src={review.image} alt={review.name} />
                  </div>
                  <div>
                    <h4 className="flex items-center gap-1">
                      {review.name} 
                      {review.verified && <CheckCircle size={14} color="#059669" fill="#d1fae5" />}
                    </h4>
                    <p className="date">{review.date}</p>
                  </div>
                </div>
                <div className="quote-badge">
                  <Quote size={20} />
                </div>
              </div>

              <div className="rating-stars flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={16} 
                    fill={i < review.rating ? "#fbbf24" : "#e5e7eb"} 
                    color={i < review.rating ? "#fbbf24" : "#e5e7eb"} 
                  />
                ))}
              </div>

              <p className="review-text">"{review.comment}"</p>
              
              <div className="review-footer flex items-center gap-2 mt-6 pt-6 border-t border-gray-100">
                <Heart size={14} color="var(--primary)" fill="var(--primary)" />
                <span className="text-xs font-bold text-gray-400">Helpful Review</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA / Form */}
        <div className="write-review-cta mt-24 text-center">
          {!showForm ? (
            <div className="cta-box">
              <h3>Loved our food?</h3>
              <p>Share your experience with our community and help us grow!</p>
              <button className="primary-btn-large mt-8" onClick={handleWriteReviewClick}>
                Write a Review Now
              </button>
            </div>
          ) : (
            <div className="review-form-container fade-in">
              <h3>Write Your Review</h3>
              <form onSubmit={handleSubmit}>
                <div className="rating-input flex justify-center gap-2 mb-6 mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={32} 
                      className="cursor-pointer"
                      fill={star <= newReview.rating ? "#fbbf24" : "none"} 
                      color={star <= newReview.rating ? "#fbbf24" : "#cbd5e1"} 
                      onClick={() => { setNewReview({ ...newReview, rating: star }); setErrors((prev) => ({ ...prev, rating: undefined })); }}
                    />
                  ))}
                </div>
                {errors.rating && <p className="form-error">{errors.rating}</p>}
                <textarea 
                  className={`review-textarea${errors.comment ? ' textarea-error' : ''}`}
                  placeholder="Tell us what you loved about your meal..."
                  value={newReview.comment}
                  onChange={(e) => { setNewReview({ ...newReview, comment: e.target.value }); setErrors((prev) => ({ ...prev, comment: undefined })); }}
                  rows="4"
                  maxLength={500}
                />
                <div className="char-counter">{newReview.comment.length}/500</div>
                {errors.comment && <p className="form-error">{errors.comment}</p>}
                {errors.submit && <p className="form-error">{errors.submit}</p>}
                <div className="flex gap-4 justify-center mt-6">
                  <button type="button" className="cancel-btn" onClick={() => { setShowForm(false); setErrors({}); }}>Cancel</button>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .badge { display: inline-block; padding: 0.5rem 1rem; background: var(--accent); color: var(--primary); border-radius: 50px; font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
        .text-4xl { font-size: 2.5rem; }
        .font-bold { font-weight: 800; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mt-8 { margin-top: 2rem; }
        .mt-16 { margin-top: 4rem; }
        .mt-24 { margin-top: 6rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .max-width-600 { max-width: 600px; }

        .reviews-grid { grid-template-columns: repeat(3, 1fr); }
        .review-card-premium { background: white; padding: 2.5rem; border-radius: 2rem; border: 1px solid var(--border); transition: var(--transition); position: relative; }
        .review-card-premium:hover { transform: translateY(-10px); border-color: var(--primary); box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
        
        .img-wrapper { width: 56px; height: 56px; border-radius: 50%; overflow: hidden; border: 2px solid var(--bg-main); }
        .img-wrapper img { width: 100%; height: 100%; object-fit: cover; }
        
        .user-profile h4 { font-size: 1.1rem; font-weight: 800; margin-bottom: 0.1rem; }
        .date { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); }
        
        .quote-badge { background: var(--accent); color: var(--primary); padding: 0.75rem; border-radius: 12px; }
        
        .review-text { font-size: 1.05rem; line-height: 1.6; font-weight: 500; color: var(--text-main); height: 5rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
        
        .cta-box { background: linear-gradient(135deg, #111827 0%, #1f2937 100%); padding: 5rem 3rem; border-radius: 3rem; color: white; }
        .cta-box h3 { font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; }
        .cta-box p { font-size: 1.25rem; opacity: 0.8; }
        
        .primary-btn-large { background: var(--primary); color: white; border: none; padding: 1.25rem 3rem; border-radius: 50px; font-weight: 800; font-size: 1.1rem; transition: var(--transition); cursor: pointer; }
        .primary-btn-large:hover { background: var(--primary-hover); transform: scale(1.05); box-shadow: 0 15px 30px rgba(249, 115, 22, 0.4); }

        .review-form-container { background: white; padding: 4rem; border-radius: 2rem; border: 1px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.05); max-width: 600px; margin: 0 auto; }
        .review-form-container h3 { font-size: 2rem; font-weight: 800; margin-bottom: 1rem; color: var(--text-main); }
        .cursor-pointer { cursor: pointer; transition: 0.2s; }
        .cursor-pointer:hover { transform: scale(1.1); }
        .review-textarea { width: 100%; padding: 1.5rem; border-radius: 1rem; border: 2px solid var(--border); font-family: inherit; font-size: 1.1rem; outline: none; transition: 0.3s; resize: vertical; }
        .review-textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1); }
        
        .submit-btn { background: var(--primary); color: white; border: none; padding: 1rem 2.5rem; border-radius: 50px; font-weight: 700; font-size: 1.1rem; cursor: pointer; transition: 0.3s; }
        .submit-btn:hover:not(:disabled) { background: var(--primary-hover); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .cancel-btn { background: var(--bg-main); color: var(--text-main); border: none; padding: 1rem 2.5rem; border-radius: 50px; font-weight: 700; font-size: 1.1rem; cursor: pointer; transition: 0.3s; }
        .cancel-btn:hover { background: #e2e8f0; }

        .form-error { color: #dc2626; font-size: 0.85rem; font-weight: 600; margin-top: 0.25rem; margin-bottom: 0.5rem; text-align: center; }
        .textarea-error { border-color: #dc2626 !important; }
        .textarea-error:focus { box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.1) !important; border-color: #dc2626 !important; }
        .char-counter { text-align: right; font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; font-weight: 600; }

        @media (max-width: 1024px) {
          .reviews-grid { grid-template-columns: 1fr 1fr; }
          .review-stats { gap: 6rem; }
        }
        @media (max-width: 768px) {
          .reviews-grid { grid-template-columns: 1fr; }
          .review-stats { flex-direction: column; gap: 3rem; }
          .review-form-container { padding: 2rem; }
        }
      `}</style>
    </div>
  );
};

export default Reviews;
