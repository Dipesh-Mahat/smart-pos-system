/**
 * Landing page forms functionality - COMPLETELY REWRITTEN
 * Handles login/registration popups and form submissions
 */

// Simple and reliable email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

// Clear all form errors
function clearFormErrors() {
    document.querySelectorAll('.error-message').forEach(error => {
        error.style.display = 'none';
    });
    document.querySelectorAll('input').forEach(input => {
        input.style.borderColor = '';
    });
    
    // Reset alert elements to default error styling
    const loginErrorAlert = document.getElementById('loginErrorAlert');
    if (loginErrorAlert) {
        loginErrorAlert.className = 'error-alert';
        loginErrorAlert.style.display = 'none';
    }
}

// Show error message
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Auto-detect API URL based on environment
function getApiBaseUrl() {
    // Auto-detect based on hostname
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    // Use localhost for development, Render for production
    const apiUrl = isLocalhost ? 'http://localhost:5000/api' : 'https://smart-pos-system.onrender.com/api';
    
    console.log(`🌐 Environment: ${isLocalhost ? 'Development' : 'Production'}`);
    console.log(`🌐 API URL: ${apiUrl}`);
    
    return apiUrl;
}

document.addEventListener('DOMContentLoaded', function() {
    const apiBaseUrl = getApiBaseUrl();
    
    // Get all popup elements
    const loginPopup = document.getElementById('loginPopup');
    const registerPopup = document.getElementById('registerPopup');
    const forgotPasswordPopup = document.getElementById('forgotPasswordPopup');
    
    // Get all button elements
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const backToLoginLink = document.getElementById('backToLogin');
    const closePopupButtons = document.querySelectorAll('.close-popup');
    
    // Get form elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    // Initially hide all error messages
    clearFormErrors();
    
    // Popup show/hide functionality
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearFormErrors();
            if (loginPopup) {
                loginPopup.style.display = 'flex';
            }
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            clearFormErrors();
            if (registerPopup) {
                registerPopup.style.display = 'flex';
            }
        });
    }
    
    // Hero and other Get Started buttons
    const heroGetStarted = document.getElementById('heroGetStarted');
    if (heroGetStarted) {
        heroGetStarted.addEventListener('click', function(e) {
            e.preventDefault();
            clearFormErrors();
            if (registerPopup) {
                registerPopup.style.display = 'flex';
            }
        });
    }
    
    const pricingButtons = document.querySelectorAll('.pricing-get-started');
    pricingButtons.forEach((button) => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            clearFormErrors();
            if (registerPopup) {
                registerPopup.style.display = 'flex';
            }
        });
    });
    
    const ctaGetStarted = document.getElementById('ctaGetStarted');
    if (ctaGetStarted) {
        ctaGetStarted.addEventListener('click', function(e) {
            e.preventDefault();
            clearFormErrors();
            if (registerPopup) {
                registerPopup.style.display = 'flex';
            }
        });
    }
    
    // Switch between popups
    switchToRegister?.addEventListener('click', function(e) {
        e.preventDefault();
        clearFormErrors();
        loginPopup.style.display = 'none';
        registerPopup.style.display = 'flex';
    });
    
    switchToLogin?.addEventListener('click', function(e) {
        e.preventDefault();
        clearFormErrors();
        registerPopup.style.display = 'none';
        loginPopup.style.display = 'flex';
    });
    
    // Forgot password functionality
    forgotPasswordLink?.addEventListener('click', function(e) {
        e.preventDefault();
        clearFormErrors();
        loginPopup.style.display = 'none';
        forgotPasswordPopup.style.display = 'flex';
    });
    
    backToLoginLink?.addEventListener('click', function(e) {
        e.preventDefault();
        clearFormErrors();
        forgotPasswordPopup.style.display = 'none';
        loginPopup.style.display = 'flex';
    });
    
    // Close popups
    closePopupButtons.forEach((button) => {
        button.addEventListener('click', function() {
            clearFormErrors();
            if (loginPopup) loginPopup.style.display = 'none';
            if (registerPopup) registerPopup.style.display = 'none';
            if (forgotPasswordPopup) forgotPasswordPopup.style.display = 'none';
        });
    });
    
    // Close popup when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === loginPopup) {
            clearFormErrors();
            loginPopup.style.display = 'none';
        }
        if (e.target === registerPopup) {
            clearFormErrors();
            registerPopup.style.display = 'none';
        }
        if (e.target === forgotPasswordPopup) {
            clearFormErrors();
            forgotPasswordPopup.style.display = 'none';
        }
    });
    
    // LOGIN FORM HANDLING
    loginForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear previous errors
        clearFormErrors();
        
        // Get form values
        const userType = document.getElementById('loginUserType').value;
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        // Validate inputs
        let hasError = false;
        
        if (!userType) {
            hasError = true;
        }
        
        if (!email) {
            showError('loginEmailError', 'Email is required');
            hasError = true;
        } else if (!isValidEmail(email)) {
            showError('loginEmailError', 'Please enter a valid email address');
            hasError = true;
        }
        
        if (!password) {
            showError('loginPasswordError', 'Password is required');
            hasError = true;
        }
        
        if (hasError) return;
        
        // Show loading state
        const loginLoading = loginPopup.querySelector('.loading-popup');
        loginForm.style.display = 'none';
        loginLoading.style.display = 'block';
        
        try {
            const response = await fetch(`${apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    email, 
                    password,
                    role: userType // Include the user role in the login request
                })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Store user data using auth service if available
                if (window.authService) {
                    const refreshToken = data.refreshToken || getCookieValue('refresh_token');
                    
                    // Debug log for troubleshooting
                    console.log('User data received from server:', {
                        role: data.user?.role,
                        email: data.user?.email,
                        id: data.user?.id
                    });
                    
                    window.authService.saveTokenData(data.token, refreshToken, data.user);
                    
                    // Also store for backward compatibility
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('accessToken', data.token);
                }
                
                // Redirect based on user role
                if (data.user && data.user.role) {
                    console.log('Login successful as:', data.user.role);
                    // Admin users should always go to admin dashboard, regardless of selected role
                    if (data.user.role === 'admin') {
                        window.location.href = 'pages/admin-dashboard.html';
                    } else {
                        // For non-admin users, redirect based on their role
                        switch (data.user.role) {
                            case 'supplier':
                                window.location.href = 'pages/supplier-dashboard.html';
                                break;
                            case 'shopowner':
                            default:
                                window.location.href = 'pages/dashboard.html';
                                break;
                        }
                    }
                } else {
                    // Default redirect if no role information
                    console.log('No role information, using default redirect');
                    window.location.href = 'pages/dashboard.html';
                }
            } else {
                // Show error
                loginForm.style.display = 'block';
                loginLoading.style.display = 'none';
                const errorAlert = document.getElementById('loginErrorAlert');
                
                // Provide more specific error message for role mismatch
                let errorMessage = data.message || 'Login failed';
                if (data.message === 'Invalid credentials' && userType !== 'admin') {
                    errorMessage = `Invalid credentials or this email is not registered as a ${userType}. Please check your user type selection.`;
                }
                
                errorAlert.textContent = errorMessage;
                errorAlert.className = 'error-alert';  // Reset to error styling
                errorAlert.style.display = 'block';
                
                // Log the error for debugging
                console.error('Login failed:', data);
            }
        } catch (error) {
            console.error('Login error:', error);
            loginForm.style.display = 'block';
            loginLoading.style.display = 'none';
            const errorAlert = document.getElementById('loginErrorAlert');
            errorAlert.textContent = 'Network error. Please try again.';
            errorAlert.className = 'error-alert';  // Reset to error styling
            errorAlert.style.display = 'block';
        }
    });
    
    // REGISTRATION FORM HANDLING
    registerForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Clear ALL previous errors completely
        clearFormErrors();
        const registerErrorAlert = document.getElementById('registerErrorAlert');
        if (registerErrorAlert) {
            registerErrorAlert.style.display = 'none';
        }
        
        // Get form values with proper element checking
        const userTypeInput = document.getElementById('registerUserType');
        const shopNameInput = document.getElementById('shopName');
        const companyNameInput = document.getElementById('companyName');
        const regEmailInput = document.getElementById('email');
        const passwordInput = document.getElementById('registerPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        const userType = userTypeInput ? userTypeInput.value : 'shopowner';
        const shopName = shopNameInput ? shopNameInput.value.trim() : '';
        const companyName = companyNameInput ? companyNameInput.value.trim() : '';
        const email = regEmailInput ? regEmailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
        
        // Validate inputs
        let hasError = false;
        
        // Name validation based on user type
        if (userType === 'shopowner') {
            if (!shopName || shopName === '') {
                showError('shopNameError', 'Shop name is required');
                hasError = true;
            }
        } else if (userType === 'supplier') {
            if (!companyName || companyName === '') {
                showError('companyNameError', 'Company name is required');
                hasError = true;
            }
        }
        
        // Email validation
        if (!email || email === '' || email.length === 0) {
            showError('emailError', 'Email is required');
            hasError = true;
        } else if (!isValidEmail(email)) {
            showError('emailError', 'Please enter a valid email address');
            hasError = true;
        }
        
        // Password validation
        if (!password || password === '') {
            showError('registerPasswordError', 'Password is required');
            hasError = true;
        } else if (password.length < 6) {
            showError('registerPasswordError', 'Password must be at least 6 characters');
            hasError = true;
        }
        
        // Confirm password validation
        if (!confirmPassword || confirmPassword === '') {
            showError('confirmPasswordError', 'Please confirm your password');
            hasError = true;
        } else if (password !== confirmPassword) {
            showError('confirmPasswordError', 'Passwords do not match');
            hasError = true;
        }
        
        if (hasError) return;
        
        // Show loading state
        const registerLoading = registerPopup.querySelector('.loading-popup');
        registerForm.style.display = 'none';
        registerLoading.style.display = 'block';
        
        try {
            const requestData = {
                email,
                password,
                confirmPassword,
                role: userType
            };
            
            // Add the appropriate name field based on user type
            if (userType === 'shopowner') {
                requestData.shopName = shopName;
            } else if (userType === 'supplier') {
                requestData.companyName = companyName;
            }
            
            const response = await fetch(`${apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Clear form
                if (shopNameInput) shopNameInput.value = '';
                if (regEmailInput) regEmailInput.value = '';
                if (passwordInput) passwordInput.value = '';
                if (confirmPasswordInput) confirmPasswordInput.value = '';
                
                // Show success and switch to login
                registerPopup.style.display = 'none';
                loginPopup.style.display = 'flex';
                registerForm.style.display = 'block';
                registerLoading.style.display = 'none';
                
                const loginErrorAlert = document.getElementById('loginErrorAlert');
                if (loginErrorAlert) {
                    loginErrorAlert.textContent = 'Registration successful! Please log in.';
                    // Remove error styling and add success styling
                    loginErrorAlert.className = 'success-alert';
                    loginErrorAlert.style.display = 'block';
                }
                
                // Pre-fill email in login form
                const loginEmailInputField = document.getElementById('loginEmail');
                if (loginEmailInputField) loginEmailInputField.value = email;
                
            } else {
                // Show errors
                registerForm.style.display = 'block';
                registerLoading.style.display = 'none';
                
                // Handle specific validation errors
                if (data.errors) {
                    Object.keys(data.errors).forEach(field => {
                        const errorElementId = field + 'Error';
                        showError(errorElementId, data.errors[field]);
                    });
                }
                
                // Show general error
                if (registerErrorAlert) {
                    registerErrorAlert.textContent = data.message || 'Registration failed';
                    registerErrorAlert.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Registration network error:', error);
            registerForm.style.display = 'block';
            registerLoading.style.display = 'none';
            if (registerErrorAlert) {
                registerErrorAlert.textContent = 'Network error. Please try again.';
                registerErrorAlert.style.display = 'block';
            }
        }
    });
    
    // Real-time email validation feedback (but don't show errors while typing)
    const registerEmailInput = document.getElementById('email');
    if (registerEmailInput) {
        registerEmailInput.addEventListener('input', function() {
            const emailError = document.getElementById('emailError');
            if (emailError && emailError.style.display === 'block') {
                // Only hide the error if it's currently showing
                if (this.value.trim() && isValidEmail(this.value.trim())) {
                    emailError.style.display = 'none';
                    this.style.borderColor = '#28a745';
                }
            }
        });
    }
    
    // Helper function to get cookie value
    function getCookieValue(name) {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                return cookie.substring(name.length + 1);
            }
        }
        return null;
    }
});
