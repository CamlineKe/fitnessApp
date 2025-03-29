import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import UserService from "../services/UserService";
import { UserContext } from "../components/UserContext";
import "./styles/Login.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-right',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    background: '#fff',
    color: '#333',
    customClass: {
      popup: 'login-toast'
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      Toast.fire({
        icon: 'error',
        title: 'Please enter your email'
      });
      return;
    }

    if (!formData.password.trim()) {
      Toast.fire({
        icon: 'error',
        title: 'Please enter your password'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await UserService.loginUser(formData);

      if (response.token && response.user) {
        await login(response.user, response.token);

        Toast.fire({
          icon: 'success',
          title: 'Welcome back! Redirecting to dashboard...'
        });

        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 2000);
      }
    } catch (error) {
      console.error("Login failed:", error);
      let errorMessage = 'Login failed. Please try again later.';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Incorrect email or password';
      } else if (error.response?.status === 404) {
        errorMessage = 'No account found with this email';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      }

      Toast.fire({
        icon: 'error',
        title: errorMessage,
        timer: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="login-header">
          <Link to="/" className="back-link">
            <i className="fas fa-arrow-left"></i>
            <span>Back to Home</span>
          </Link>
          <h1>Welcome Back</h1>
          <p>Sign in to continue your fitness journey</p>
        </div>

        <div className="login-form">
          <form onSubmit={handleSubmit}>
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
                  placeholder="Enter your password"
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

            <div className="form-footer">
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt"></i>
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="auth-links">
            <Link to="/forgot-password" className="forgot-password">
              Forgot your password?
            </Link>
            <div className="register-prompt">
              Don't have an account?
              <Link to="/register" className="register-link">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
