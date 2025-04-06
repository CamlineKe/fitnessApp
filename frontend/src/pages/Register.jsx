import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import UserService from "../services/UserService";
import "./styles/Register.css";
import Logger from '../utils/logger';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-right',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#fff',
    color: '#333',
    customClass: {
      popup: 'register-toast'
    }
  });

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!re.test(email)) {
      Toast.fire({
        icon: 'error',
        title: 'Please enter a valid email address'
      });
      return false;
    }
    return true;
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      Toast.fire({
        icon: 'error',
        title: 'Password must be at least 8 characters long'
      });
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      Toast.fire({
        icon: 'error',
        title: 'Password must contain at least one uppercase letter'
      });
      return false;
    }
    if (!/[a-z]/.test(password)) {
      Toast.fire({
        icon: 'error',
        title: 'Password must contain at least one lowercase letter'
      });
      return false;
    }
    if (!/[0-9]/.test(password)) {
      Toast.fire({
        icon: 'error',
        title: 'Password must contain at least one number'
      });
      return false;
    }
    if (!/[!@#$%^&*]/.test(password)) {
      Toast.fire({
        icon: 'error',
        title: 'Password must contain at least one special character (!@#$%^&*)'
      });
      return false;
    }
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateEmail(formData.email)) {
      return;
    }

    if (!validatePassword(formData.password)) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Toast.fire({
        icon: 'error',
        title: 'Passwords do not match'
      });
      return;
    }

    if (!formData.username.trim()) {
      Toast.fire({
        icon: 'error',
        title: 'Please enter a username'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await UserService.registerUser(formData);
      
      if (response.token && response.user) {
        Toast.fire({
          icon: 'success',
          title: 'Welcome to Fitness Tracker! Redirecting to login...'
        });
        
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (error) {
      Logger.error("Registration failed:", error);
      let errorMessage = 'Registration failed. Please try again.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        if (error.response.data?.includes('username')) {
          errorMessage = 'This username is already taken';
        } else if (error.response.data?.includes('email')) {
          errorMessage = 'This email is already registered';
        }
      }

      Toast.fire({
        icon: 'error',
        title: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-content">
        <div className="register-header">
          <Link to="/" className="back-link">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Home</span>
          </Link>
          <h1>Create Account</h1>
          <p>Join us on your fitness journey</p>
        </div>

        <div className="register-form">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">
                <i className="fas fa-user"></i>
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <i className="fas fa-envelope"></i>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <i className="fas fa-lock"></i>
                Password
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password"
                  required
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <i className="fas fa-shield-alt"></i>
                Confirm Password
              </label>
              <div className="password-input-container">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  required
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <i className={`fas ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>

            <div className="password-requirements">
              <p>Password must contain:</p>
              <ul>
                <li><i className="fas fa-check-circle"></i> At least 8 characters</li>
                <li><i className="fas fa-check-circle"></i> One uppercase letter</li>
                <li><i className="fas fa-check-circle"></i> One lowercase letter</li>
                <li><i className="fas fa-check-circle"></i> One number</li>
                <li><i className="fas fa-check-circle"></i> One special character (!@#$%^&*)</li>
              </ul>
            </div>

            <div className="form-footer">
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i>
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="auth-links">
            <div className="login-prompt">
              Already have an account? 
              <Link to="/login" className="login-link">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;