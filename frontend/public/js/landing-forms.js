/**
 * Landing page forms functionality
 * Handles login/registration popups and form submissions
 */

// Popup functionality
        document.addEventListener('DOMContentLoaded', function() {
            const loginPopup = document.getElementById('loginPopup');
            const registerPopup = document.getElementById('registerPopup');
            const loginBtn = document.getElementById('loginBtn');
            const registerBtn = document.getElementById('registerBtn');
            const switchToRegister = document.getElementById('switchToRegister');
            const switchToLogin = document.getElementById('switchToLogin');
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
            
            // Close popups
            closePopupButtons.forEach(button => {
                button.addEventListener('click', function() {
                    loginPopup.style.display = 'none';
                    registerPopup.style.display = 'none';
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
                const username = document.getElementById('loginUsername').value;
                const password = document.getElementById('loginPassword').value;

                // Basic validation
                if (!username) {
                    document.getElementById('loginUsernameError').style.display = 'block';
                    return;
                } else {
                    document.getElementById('loginUsernameError').style.display = 'none';
                }
                if (!password) {
                    document.getElementById('loginPasswordError').style.display = 'block';
                    return;
                } else {
                    document.getElementById('loginPasswordError').style.display = 'none';
                }

                // Show loading spinner
                loginForm.style.display = 'none';
                loginLoading.style.display = 'block';
                loginErrorAlert.style.display = 'none';

                // Send login request to backend
                try {
                    const response = await fetch(`${apiBaseUrl}/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({ email: username, password })
                    });
                    let data = {};
                    try {
                        data = await response.json();
                    } catch (jsonErr) {
                        // If response is not JSON, treat as error
                        data = {};
                    }
                    if (response.ok && data.success) {
                        // Save token/user info if needed
                        localStorage.setItem('neopos_auth_token', data.token);
                        localStorage.setItem('neopos_user', JSON.stringify(data.user));
                        // Redirect to dashboard
                        window.location.href = 'pages/dashboard.html';
                    } else {
                        loginForm.style.display = 'block';
                        loginLoading.style.display = 'none';
                        // Show specific error for wrong credentials
                        if (response.status === 401 || response.status === 400) {
                            loginErrorAlert.textContent = 'Wrong username or password.';
                        } else {
                            loginErrorAlert.textContent = data.message || 'Login failed';
                        }
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
                // Basic validation
                const email = document.getElementById('registerEmail').value;
                const password = document.getElementById('registerPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const name = document.getElementById('registerName') ? document.getElementById('registerName').value : '';
                let hasError = false;
                if (!email) {
                    document.getElementById('registerEmailError').style.display = 'block';
                    hasError = true;
                } else {
                    document.getElementById('registerEmailError').style.display = 'none';
                }
                if (!password) {
                    document.getElementById('registerPasswordError').style.display = 'block';
                    hasError = true;
                } else {
                    document.getElementById('registerPasswordError').style.display = 'none';
                }
                if (password !== confirmPassword) {
                    document.getElementById('confirmPasswordError').style.display = 'block';
                    hasError = true;
                } else {
                    document.getElementById('confirmPasswordError').style.display = 'none';
                }
                if (hasError) return;
                // Show loading spinner
                registerForm.style.display = 'none';
                registerLoading.style.display = 'block';
                registerErrorAlert.style.display = 'none';
                // Send registration request to backend
                try {
                    const response = await fetch(`${apiBaseUrl}/auth/register`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({ email, password, name })
                    });
                    const data = await response.json();
                    if (data.success) {
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
                        registerErrorAlert.textContent = data.message || 'Registration failed';
                        registerErrorAlert.style.display = 'block';
                    }
                } catch (err) {
                    registerForm.style.display = 'block';
                    registerLoading.style.display = 'none';
                    registerErrorAlert.textContent = 'Network error. Please try again.';
                    registerErrorAlert.style.display = 'block';
                }
            });
        });
