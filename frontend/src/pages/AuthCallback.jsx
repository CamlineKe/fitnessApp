import { useEffect } from 'react';
import axios from 'axios';
import Logger from '../utils/logger';

const AuthCallback = () => {
    useEffect(() => {
        const handleCallback = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const state = urlParams.get('state');

                if (!code) {
                    Logger.error('No authorization code found');
                    window.opener.location.href = '/profile?status=error&message=No authorization code found';
                    window.close();
                    return;
                }

                // Determine if this is a Fitbit callback by checking the URL path
                const isFitbit = window.location.pathname.includes('/auth/fitbit');
                const endpoint = isFitbit ? 'fitbit' : 'google-fit';

                await axios.post(
                    `${import.meta.env.VITE_API_URL}/sync/${endpoint}/connect`,
                    { code },
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );

                // Redirect with success message
                window.opener.location.href = `/profile?status=success&service=${isFitbit ? 'Fitbit' : 'Google Fit'}`;
                window.close();
            } catch (error) {
                Logger.error('Error handling auth callback:', error);
                const errorMessage = encodeURIComponent(error.response?.data?.message || `Failed to connect to service`);
                window.opener.location.href = `/profile?status=error&message=${errorMessage}`;
                window.close();
            }
        };

        handleCallback();
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-4">Processing authentication...</h2>
                <p className="text-gray-600">Please wait while we complete the connection.</p>
            </div>
        </div>
    );
};

export default AuthCallback;