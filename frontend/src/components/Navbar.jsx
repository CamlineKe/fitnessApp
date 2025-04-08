import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext';
import { MdDashboard, MdPerson, MdRestaurant, MdFitnessCenter, MdMood, MdEmojiEvents, MdRecommend } from 'react-icons/md';
import './Navbar.css';

const Navbar = () => {
  const { user } = useContext(UserContext);
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-title">
          <Link to="/dashboard" className="navbar-link">
            <MdFitnessCenter className="nav-icon title-icon" />
            {!isMobile && "Fitness Tracker"}
          </Link>
        </div>

        {isMobile && (
          <button 
            className={`mobile-menu-button ${isMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        )}

        <div className={`navbar-links ${isMobile ? 'mobile' : ''} ${isMenuOpen ? 'open' : ''}`}>
          {user && (
            <>
              <Link to="/dashboard" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                <MdDashboard className="nav-icon" />
                <span>Dashboard</span>
              </Link>
              <Link to="/profile" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                <MdPerson className="nav-icon" />
                <span>Profile</span>
              </Link>
              <Link to="/nutrition" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                <MdRestaurant className="nav-icon" />
                <span>Nutrition</span>
              </Link>
              <Link to="/workout" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                <MdFitnessCenter className="nav-icon" />
                <span>Workout</span>
              </Link>
              <Link to="/mentalhealth" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                <MdMood className="nav-icon" />
                <span>Mental Health</span>
              </Link>
              <Link to="/gamification" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                <MdEmojiEvents className="nav-icon" />
                <span>Gamification</span>
              </Link>
              <Link to="/recommendation" className="navbar-link" onClick={() => setIsMenuOpen(false)}>
                <MdRecommend className="nav-icon" />
                <span>Recommendations</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
