import React, { useState, useContext, useEffect } from "react";
import Swal from 'sweetalert2';
import { UserContext } from "../components/UserContext";
import UserService from "../services/UserService";
import GoogleFitService from '../services/GoogleFitService';
import FitbitService from '../services/FitbitService';
import AppleHealthService from '../services/AppleHealthService';
import "./styles/Profile.css";
import axios from 'axios';
import { toast } from 'react-toastify';
import Logger from '../utils/logger';

const Profile = () => {
  const { user, updateUser, fetchUser } = useContext(UserContext);
  const [editMode, setEditMode] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState(() => {
    if (!user) return {};

    // Format the date for the input field if it exists
    const formattedDate = user.dateOfBirth ?
      new Date(user.dateOfBirth).toISOString().split('T')[0] :
      '';

    return {
      ...user,
      dateOfBirth: formattedDate
    };
  });

  const [deviceStates, setDeviceStates] = useState({
    googleFit: {
      connected: false,
      loading: false,
      testing: false
    },
    fitbit: {
      connected: false,
      loading: false,
      testing: false
    }
  });

  const [caloriesData, setCaloriesData] = useState({
    calories: 0,
    source: null,
    lastSynced: null
  });

  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [healthData, setHealthData] = useState({
    calories: 0,
    heartRate: 0,
    lastSynced: null,
    source: null
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
      popup: 'profile-toast'
    }
  });

  const handleSuccess = (message) => {
    Toast.fire({
      icon: 'success',
      title: message
    });
  };

  const handleError = (message) => {
    Toast.fire({
      icon: 'error',
      title: message
    });
  };

  const handleEdit = () => setEditMode(true);

  const handleSave = async () => {
    try {
      const response = await UserService.updateUserProfile(updatedProfile);

      if (!response || !response.user) {
        handleError("Profile update failed: No user data returned.");
        return;
      }

      // Store the new token in localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
      }

      // Format the date before updating the context
      const formattedUser = {
        ...response.user,
        dateOfBirth: response.user.dateOfBirth ?
          new Date(response.user.dateOfBirth).toISOString().split('T')[0] :
          null
      };

      // Update both local storage and context
      localStorage.setItem('user', JSON.stringify(formattedUser));
      updateUser(formattedUser, response.token);

      // Fetch fresh user data to ensure everything is in sync
      await fetchUser();

      setEditMode(false);
      handleSuccess("Profile updated successfully!");
    } catch (error) {
      Logger.error("Failed to update profile:", error);
      handleError("Failed to update profile");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch device connection status when component mounts
  useEffect(() => {
    const fetchDeviceStatus = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/sync/device-status`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        setDeviceStates({
          googleFit: {
            connected: response.data.googleFit?.connected || false,
            loading: false,
            testing: false
          },
          fitbit: {
            connected: response.data.fitbit?.connected || false,
            loading: false,
            testing: false
          }
        });

        // If any device is connected, fetch health data
        if (response.data.googleFit?.connected || response.data.fitbit?.connected) {
          fetchHealthData();
        }
      } catch (error) {
        Logger.error('Error fetching device status:', error);
        toast.error('Failed to fetch device connection status');
      }
    };

    // Check URL parameters for notifications
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const message = urlParams.get('message');
    const service = urlParams.get('service');

    if (status === 'success') {
      toast.success(`Successfully connected to ${service}! Your health data will sync automatically.`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } else if (status === 'error') {
      toast.error(message || 'Failed to connect to service', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }

    // Clear the URL parameters after showing the notification
    if (status) {
      window.history.replaceState({}, '', '/profile');
    }

    fetchDeviceStatus();
  }, []);

  // Fetch calories data when devices are connected
  useEffect(() => {
    const fetchCaloriesData = async () => {
      try {
        if (deviceStates.googleFit.connected || deviceStates.fitbit.connected) {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/sync/calories`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });

          setCaloriesData({
            source: response.data.source,
            calories: response.data.calories,
            lastSynced: response.data.lastSynced
          });
        }
      } catch (error) {
        Logger.error('Failed to fetch calories:', error);
        handleError('Failed to fetch calories data');
      }
    };

    fetchCaloriesData();
  }, [deviceStates.googleFit.connected, deviceStates.fitbit.connected]);

  const fetchHealthData = async () => {
    try {
      if (deviceStates.googleFit.connected || deviceStates.fitbit.connected) {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/sync/health-data`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        setHealthData({
          calories: response.data.calories,
          heartRate: response.data.heartRate,
          lastSynced: response.data.lastSynced,
          source: response.data.source
        });
      }
    } catch (error) {
      Logger.error('Failed to fetch health data:', error);
      handleError('Failed to fetch health data');
    }
  };

  const handleConnectDevice = async (service) => {
    try {
      setDeviceStates(prev => ({
        ...prev,
        [service]: { ...prev[service], loading: true }
      }));

      // Add event listener before opening popup
      const handleAuthMessage = async (event) => {
        if (event.origin !== window.location.origin) return;

        Logger.debug('Received auth message:', event.data);

        if (event.data.type === 'GOOGLE_FIT_AUTH') {
          window.removeEventListener('message', handleAuthMessage);

          if (event.data.error) {
            throw new Error(event.data.error);
          }

          if (event.data.code) {
            const ServiceClass = service === 'googleFit' ? GoogleFitService : FitbitService;
            await ServiceClass.handleAuthCallback(event.data.code);

            setDeviceStates(prev => ({
              ...prev,
              [service]: { ...prev[service], connected: true }
            }));

            await fetchHealthData();
            toast.success(`Successfully connected to ${service}`);
          }
        }
      };

      window.addEventListener('message', handleAuthMessage);

      const ServiceClass = service === 'googleFit' ? GoogleFitService : FitbitService;
      await ServiceClass.connect();

    } catch (error) {
      Logger.error(`${service} connection error:`, error);
      toast.error(`Failed to connect to ${service}: ${error.message}`);
      setDeviceStates(prev => ({
        ...prev,
        [service]: { ...prev[service], connected: false }
      }));
    } finally {
      setDeviceStates(prev => ({
        ...prev,
        [service]: { ...prev[service], loading: false }
      }));
    }
  };

  const handleDisconnectDevice = async (service) => {
    setDeviceStates(prev => ({
      ...prev,
      [service]: { ...prev[service], loading: true }
    }));

    try {
      if (service === 'googleFit') {
        await GoogleFitService.disconnect();
      } else if (service === 'fitbit') {
        await FitbitService.disconnect();
      } else if (service === 'appleHealth') {
        await AppleHealthService.disconnect();
      }

      setDeviceStates(prev => ({
        ...prev,
        [service]: { connected: false, loading: false }
      }));
      handleSuccess(`Successfully disconnected from ${service}`);
    } catch (error) {
      Logger.error(`Failed to disconnect ${service}:`, error);
      handleError(`Failed to disconnect ${service}`);
      setDeviceStates(prev => ({
        ...prev,
        [service]: { ...prev[service], loading: false }
      }));
    }
  };

  const handleChangePassword = async () => {
    try {
      if (newPassword !== confirmNewPassword) {
        handleError("New passwords do not match");
        return;
      }

      if (newPassword.length < 6) {
        handleError("Password must be at least 6 characters long");
        return;
      }

      await UserService.changePassword({
        currentPassword,
        newPassword
      });

      // Reset form and close modal
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setChangePasswordMode(false);

      handleSuccess("Password changed successfully");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to change password";
      Logger.error("Failed to change password:", error);
      handleError(errorMessage);
    }
  };

  // Add this function to handle cancel
  const handleCancel = () => {
    setUpdatedProfile(user); // Reset form to original user data
    setEditMode(false);
    handleSuccess('Changes cancelled');
  };

  return (
    <div className="page-content">

      <div className="profile-container">
        <div className="profile-header">
        <h1>Profile</h1>
        <p>Manage your profile and connected devices</p>
      </div>
        <div className="profile-content">
          <div className="profile-information-section">
            {editMode ? (
              <form onSubmit={(e) => e.preventDefault()}>
                {['username', 'email', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'healthGoals'].map((field) => (
                  <div className="form-group" key={field}>
                    <label htmlFor={field}>
                      {field.replace(/([A-Z])/g, ' $1').charAt(0).toUpperCase() + field.replace(/([A-Z])/g, ' $1').slice(1)}
                    </label>
                    {field === 'gender' ? (
                      <select
                        id={field}
                        name={field}
                        value={updatedProfile[field] || ''}
                        onChange={handleInputChange}
                        className="form-control"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : field === 'healthGoals' ? (
                      <textarea
                        id={field}
                        name={field}
                        value={updatedProfile[field] || ''}
                        onChange={handleInputChange}
                        className="form-control"
                        rows="4"
                        placeholder="Enter your health and fitness goals..."
                      />
                    ) : (
                      <input
                        type={field === 'dateOfBirth' ? 'date' : field === 'email' ? 'email' : 'text'}
                        id={field}
                        name={field}
                        value={updatedProfile[field] || ''}
                        onChange={handleInputChange}
                        disabled={field === 'username' || field === 'email'}
                        className="form-control"
                      />
                    )}
                  </div>
                ))}
                <div className="button-group">
                  <button type="button" onClick={handleSave} className="save-button">
                    Save Changes
                  </button>
                  <button type="button" onClick={handleCancel} className="cancel-button">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                <div className="detail-row">
                  <span className="detail-label">Username:</span>
                  <span className="detail-value">{user?.username}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{user?.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">First Name:</span>
                  <span className="detail-value">{user?.firstName || 'Not set'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Last Name:</span>
                  <span className="detail-value">{user?.lastName || 'Not set'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date of Birth:</span>
                  <span className="detail-value">
                    {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not set'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Gender:</span>
                  <span className="detail-value">
                    {user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not set'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Health Goals:</span>
                  <span className="detail-value">{user?.healthGoals || 'Not set'}</span>
                </div>
                <button onClick={handleEdit} className="edit-button">
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          <div className="side-sections">
            <div className="health-data-section">
              <h2>Health Data</h2>
              {(deviceStates.googleFit.connected || deviceStates.fitbit.connected) ? (
                <div className="health-metrics">
                  <div className="metric-card calories">
                    <h3>Calories Burned</h3>
                    <div className="metric-value">{healthData.calories} kcal</div>
                  </div>
                  <div className="metric-card heart-rate">
                    <h3>Heart Rate</h3>
                    <div className="metric-value">{healthData.heartRate} bpm</div>
                  </div>
                  {healthData.lastSynced && (
                    <div className="last-synced">
                      Last updated: {new Date(healthData.lastSynced).toLocaleString()}
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-device-message">
                  Connect to Google Fit or Fitbit to view your health data
                </div>
              )}
            </div>

            <div className="connected-devices-section">
              <h2>Connected Devices</h2>
              <div className="device-list">
                {['googleFit', 'fitbit'].map((service) => (
                  <div className="device-item" key={service}>
                    <div className="device-info">
                      <p>
                        <strong>
                          {service === 'googleFit' ? 'Google Fit' : 'Fitbit'}:
                        </strong>
                        {deviceStates[service].connected ? ' Connected' : ' Not Connected'}
                      </p>
                      {deviceStates[service].loading && <span className="loading-spinner" />}
                    </div>
                    <div className="device-buttons">
                      <button
                        onClick={() => deviceStates[service].connected ?
                          handleDisconnectDevice(service) :
                          handleConnectDevice(service)
                        }
                        className={`device-button ${deviceStates[service].connected ? 'disconnect' : 'connect'}`}
                        disabled={deviceStates[service].loading}
                      >
                        {deviceStates[service].loading ? 'Processing...' :
                          (deviceStates[service].connected ? 'Disconnect' : 'Connect')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="settings-section">
              <h2>Settings</h2>
              <div className="setting-item">
                <p><strong>Change Password</strong></p>
                <button onClick={() => setChangePasswordMode(true)} className="change-password-button">
                  Change Password
                </button>
              </div>
              {changePasswordMode && (
                <div className="change-password-form">
                  <form onSubmit={(e) => e.preventDefault()}>
                    <div className="form-group">
                      <label htmlFor="currentPassword">Current Password</label>
                      <div className="password-input-container">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          id="currentPassword"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="form-control"
                        />
                        <button
                          type="button"
                          className="toggle-password"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <div className="password-input-container">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          id="newPassword"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="form-control"
                        />
                        <button
                          type="button"
                          className="toggle-password"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="confirmNewPassword">Confirm New Password</label>
                      <div className="password-input-container">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmNewPassword"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="form-control"
                        />
                        <button
                          type="button"
                          className="toggle-password"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                    <div className="button-group">
                      <button type="button" onClick={handleChangePassword} className="save-button">
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setChangePasswordMode(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmNewPassword('');
                        }}
                        className="cancel-button"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;