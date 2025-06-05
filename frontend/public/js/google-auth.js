/**
 * Google OAuth implementation for NeoPOS
 * This file handles Google authentication functionality for the landing page
 */

// Google OAuth credentials
const googleClientId = '489848070288-0he2h9ti3a9aqljpagoigmt5h9tmt38k.apps.googleusercontent.com';

let googleAuth;

// Set API base URL to Render backend only (no local testing)
const apiBaseUrl = 'https://smart-pos-system.onrender.com/api';

/**
 * Initialize Google OAuth client
 */
function initializeGoogleAuth() {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
        // Get the current origin for better compatibility across environments
        const currentOrigin = window.location.origin;
        
        // Log the current origin for debugging
        console.log('Current origin for OAuth redirect:', currentOrigin);
        
        // Configure the redirect URI based on the environment
        let redirectUri = `${currentOrigin}/auth/google/callback`;
        
        // Initialize the Google OAuth client
        googleAuth = google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: 'email profile',
            callback: handleGoogleOAuthResponse,
            // Match redirect URI exactly as registered in Google Console
            redirect_uri: redirectUri
        });
        
        console.log('Google OAuth initialized with redirect URI:', redirectUri);
    } else {
        console.error('Google OAuth libraries not loaded');
    }
}

/**
 * Handle the Google OAuth response after user authentication
 * @param {Object} response - The response from Google OAuth
 */
function handleGoogleOAuthResponse(response) {
    if (response.error) {
        console.error('Google OAuth error:', response.error);
        
        // Handle specific OAuth errors
        if (response.error === 'redirect_uri_mismatch') {
            showAuthError('Authentication failed: The redirect URI does not match what is configured in Google Console.');
            console.error('Redirect URI mismatch. Please make sure the redirect URI in the code matches what is configured in the Google Cloud Console.');
        } else if (response.error === 'access_denied') {
            showAuthError('Authentication was canceled or denied by the user.');
        } else if (response.error === 'popup_closed_by_user') {
            showAuthError('The authentication popup was closed before completing the process. Please try again.');
        } else {
            showAuthError(`Authentication failed: ${response.error}`);
        }
        return;
    }
    
    // We have access token now
    const accessToken = response.access_token;
      // Use the token to fetch user info from Google
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to fetch user info: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Google user info retrieved successfully');
        
        // Get information about which popup is active (login or register)
        const isLoginPopup = document.getElementById('loginPopup')?.style.display === 'flex';
        const isRegisterPopup = document.getElementById('registerPopup')?.style.display === 'flex';
        
        // Try to determine auth mode from the last button clicked or popup state
        // The active button's image src will contain either 'signin' or 'register'
        const activeButtons = document.querySelectorAll('.google-btn');
        let authMode = 'login'; // Default
        
        // Check if we can determine from the active popup
        if (isRegisterPopup) {
            authMode = 'register';
        } else if (isLoginPopup) {
            authMode = 'login';
        } else {
            // Try to determine from the last active button's image source
            activeButtons.forEach(btn => {
                if (btn.querySelector('img')?.src.includes('register')) {
                    authMode = 'register';
                }
            });
        }
        
        console.log('Auth mode detected as:', authMode);
      // Send the Google user info to your backend
    console.log('Sending request to backend API:', `${apiBaseUrl}/auth/google`);
    
    fetch(`${apiBaseUrl}/auth/google`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: accessToken,
            googleData: data,
            authMode: authMode
        }),
        credentials: 'include' // Send cookies if needed
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('404: Endpoint not found. The API URL may be incorrect.');
            } else if (response.status === 401) {
                throw new Error('401: Authentication failed. Please try again.');
            } else if (response.status === 400) {
                throw new Error('400: Invalid request data.');
            } else if (response.status === 500) {
                throw new Error('500: Server error. Please try again later.');
            } else {
                throw new Error(`${response.status}: Authentication failed.`);
            }
        }
        return response.json();
    })
        .then(result => {            if (result.success) {
                // Show brief success message before redirect
                const activePopup = document.querySelector('.popup-overlay[style*="flex"]');
                const loading = activePopup.querySelector('.loading-popup');
                const isRegister = activePopup.id === 'registerPopup';
                
                // Update the loading message
                const loadingText = loading.querySelector('p');
                const successMessage = isRegister ? 
                    'Account created successfully! Redirecting...' : 
                    'Login successful! Redirecting...';
                loadingText.textContent = successMessage;
                
                // Also show success message in the error alert area (styled as success)
                showAuthMessage(successMessage, 'success');
                
                // Store tokens and user info
                localStorage.setItem('accessToken', result.accessToken);
                localStorage.setItem('refreshToken', result.refreshToken);
                localStorage.setItem('user', JSON.stringify(result.user));
                
                // Show role-specific message in console for debugging
                console.log(`Logged in as ${result.user.role} (${result.user.email})`);
                
                // Redirect to dashboard after a brief delay
                setTimeout(() => {
                    window.location.href = 'pages/dashboard.html';
                }, 1500);
            } else {
                showAuthError(result.message || 'Authentication failed');
            }
        })    .catch(error => {
        console.error('Backend authentication error:', error);
        
        // Handle specific HTTP status code errors
        if (error.message && error.message.includes('404')) {
            showAuthError('Backend service not found. This may be a configuration issue. Please try again later.');
            console.error('API endpoint not found. Check your apiBaseUrl and network configuration.');
        } else if (error.message && error.message.includes('401')) {
            showAuthError('Authentication failed. Please try again or use regular login.');
        } else if (error.message && error.message.includes('400')) {
            // Handle case where user tries to use Google OAuth but has a regular account
            const activePopup = document.querySelector('.popup-overlay[style*="flex"]');
            const isRegisterPopup = activePopup && activePopup.id === 'registerPopup';
            
            if (isRegisterPopup) {
                showAuthError('An account with this email already exists. Please log in instead.');
            } else {
                showAuthError('This email is already registered with a password. Please use your password to log in.');
            }
        } else if (error.message && error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
            showAuthError('Network error. Please check your internet connection and try again.');
            console.error('Network error when contacting the backend API. Check CORS settings and network connectivity.');
        } else {
            showAuthError('Server error. Please try again later.');
        }
        
        // Reset UI state for retry
        const activePopup = document.querySelector('.popup-overlay[style*="flex"]');
        if (activePopup) {
            const form = activePopup.querySelector('.popup-form');
            const loading = activePopup.querySelector('.loading-popup');
            
            form.style.display = 'block';
            loading.style.display = 'none';
        }
    });
    })    .catch(error => {
        console.error('Error fetching Google user info:', error);
        
        // Handle specific errors
        if (error.message && error.message.includes('Failed to fetch')) {
            showAuthError('Network error when retrieving your Google account information. Please check your internet connection and try again.');
        } else if (error.message && error.message.includes('invalid_token')) {
            showAuthError('Your Google authentication session has expired. Please try again.');
        } else {
            showAuthError('Could not retrieve your Google account information. Please try again.');
        }
        
        // Reset UI state for retry
        const activePopup = document.querySelector('.popup-overlay[style*="flex"]');
        if (activePopup) {
            const form = activePopup.querySelector('.popup-form');
            const loading = activePopup.querySelector('.loading-popup');
            
            form.style.display = 'block';
            loading.style.display = 'none';
        }
    });
}

/**
 * Display authentication error or success messages
 * @param {string} message - Message to display
 * @param {string} type - Type of message ('error' or 'success')
 */
function showAuthMessage(message, type = 'error') {
    const activePopup = document.querySelector('.popup-overlay[style*="flex"]');
    if (activePopup) {
        const errorAlert = activePopup.querySelector('.error-alert');
        const form = activePopup.querySelector('.popup-form');
        const loading = activePopup.querySelector('.loading-popup');
        
        // Set message and styling based on type
        errorAlert.textContent = message;
        if (type === 'success') {
            errorAlert.style.color = '#28a745'; // Green color for success
        } else {
            errorAlert.style.color = '#dc3545'; // Red color for errors
        }
        errorAlert.style.display = 'block';
        
        // Show form, hide loading
        if (type === 'error') {
            loading.style.display = 'none';
            form.style.display = 'block';
        }
    }
}

/**
 * Display authentication error messages (backward compatibility)
 * @param {string} message - Error message to display
 */
function showAuthError(message = 'Authentication failed. Please try again.') {
    showAuthMessage(message, 'error');
}

/**
 * Set up Google OAuth button event handlers
 */
function setupGoogleButtons() {
    const googleBtns = document.querySelectorAll('.google-btn');
    googleBtns.forEach(btn => {        // Add tooltip information to help users understand what Google OAuth does
        // Check if this is a register button by looking at the image src
        const isRegisterBtn = btn.querySelector('img')?.src.includes('register');
        btn.title = isRegisterBtn ? 
            'Sign up quickly using your Google account' : 
            'Login securely with your Google account';
            
        btn.addEventListener('click', function() {
            // Show loading state
            const parentPopup = btn.closest('.popup-overlay');
            const form = parentPopup.querySelector('.popup-form');
            const loading = parentPopup.querySelector('.loading-popup');
            const errorAlert = parentPopup.querySelector('.error-alert');
            
            // Clear any previous error messages
            errorAlert.style.display = 'none';
            
            // Check if Google OAuth is available
            if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2) {
                showAuthError('Google authentication is not available. Please try again later or use regular login.');
                return;
            }
            
            // Check if our Google Auth object is initialized
            if (!googleAuth) {
                // Try to initialize again
                try {
                    initializeGoogleAuth();
                    if (!googleAuth) {
                        showAuthError('Failed to initialize Google authentication. Please refresh the page and try again.');
                        return;
                    }
                } catch (error) {
                    console.error('Google Auth initialization error:', error);
                    showAuthError('Failed to initialize Google authentication. Please refresh the page and try again.');
                    return;
                }
            }
            
            // Show loading state
            form.style.display = 'none';
            loading.style.display = 'block';
            
            // Start Google OAuth flow
            try {
                googleAuth.requestAccessToken();
            } catch (error) {
                console.error('Google Auth request error:', error);
                showAuthError('Failed to start authentication. Please try again.');
                // Reset UI state
                form.style.display = 'block';
                loading.style.display = 'none';
            }
        });
    });
}

/**
 * Initialize Google OAuth when the page loads
 */
function handleGoogleLibLoad() {
    if (typeof google !== 'undefined' && google.accounts) {
        // Initialize Google Sign-In
        google.accounts.id.initialize({
            client_id: googleClientId
        });
        
        // Initialize OAuth2 if available
        if (google.accounts.oauth2) {
            initializeGoogleAuth();
        } else {
            console.error('Google OAuth2 library not loaded');
            // Try again after a short delay
            setTimeout(() => {
                if (google.accounts.oauth2) {
                    initializeGoogleAuth();
                } else {                    console.error('Google OAuth2 library failed to load');
                    document.querySelectorAll('.google-btn').forEach(btn => {
                        btn.disabled = true;
                        // Keep the button visual but add error indicator
                        btn.style.opacity = '0.5';
                        btn.style.cursor = 'not-allowed';
                        btn.title = 'Google Sign-In is currently unavailable. Please try again later.';
                    });
                }
            }, 1000);
        }
    } else {        console.error('Google API not loaded');
        // Show a notification to users
        document.querySelectorAll('.google-btn').forEach(btn => {
            btn.disabled = true;
            // Keep the button visual but add error indicator
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = 'Google Sign-In is currently unavailable. Please try again later.';
        });
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if the library is already loaded
    if (document.readyState === 'complete') {
        handleGoogleLibLoad();
    } else {
        // Wait for the page to finish loading
        window.addEventListener('load', handleGoogleLibLoad);
    }
    
    // Set up Google buttons
    setupGoogleButtons();
});

// Export functions for testing
if (typeof module !== 'undefined') {
    module.exports = {
        initializeGoogleAuth,
        handleGoogleOAuthResponse,
        showAuthError,
        setupGoogleButtons,
        handleGoogleLibLoad    };
}
