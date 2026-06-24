import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

const Notification = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="notification">
      <CheckCircle size={20} />
      <span>{message}</span>

      <style jsx>{`
        .notification {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: #10b981;
          color: white;
          padding: 1rem 2rem;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
          z-index: 2000;
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Notification;
