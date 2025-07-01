/**
 * Landing page forms functionality - COMPLETELY REWRITTEN
 * Handles login/registration popups and form submissions
 */

// Simple and reliable email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const result = emailRegex.test(email.trim());
    console.log(`🔍 Email validation for "${email}": ${result ? 'VALID ✅' : 'INVALID ❌'}`);
    return result;
}

// Clear all form errors
function clearFormErrors() {
    console.log('🧹 Clearing all form errors...');
    document.querySelectorAll('.error-message').forEach(error => {
        error.style.display = 'none';
    });
    document.querySelectorAll('input').forEach(input => {
        input.style.borderColor = '';
    });
    console.log('✅ All form errors cleared');
}

// Show error message
function showError(elementId, message) {
    console.log(`❌ Showing error for ${elementId}: ${message}`);
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        console.log(`✅ Error shown for ${elementId}`);
    } else {
        console.error(`❌ Error element not found: ${elementId}`);
    }
}

// Auto-detect API URL based on environment
function getApiBaseUrl() {
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    return isLocalhost ? 'http://localhost:5000/api' : 'https://smart-pos-system.onrender.com/api';
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Landing forms script loaded');
    
    const apiBaseUrl = getApiBaseUrl();
    console.log('🌐 Using API Base URL:', apiBaseUrl);
    
    // Get all popup elements
    const loginPopup = document.getElementById('loginPopup');
    const registerPopup = document.getElementById('registerPopup');
    const forgotPasswordPopup = document.getElementById('forgotPasswordPopup');
    
    console.log('🔍 Popup elements found:', {
        loginPopup: !!loginPopup,
        registerPopup: !!registerPopup,
        forgotPasswordPopup: !!forgotPasswordPopup
    });
    
    // Get all button elements
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    const forgotPasswordLink = document.getElementById('forgotPassword');
    const backToLoginLink = document.getElementById('backToLogin');
    const closePopupButtons = document.querySelectorAll('.close-popup');
    
    console.log('🔍 Button elements found:', {
        loginBtn: !!loginBtn,
        registerBtn: !!registerBtn,
        switchToRegister: !!switchToRegister,
        switchToLogin: !!switchToLogin,
        closePopupButtons: closePopupButtons.length
    });
    
    // Get form elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    console.log('🔍 Form elements found:', {
        loginForm: !!loginForm,
        registerForm: !!registerForm
    });
    
    // Check registration form inputs specifically
    const shopNameInput = document.getElementById('shopName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('registerPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    console.log('🔍 Registration form inputs found:', {
        shopNameInput: !!shopNameInput,
        emailInput: !!emailInput,
        passwordInput: !!passwordInput,
        confirmPasswordInput: !!confirmPasswordInput
    });
    
    // Initially hide all error messages
    clearFormErrors();
    
    // Popup show/hide functionality
    loginBtn?.addEventListener('click', function(e) {
        e.preventDefault();
        clearFormErrors();
        loginPopup.style.display = 'flex';
    });
    
    registerBtn?.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('🚀 REGISTER BUTTON CLICKED!');
        clearFormErrors();
        registerPopup.style.display = 'flex';
        console.log('✅ Register popup opened');
    });
    
    // Hero and other Get Started buttons
    document.getElementById('heroGetStarted')?.addEventListener('click', function(e) {
        e.preventDefault();
        clearFormErrors();
        registerPopup.style.display = 'flex';
    });
    
    document.querySelectorAll('.pricing-get-started').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            clearFormErrors();
            registerPopup.style.display = 'flex';
        });
    });
    
    document.getElementById('ctaGetStarted')?.addEventListener('click', function(e) {
        e.preventDefault();
        clearFormErrors();
        registerPopup.style.display = 'flex';
    });
    
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
    closePopupButtons.forEach(button => {
        button.addEventListener('click', function() {
            clearFormErrors();
            loginPopup.style.display = 'none';
            registerPopup.style.display = 'none';
            forgotPasswordPopup.style.display = 'none';
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
        console.log('Login form submitted');
        
        // Clear previous errors
        clearFormErrors();
        document.getElementById('loginErrorAlert').style.display = 'none';
        
        // Get form values
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        // Validate inputs
        let hasError = false;
        
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
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Store user data using auth service if available
                if (window.authService) {
                    const refreshToken = data.refreshToken || getCookieValue('refresh_token');
                    window.authService.saveTokenData(data.token, refreshToken, data.user);
                }
                
                // Redirect to dashboard
                window.location.href = 'pages/dashboard.html';
            } else {
                // Show error
                loginForm.style.display = 'block';
                loginLoading.style.display = 'none';
                const errorAlert = document.getElementById('loginErrorAlert');
                errorAlert.textContent = data.message || 'Login failed';
                errorAlert.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginForm.style.display = 'block';
            loginLoading.style.display = 'none';
            const errorAlert = document.getElementById('loginErrorAlert');
            errorAlert.textContent = 'Network error. Please try again.';
            errorAlert.style.display = 'block';
        }
    });
    
    // REGISTRATION FORM HANDLING
    registerForm?.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('🚀 REGISTRATION FORM SUBMITTED!');
        
        // Clear ALL previous errors completely
        clearFormErrors();
        const registerErrorAlert = document.getElementById('registerErrorAlert');
        if (registerErrorAlert) {
            registerErrorAlert.style.display = 'none';
        }
        
        // Get form values with proper element checking
        const shopNameInput = document.getElementById('shopName');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('registerPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        console.log('📋 Form elements found:', {
            shopNameInput: !!shopNameInput,
            emailInput: !!emailInput,
            passwordInput: !!passwordInput,
            confirmPasswordInput: !!confirmPasswordInput
        });
        
        const shopName = shopNameInput ? shopNameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
        
        console.log('📝 Form values extracted:', { 
            shopName: `"${shopName}"`, 
            email: `"${email}"`, 
            password: password ? '***' : 'EMPTY',
            confirmPassword: confirmPassword ? '***' : 'EMPTY'
        });
        
        // Validate inputs one by one with detailed logging
        let hasError = false;
        
        // Shop name validation
        console.log('🏪 Validating shop name...');
        if (!shopName || shopName === '') {
            console.log('❌ Shop name is empty');
            showError('shopNameError', 'Shop name is required');
            hasError = true;
        } else {
            console.log('✅ Shop name is valid');
        }
        
        // Email validation - MOST IMPORTANT
        console.log('📧 Validating email...');
        console.log(`📧 Email value: "${email}"`);
        console.log(`📧 Email length: ${email.length}`);
        console.log(`📧 Email is truthy: ${!!email}`);
        
        if (!email || email === '' || email.length === 0) {
            console.log('❌ Email is EMPTY - showing error');
            showError('emailError', 'Email is required');
            hasError = true;
        } else {
            console.log('📧 Email has content, checking format...');
            if (!isValidEmail(email)) {
                console.log('❌ Email format is INVALID');
                showError('emailError', 'Please enter a valid email address');
                hasError = true;
            } else {
                console.log('✅ Email is VALID!');
            }
        }
        
        // Password validation
        console.log('🔒 Validating password...');
        if (!password || password === '') {
            console.log('❌ Password is empty');
            showError('registerPasswordError', 'Password is required');
            hasError = true;
        } else if (password.length < 6) {
            console.log('❌ Password too short');
            showError('registerPasswordError', 'Password must be at least 6 characters');
            hasError = true;
        } else {
            console.log('✅ Password is valid');
        }
        
        // Confirm password validation
        console.log('🔒 Validating confirm password...');
        if (!confirmPassword || confirmPassword === '') {
            console.log('❌ Confirm password is empty');
            showError('confirmPasswordError', 'Please confirm your password');
            hasError = true;
        } else if (password !== confirmPassword) {
            console.log('❌ Passwords do not match');
            showError('confirmPasswordError', 'Passwords do not match');
            hasError = true;
        } else {
            console.log('✅ Confirm password is valid');
        }
        
        console.log(`🏁 Validation complete. Has errors: ${hasError}`);
        
        if (hasError) {
            console.log('❌ VALIDATION FAILED - STOPPING HERE');
            return;
        }
        
        console.log('✅ ALL VALIDATION PASSED - PROCEEDING WITH API CALL');
        
        // Show loading state
        const registerLoading = registerPopup.querySelector('.loading-popup');
        registerForm.style.display = 'none';
        registerLoading.style.display = 'block';
        
        try {
            console.log('🌐 Making API request...');
            const requestData = {
                email,
                password,
                confirmPassword,
                shopName,
                role: 'shopowner'
            };
            console.log('📤 Request data:', requestData);
            
            const response = await fetch(`${apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            const data = await response.json();
            console.log('📥 Registration response:', data);
            
            if (response.ok && data.success) {
                console.log('🎉 REGISTRATION SUCCESS!');
                // Clear form
                if (shopNameInput) shopNameInput.value = '';
                if (emailInput) emailInput.value = '';
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
                    loginErrorAlert.style.color = '#28a745';
                    loginErrorAlert.style.display = 'block';
                }
                
                // Pre-fill email in login form
                const loginEmailInput = document.getElementById('loginEmail');
                if (loginEmailInput) loginEmailInput.value = email;
                
            } else {
                console.log('❌ REGISTRATION FAILED:', data);
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
            console.error('💥 Registration network error:', error);
            registerForm.style.display = 'block';
            registerLoading.style.display = 'none';
            if (registerErrorAlert) {
                registerErrorAlert.textContent = 'Network error. Please try again.';
                registerErrorAlert.style.display = 'block';
            }
        }
    });
    
    // Real-time email validation feedback (but don't show errors while typing)
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
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
