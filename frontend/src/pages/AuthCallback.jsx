import { useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './styles/AuthCallback.css';
import Logger from '../utils/logger';

const AuthCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const error = urlParams.get('error');
                
                // Determine which service this is for
                const isFitbit = window.location.pathname.includes('/auth/fitbit');
                const service = isFitbit ? 'Fitbit' : 'Google Fit';
                const endpoint = isFitbit ? 'fitbit' : 'google-fit';

                // Check for error in URL params (some providers send error directly)
                if (error) {
                    Logger.error(`Auth error from ${service}:`, error);
                    
                    // Redirect back to profile with error
                    navigate(`/profile?status=error&message=${encodeURIComponent(error)}&service=${service}`);
                    return;
                }

                if (!code) {
                    Logger.error('No authorization code found');
                    
                    // Redirect back to profile with error
                    navigate(`/profile?status=error&message=${encodeURIComponent('No authorization code received')}&service=${service}`);
                    return;
                }

                Logger.debug(`Exchanging code for ${service} tokens...`);

                // Exchange the code for tokens
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/sync/${endpoint}/connect`,
                    { code },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );

                Logger.debug(`${service} connection successful:`, response.data);

                // Redirect back to profile with success message
                navigate(`/profile?status=success&message=${encodeURIComponent('Successfully connected')}&service=${service}`);

            } catch (error) {
                Logger.error('Error handling auth callback:', error);
                
                // Determine service for error message
                const isFitbit = window.location.pathname.includes('/auth/fitbit');
                const service = isFitbit ? 'Fitbit' : 'Google Fit';
                
                const errorMessage = error.response?.data?.message || error.message || 'Failed to connect to service';
                
                // Redirect back to profile with error
                navigate(`/profile?status=error&message=${encodeURIComponent(errorMessage)}&service=${service}`);
            }
        };

        handleCallback();
    }, [navigate]);

    return (
        <div className="auth-callback-container">
            <div className="auth-callback-card">
                <div className="spinner"></div>
                <h2>Processing Authentication...</h2>
                <p>Please wait while we complete the connection to your service.</p>
                <p className="note">You will be redirected back to your profile automatically.</p>
            </div>
        </div>
    );
};

export default AuthCallback;