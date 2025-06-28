/**
 * Landing page forms functionality
 * Handles login/registration popups and form submissions
 */

// Email validation function - simplified and more practical
function isValidEmail(email) {
    // Basic email validation - checks for @ and at least one dot in domain
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim()) && email.trim().length > 0;
}

// Popup functionality        
document.addEventListener('DOMContentLoaded', function() {
    console.log('Landing forms script loaded');
    
    // Hide all error messages initially
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => {
        error.style.display = 'none';
    });
    console.log('Error messages hidden initially');
    
    const loginPopup = document.getElementById('loginPopup');
    const registerPopup = document.getElementById('registerPopup');
    const forgotPasswordPopup = document.getElementById('forgotPasswordPopup');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const backToLoginLink = document.getElementById('backToLogin');
    const closePopupButtons = document.querySelectorAll('.close-popup');
            
            // Show login popup
            loginBtn.addEventListener('click', function(e) {
                e.preventDefault();
                loginPopup.style.display = 'flex';
            });
            
            // Show register popup
            registerBtn.addEventListener('click', function(e) {
                e.preventDefault();
                registerPopup.style.display = 'flex';
            });
            
            // Get Started button in hero section
            const heroGetStarted = document.getElementById('heroGetStarted');
            if (heroGetStarted) {
                heroGetStarted.addEventListener('click', function(e) {
                    e.preventDefault();
                    registerPopup.style.display = 'flex';
                });
            }
            
            // Pricing "Get Started" buttons
            const pricingGetStartedButtons = document.querySelectorAll('.pricing-get-started');
            pricingGetStartedButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    registerPopup.style.display = 'flex';
                });
            });
            
            // CTA "Get Started Today" button
            const ctaGetStarted = document.getElementById('ctaGetStarted');
            if (ctaGetStarted) {
                ctaGetStarted.addEventListener('click', function(e) {
                    e.preventDefault();
                    registerPopup.style.display = 'flex';
                });
            }
            
            // Switch between popups
            switchToRegister.addEventListener('click', function(e) {
                e.preventDefault();
                loginPopup.style.display = 'none';
                registerPopup.style.display = 'flex';
            });
            
            switchToLogin.addEventListener('click', function(e) {
                e.preventDefault();
                registerPopup.style.display = 'none';
                loginPopup.style.display = 'flex';
            });
            
            // Forgot Password functionality
            forgotPasswordLink.addEventListener('click', function(e) {
                e.preventDefault();
                loginPopup.style.display = 'none';
                forgotPasswordPopup.style.display = 'flex';
            });
            
            backToLoginLink.addEventListener('click', function(e) {
                e.preventDefault();
                forgotPasswordPopup.style.display = 'none';
                loginPopup.style.display = 'flex';
            });
            
            // Close popups
            closePopupButtons.forEach(button => {
                button.addEventListener('click', function() {
                    loginPopup.style.display = 'none';
                    registerPopup.style.display = 'none';
                    forgotPasswordPopup.style.display = 'none';
                });
            });
            
            // Close popup when clicking outside
            window.addEventListener('click', function(e) {
                if (e.target === loginPopup) {
                    loginPopup.style.display = 'none';
                }
                if (e.target === registerPopup) {
                    registerPopup.style.display = 'none';
                }
                if (e.target === forgotPasswordPopup) {
                    forgotPasswordPopup.style.display = 'none';
                }
            });
            
            // Login form handling
            const loginForm = document.getElementById('loginForm');
            const loginLoading = loginPopup.querySelector('.loading-popup');
            const loginErrorAlert = document.getElementById('loginErrorAlert');
            
            // Hide loading spinner initially
            loginLoading.style.display = 'none';
            
            // Set API base URL to Render backend only (no local testing)
const apiBaseUrl = 'https://smart-pos-system.onrender.com/api';
            
            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                // Clear previous error messages
                document.getElementById('loginEmailError').style.display = 'none';
                document.getElementById('loginPasswordError').style.display = 'none';
                loginErrorAlert.style.display = 'none';
                
                const email = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value;

                console.log('Login form values:', { email, password: '***' });

                // Validate email
                if (!email) {
                    document.getElementById('loginEmailError').textContent = 'Email is required';
                    document.getElementById('loginEmailError').style.display = 'block';
                    return;
                } else if (!isValidEmail(email)) {
                    document.getElementById('loginEmailError').textContent = 'Please enter a valid email address';
                    document.getElementById('loginEmailError').style.display = 'block';
                    console.log('Login email validation failed for:', email);
                    return;
                }
                
                // Validate password
                if (!password) {
                    document.getElementById('loginPasswordError').textContent = 'Password is required';
                    document.getElementById('loginPasswordError').style.display = 'block';
                    return;
                }

                console.log('Login validation passed, proceeding...');

    // Show loading spinner
    loginForm.style.display = 'none';
    loginLoading.style.display = 'block';
    loginErrorAlert.style.display = 'none';
    try {
        const result = await window.authService.login(email, password);
        if (result.success) {
            // Redirect to dashboard
            window.location.href = 'pages/dashboard.html';
        } else {
            loginForm.style.display = 'block';
            loginLoading.style.display = 'none';
            // Show error message
            loginErrorAlert.textContent = result.message || 'Login failed';
            loginErrorAlert.style.display = 'block';
        }
    } catch (err) {
        loginForm.style.display = 'block';
        loginLoading.style.display = 'none';
        loginErrorAlert.textContent = 'Network error. Please try again.';
        loginErrorAlert.style.display = 'block';
    }
});
            
            // Register form handling
            const registerForm = document.getElementById('registerForm');
            const registerLoading = registerPopup.querySelector('.loading-popup');
            const registerErrorAlert = document.getElementById('registerErrorAlert');
            // Hide loading spinner initially
            registerLoading.style.display = 'none';
            
            registerForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                // Clear all previous error messages
                document.getElementById('emailError').style.display = 'none';
                document.getElementById('shopNameError').style.display = 'none';
                document.getElementById('registerPasswordError').style.display = 'none';
                document.getElementById('confirmPasswordError').style.display = 'none';
                registerErrorAlert.style.display = 'none';
                
                // Get form values
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('registerPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const shopName = document.getElementById('shopName') ? document.getElementById('shopName').value.trim() : '';
                
                console.log('Registration form values:', { email, password: '***', shopName });
                
                let hasError = false;
                
                // Validate email
                if (!email) {
                    document.getElementById('emailError').textContent = 'Email is required';
                    document.getElementById('emailError').style.display = 'block';
                    hasError = true;
                } else if (!isValidEmail(email)) {
                    document.getElementById('emailError').textContent = 'Please enter a valid email address';
                    document.getElementById('emailError').style.display = 'block';
                    hasError = true;
                    console.log('Email validation failed for:', email);
                }
                
                // Validate shop name
                if (!shopName) {
                    document.getElementById('shopNameError').textContent = 'Shop name is required';
                    document.getElementById('shopNameError').style.display = 'block';
                    hasError = true;
                }
                
                // Validate password
                if (!password) {
                    document.getElementById('registerPasswordError').textContent = 'Password is required';
                    document.getElementById('registerPasswordError').style.display = 'block';
                    hasError = true;
                } else if (password.length < 6) {
                    document.getElementById('registerPasswordError').textContent = 'Password must be at least 6 characters';
                    document.getElementById('registerPasswordError').style.display = 'block';
                    hasError = true;
                }
                
                // Validate password confirmation
                if (!confirmPassword) {
                    document.getElementById('confirmPasswordError').textContent = 'Please confirm your password';
                    document.getElementById('confirmPasswordError').style.display = 'block';
                    hasError = true;
                } else if (password !== confirmPassword) {
                    document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
                    document.getElementById('confirmPasswordError').style.display = 'block';
                    hasError = true;
                }
                
                if (hasError) {
                    console.log('Registration validation failed');
                    return;
                }
                
                console.log('Registration validation passed, proceeding...');
                // Show loading spinner
                registerForm.style.display = 'none';
                registerLoading.style.display = 'block';
                registerErrorAlert.style.display = 'none';
                try {
                    // Prepare user data for registration
                    const userData = {
                        email: email.trim(),
                        password,
                        confirmPassword,
                        shopName: shopName,
                        role: 'shopowner' // Default role
                    };
                    const result = await window.authService.register(userData);
                    if (result.success) {
                        // Show login popup after successful registration
                        registerPopup.style.display = 'none';
                        loginPopup.style.display = 'flex';
                        registerForm.style.display = 'block';
                        registerLoading.style.display = 'none';
                        // Show success message in login popup
                        loginErrorAlert.textContent = 'Registration successful! Please log in.';
                        loginErrorAlert.style.color = '#28a745';
                        loginErrorAlert.style.display = 'block';
                    } else {
                        registerForm.style.display = 'block';
                        registerLoading.style.display = 'none';
                        registerErrorAlert.textContent = result.message || 'Registration failed';
                        registerErrorAlert.style.display = 'block';
                    }
                } catch (err) {
                    registerForm.style.display = 'block';
                    registerLoading.style.display = 'none';
                    registerErrorAlert.textContent = 'Network error. Please try again.';
                    registerErrorAlert.style.display = 'block';
                }
            });
            
            // Forgot Password form handling
            const forgotPasswordForm = document.getElementById('forgotPasswordForm');
            const forgotPasswordLoading = forgotPasswordPopup.querySelector('.loading-popup');
            const forgotPasswordAlert = document.getElementById('forgotPasswordAlert');
            
            // Hide loading spinner initially
            forgotPasswordLoading.style.display = 'none';
            
            forgotPasswordForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const email = document.getElementById('resetEmail').value.trim();
                // Robust email validation
                if (!isValidEmail(email)) {
                    document.getElementById('resetEmailError').style.display = 'block';
                    return;
                } else {
                    document.getElementById('resetEmailError').style.display = 'none';
                }
                
                // Show loading spinner
                forgotPasswordForm.style.display = 'none';
                forgotPasswordLoading.style.display = 'block';
                forgotPasswordAlert.style.display = 'none';
                
                // Send password reset request to backend
                try {
                    const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email })
                    });
                    
                    // Hide loading spinner
                    forgotPasswordLoading.style.display = 'none';
                    forgotPasswordForm.style.display = 'block';
                    
                    if (response.ok) {
                        // Show success message
                        forgotPasswordAlert.textContent = 'Password reset link has been sent to your email address.';
                        forgotPasswordAlert.className = 'message-alert success';
                        forgotPasswordAlert.style.display = 'block';
                        
                        // Clear the email field
                        document.getElementById('resetEmail').value = '';
                    } else {
                        // Show error message
                        forgotPasswordAlert.textContent = 'Failed to send password reset link. Please try again.';
                        forgotPasswordAlert.className = 'message-alert error';
                        forgotPasswordAlert.style.display = 'block';
                    }
                } catch (err) {
                    // Hide loading spinner
                    forgotPasswordLoading.style.display = 'none';
                    forgotPasswordForm.style.display = 'block';
                    
                    // Show error message
                    forgotPasswordAlert.textContent = 'Network error. Please try again.';
                    forgotPasswordAlert.className = 'message-alert error';
                    forgotPasswordAlert.style.display = 'block';
                }
            });
            
            // Debug function for testing email validation
            window.testEmailValidation = function(email) {
                console.log('Testing email:', email);
                console.log('Is valid:', isValidEmail(email));
                return isValidEmail(email);
            };
            
            // Add real-time email validation feedback
            document.getElementById('email').addEventListener('input', function() {
                const email = this.value.trim();
                const errorElement = document.getElementById('emailError');
                
                if (email.length > 0) {
                    if (isValidEmail(email)) {
                        errorElement.style.display = 'none';
                        this.style.borderColor = '#28a745'; // Green border for valid email
                    } else {
                        errorElement.textContent = 'Please enter a valid email address';
                        errorElement.style.display = 'block';
                        this.style.borderColor = '#dc3545'; // Red border for invalid email
                    }
                } else {
                    errorElement.style.display = 'none';
                    this.style.borderColor = ''; // Reset border
                }
            });
            
            // Add real-time email validation feedback for login
            document.getElementById('loginEmail').addEventListener('input', function() {
                const email = this.value.trim();
                const errorElement = document.getElementById('loginEmailError');
                
                if (email.length > 0) {
                    if (isValidEmail(email)) {
                        errorElement.style.display = 'none';
                        this.style.borderColor = '#28a745'; // Green border for valid email
                    } else {
                        errorElement.textContent = 'Please enter a valid email address';
                        errorElement.style.display = 'block';
                        this.style.borderColor = '#dc3545'; // Red border for invalid email
                    }
                } else {
                    errorElement.style.display = 'none';
                    this.style.borderColor = ''; // Reset border
                }
            });
        });
