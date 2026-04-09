import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext';
import { MdDashboard, MdPerson, MdRestaurant, MdFitnessCenter, MdMood, MdEmojiEvents, MdRecommend } from 'react-icons/md';
import './Navbar.css';

const Navbar = () => {
  const { user, loading } = useContext(UserContext);
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) setIsMenuOpen(false);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-title">
          <div className="navbar-brand">
            <MdFitnessCenter className="nav-icon title-icon" />
            {!isMobile && "Fitness Tracker"}
          </div>
        </div>

        {isMobile && (
          <button 
            className={`mobile-menu-button ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            type="button"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}

        <div className={`navbar-links ${isMobile ? 'mobile' : ''} ${isMenuOpen ? 'open' : ''}`} style={{ marginRight: isMobile ? '0' : '10px' }}>
          {loading ? (
            <span className="nav-loading">Loading...</span>
          ) : user ? (
            <>
              <NavLink to="/dashboard" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
                <MdDashboard className="nav-icon" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
                <MdPerson className="nav-icon" />
                <span>Profile</span>
              </NavLink>
              <NavLink to="/nutrition" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
                <MdRestaurant className="nav-icon" />
                <span>Nutrition</span>
              </NavLink>
              <NavLink to="/workout" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
                <MdFitnessCenter className="nav-icon" />
                <span>Workout</span>
              </NavLink>
              <NavLink to="/mentalhealth" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
                <MdMood className="nav-icon" />
                <span>Mental Health</span>
              </NavLink>
              <NavLink to="/gamification" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
                <MdEmojiEvents className="nav-icon" />
                <span>Gamification</span>
              </NavLink>
              <NavLink to="/recommendation" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
                <MdRecommend className="nav-icon" />
                <span>Recommendations</span>
              </NavLink>
            </>
          ) : (
            <NavLink to="/" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>
              <span>Login</span>
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
