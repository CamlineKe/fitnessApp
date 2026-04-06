import React from 'react';
import { Link } from 'react-router-dom';
import SceneBackground from '../components/3D/SceneBackground';
import './styles/Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <SceneBackground />
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
        <div className="header-badge">
          <span className="badge-dot"></span>
          <span>AI-Powered Health Platform</span>
        </div>
        <h2>
          <span className="gradient-text">Transform Your Life</span>
          <br />
          with Smart Fitness Tracking
        </h2>
        <p>Experience a holistic approach to health and wellness. Track your fitness journey, nutrition habits, and mental wellbeing all in one intelligent platform.</p>
        <div className="header-cta">
          <Link to="/register" className="cta-primary">Start Your Journey</Link>
          <Link to="/login" className="cta-secondary">View Demo</Link>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">50K+</span>
            <span className="stat-label">Active Users</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">2M+</span>
            <span className="stat-label">Workouts Logged</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-number">98%</span>
            <span className="stat-label">Goal Success Rate</span>
          </div>
        </div>
      </header>

      <section className="home-features">
        <h2 className="features-heading">Powerful Features for Your Wellness Journey</h2>
        
        <div className="feature-item">
          <img src="./images/health.jpg" alt="Unified Health Monitoring" className="feature-image" loading="lazy" />
          <h3>Unified Health Monitoring</h3>
          <p>Get a complete picture of your health with our integrated tracking system that combines physical, nutritional, and mental wellness metrics.</p>
        </div>

        <div className="feature-item">
          <img src="./images/recommendation.jpg" alt="Personalized Recommendations" className="feature-image" loading="lazy" />
          <h3>Smart Recommendations</h3>
          <p>Receive AI-powered insights and personalized workout plans tailored to your goals and progress.</p>
        </div>

        <div className="feature-item">
          <img src="./images/feedback.jpg" alt="Real-Time Analytics" className="feature-image" loading="lazy" />
          <h3>Real-Time Analytics</h3>
          <p>Get instant feedback on your form and performance with advanced progress tracking technology.</p>
        </div>

        <div className="feature-item">
          <img src="./images/wellness.jpg" alt="Mental Health Integration" className="feature-image" loading="lazy" />
          <h3>Mindfulness & Wellness</h3>
          <p>Track your mental wellness journey with mood tracking and stress management tools.</p>
        </div>

        <div className="feature-item">
          <img src="./images/gamification.jpg" alt="Gamification" className="feature-image" loading="lazy" />
          <h3>Achievement System</h3>
          <p>Stay motivated with our engaging rewards system and personal milestone tracking.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;