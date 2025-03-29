import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h4>About Us</h4>
          <p>Fitness Tracker - Your personal wellness companion</p>
          <p>Helping you achieve your fitness goals with smart tracking and motivation.</p>
        </div>
        
        <div className="footer-section">
          <h4>Quick Links</h4>
          <p><a href="/dashboard" className="footer-link">Dashboard</a></p>
          <p><a href="/workout" className="footer-link">Workouts</a></p>
          <p><a href="/nutrition" className="footer-link">Nutrition</a></p>
        </div>

        <div className="footer-section">
          <h4>Contact</h4>
          <p>Email: support@fitnessapp.com</p>
          <p>Phone: (+254) 123-4567</p>
          <p>Address: 40200, Chuka</p>
        </div>

        <div className="footer-section">
          <h4>Connect With Us</h4>
          <div className="social-icons">
            <a href="#" aria-label="Facebook">
              <FaFacebook />
            </a>
            <a href="#" aria-label="Twitter">
              <FaTwitter />
            </a>
            <a href="#" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href="#" aria-label="LinkedIn">
              <FaLinkedin />
            </a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} Fitness Tracker. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;