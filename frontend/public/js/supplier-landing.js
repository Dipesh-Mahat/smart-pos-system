// Enhanced Supplier Landing Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initializePageLoader();
    initializeMobileMenu();
    initializeNavbarScroll();
    initializeScrollToTop();
    initializeSmoothScrolling();
    initializeFormValidation();
    initializeAnimations();
    initializeAccessibility();
});

// Page Loading Functionality
function initializePageLoader() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
        }, 500);
    }
}

// Mobile Menu Toggle
function initializeMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
        
        // Close menu when clicking on links
        const navItems = navLinks.querySelectorAll('a');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    }
}

// Navbar Scroll Effect
function initializeNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Scroll to Top Button
function initializeScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    if (scrollToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });
        
        scrollToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Smooth Scrolling for Anchor Links
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Enhanced Form Validation
function initializeFormValidation() {
    const form = document.getElementById('supplierApplicationForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate required fields
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            const formGroup = field.closest('.form-group');
            
            if (!field.value.trim()) {
                showFieldError(formGroup, 'This field is required');
                isValid = false;
            } else {
                showFieldSuccess(formGroup);
            }
        });
        
        // Validate email format
        const emailField = form.querySelector('input[type="email"]');
        if (emailField && emailField.value) {
            if (!isValidEmail(emailField.value)) {
                showFieldError(emailField.closest('.form-group'), 'Please enter a valid email address');
                isValid = false;
            }
        }
        
        // Check if at least one category is selected
        const categories = form.querySelectorAll('input[name="categories"]:checked');
        const categoryGroup = form.querySelector('.checkbox-group').closest('.form-group');
        
        if (categories.length === 0) {
            showFieldError(categoryGroup, 'Please select at least one product category');
            isValid = false;
        } else {
            showFieldSuccess(categoryGroup);
        }
        
        if (isValid) {
            submitForm(form);
        } else {
            // Scroll to first error
            const firstError = form.querySelector('.form-group.error');
            if (firstError) {
                firstError.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    });
    
    // Real-time validation
    form.addEventListener('input', function(e) {
        const field = e.target;
        const formGroup = field.closest('.form-group');
        
        if (field.hasAttribute('required') && field.value.trim()) {
            showFieldSuccess(formGroup);
        }
        
        // Email validation
        if (field.type === 'email' && field.value) {
            if (isValidEmail(field.value)) {
                showFieldSuccess(formGroup);
            } else {
                showFieldError(formGroup, 'Please enter a valid email address');
            }
        }
    });
    
    // Category checkbox validation
    const categoryCheckboxes = form.querySelectorAll('input[name="categories"]');
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const checkedCategories = form.querySelectorAll('input[name="categories"]:checked');
            const categoryGroup = form.querySelector('.checkbox-group').closest('.form-group');
            
            if (checkedCategories.length > 0) {
                showFieldSuccess(categoryGroup);
            } else {
                showFieldError(categoryGroup, 'Please select at least one product category');
            }
        });
    });
}

// Form Field Validation Helpers
function showFieldError(formGroup, message) {
    formGroup.classList.add('error');
    formGroup.classList.remove('success');
    
    let errorElement = formGroup.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        formGroup.appendChild(errorElement);
    }
    errorElement.textContent = message;
}

function showFieldSuccess(formGroup) {
    formGroup.classList.remove('error');
    formGroup.classList.add('success');
    
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Form Submission
async function submitForm(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
    
    try {
        // Collect form data
        const formData = new FormData(form);
        
        // Get selected categories
        const categories = Array.from(form.querySelectorAll('input[name="categories"]:checked'))
                                .map(checkbox => checkbox.value);
        
        // Build the request payload
        const supplierData = {
            businessName: formData.get('businessName'),
            businessType: formData.get('businessType'),
            registrationNumber: formData.get('registrationNumber'),
            panNumber: formData.get('panNumber'),
            businessAddress: formData.get('businessAddress'),
            contactPerson: formData.get('contactPerson'),
            position: formData.get('position'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            productCategories: categories,
            yearsInBusiness: formData.get('yearsInBusiness'),
            deliveryAreas: formData.get('deliveryAreas'),
            businessDescription: formData.get('businessDescription'),
            website: formData.get('website'),
            references: formData.get('references')
        };

        // Submit to backend API
        const response = await fetch('/auth/register-supplier', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(supplierData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Show success message
            showSuccessNotification(result.message || 'Thank you! Your supplier application has been submitted successfully. We will review it and contact you within 2-3 business days.');
            
            // Reset form
            form.reset();
            
            // Remove validation classes
            form.querySelectorAll('.form-group').forEach(group => {
                group.classList.remove('error', 'success');
            });
            
            // Scroll to top
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            // Show error message
            showErrorNotification(result.message || 'Failed to submit application. Please try again.');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        showErrorNotification('Network error. Please check your connection and try again.');
    } finally {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Success Notification
function showSuccessNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button class="close-notification" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.5s ease;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    // Auto remove after 8 seconds
    setTimeout(() => {
        removeNotification(notification);
    }, 8000);
}

// Error Notification
function showErrorNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button class="close-notification" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        max-width: 400px;
        animation: slideInRight 0.5s ease;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    // Auto remove after 10 seconds (longer for errors)
    setTimeout(() => {
        removeNotification(notification);
    }, 10000);
}

// Helper function to remove notifications
function removeNotification(notification) {
    if (notification && notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.5s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }
}

// Animation Observers
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                
                // Stagger animations for benefit cards
                if (entry.target.classList.contains('benefit-card')) {
                    const cards = Array.from(entry.target.parentNode.children);
                    const index = cards.indexOf(entry.target);
                    entry.target.style.animationDelay = `${index * 0.1}s`;
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.benefit-card, .step, .feature-item, .hero-stats .stat').forEach(el => {
        observer.observe(el);
    });
}

// Accessibility Enhancements
function initializeAccessibility() {
    // ESC key functionality
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const navLinks = document.querySelector('.nav-links');
            const menuToggle = document.querySelector('.menu-toggle');
            
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
                menuToggle.focus();
            }
        }
    });
    
    // Focus management for mobile menu
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            if (navLinks.classList.contains('active')) {
                // Focus first menu item when menu opens
                const firstMenuItem = navLinks.querySelector('a');
                if (firstMenuItem) {
                    setTimeout(() => firstMenuItem.focus(), 100);
                }
            }
        });
    }
    
    // Add skip link functionality
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.focus();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }
}

// Add notification animations to CSS
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .notification-content i:first-child {
        font-size: 1.2rem;
        flex-shrink: 0;
    }
    
    .close-notification {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        margin-left: auto;
        flex-shrink: 0;
        border-radius: 4px;
        transition: background-color 0.2s;
    }
    
    .close-notification:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
`;
document.head.appendChild(notificationStyles);
