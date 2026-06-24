import React from 'react';

const CategoryFilter = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="filter-container">
      <div className="filter-scroll flex gap-4">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => onCategoryChange(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <style>{`
        .filter-container {
          margin-bottom: 3rem;
          position: relative;
        }
        .filter-scroll {
          overflow-x: auto;
          padding: 0.5rem 0.25rem 1rem;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE/Edge */
        }
        .filter-scroll::-webkit-scrollbar {
          display: none; /* Chrome/Safari */
        }
        .filter-btn {
          padding: 0.85rem 1.75rem;
          background: white;
          border: 1px solid var(--border);
          border-radius: 50px;
          font-weight: 600;
          color: var(--text-muted);
          white-space: nowrap;
          font-size: 0.9rem;
          transition: var(--transition);
        }
        .filter-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: var(--accent);
        }
        .filter-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
        }
      `}</style>
    </div>
  );
};

export default CategoryFilter;
