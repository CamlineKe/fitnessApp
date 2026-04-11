import React from 'react';
import { Link } from 'react-router-dom';
import './EmptyState.css';

/**
 * Reusable EmptyState component for consistent empty state UI across the app
 * 
 * @param {string} icon - FontAwesome icon class (e.g., 'fa-utensils')
 * @param {string} title - Main message/title
 * @param {string} subtitle - Optional secondary message
 * @param {string} variant - 'default', 'compact', or 'chart'
 * @param {Object} action - Optional action button { label, to, onClick, icon }
 */
const EmptyState = ({ 
  icon = 'fa-calendar-plus', 
  title = 'No data yet', 
  subtitle = null,
  variant = 'default',
  action = null
}) => {
  return (
    <div className={`empty-state empty-state--${variant}`}>
      <div className="empty-state__icon">
        <i className={`fas ${icon}`}></i>
      </div>
      <p className="empty-state__title">{title}</p>
      {subtitle && (
        <span className="empty-state__subtitle">{subtitle}</span>
      )}
      {action && (
        <div className="empty-state__action">
          {action.to ? (
            <Link to={action.to} className="empty-state__button">
              {action.icon && <i className={`fas ${action.icon}`}></i>}
              {action.label}
            </Link>
          ) : (
            <button onClick={action.onClick} className="empty-state__button">
              {action.icon && <i className={`fas ${action.icon}`}></i>}
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
