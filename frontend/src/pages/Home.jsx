import React from 'react';
import { Link } from 'react-router-dom';
import './styles/Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <nav className="navbar">
        <div className="navbar-title">
          <h1>Fitness Tracker</h1>
        </div>
        <div className="navbar-buttons">
          <Link to="/login" className="nav-link">Sign In</Link>
          <Link to="/register" className="nav-link">Get Started</Link>
        </div>
      </nav>
      
      <header className="home-header">
        <h2>Transform Your Life with Smart Fitness Tracking</h2>
        <p>Experience a holistic approach to health and wellness. Track your fitness journey, nutrition habits, and mental wellbeing all in one intelligent platform.</p>
      </header>

      <section className="home-features">
        <h2 className="features-heading">Powerful Features for Your Wellness Journey</h2>
        
        <div className="feature-item">
          <img src="./images/health.jpg" alt="Unified Health Monitoring" className="feature-image" />
          <h3>Unified Health Monitoring</h3>
          <p>Get a complete picture of your health with our integrated tracking system that combines physical, nutritional, and mental wellness metrics.</p>
        </div>

        <div className="feature-item">
          <img src="./images/recommendation.jpg" alt="Personalized Recommendations" className="feature-image" />
          <h3>Smart Recommendations</h3>
          <p>Receive AI-powered insights and personalized workout plans tailored to your goals and progress.</p>
        </div>

        <div className="feature-item">
          <img src="./images/feedback.jpg" alt="Real-Time Analytics" className="feature-image" />
          <h3>Real-Time Analytics</h3>
          <p>Get instant feedback on your form and performance with advanced progress tracking technology.</p>
        </div>

        <div className="feature-item">
          <img src="./images/wellness.jpg" alt="Mental Health Integration" className="feature-image" />
          <h3>Mindfulness & Wellness</h3>
          <p>Track your mental wellness journey with mood tracking and stress management tools.</p>
        </div>

        <div className="feature-item">
          <img src="./images/gamification.jpg" alt="Gamification" className="feature-image" />
          <h3>Achievement System</h3>
          <p>Stay motivated with our engaging rewards system and personal milestone tracking.</p>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Quick Links</h4>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
          
          <div className="footer-section">
            <h4>Features</h4>
            <Link to="/login">Workouts</Link>
            <Link to="/login">Nutrition</Link>
            <Link to="/login">Wellness</Link>
          </div>
          
          <div className="footer-section">
            <h4>Connect</h4>
            <div className="social-links">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Fitness Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;