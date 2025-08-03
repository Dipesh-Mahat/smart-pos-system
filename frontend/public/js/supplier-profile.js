/**
 * Supplier Profile JavaScript
 * Handles profile page functionality including data loading,
 * form submissions, and profile image upload
 */

document.addEventListener('DOMContentLoaded', function() {
    // Load supplier profile data from database
    loadProfileData();
    
    // Initialize form submissions
    initializeForms();
    
    // Initialize profile image upload
    initializeProfileImageUpload();
    
    // Load stats
    loadProfileStats();
});

/**
 * Load profile data directly from the database
 */
function loadProfileData() {
    // Get the supplier ID from URL or session
    const supplierId = getSupplierIdFromSession();
    
    // Show loading state
    showLoadingState(true);
    
    // Get API base URL
    const apiBaseUrl = getApiBaseUrl();
    
    // Direct database connection using fetch API to backend
    fetch(`${apiBaseUrl}/supplier/profile`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}` // Add auth token if available
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Profile data received:', data);
        
        // Handle different response formats
        const profileData = data.data?.profile || data.profile || data;
        
        // Update form fields with real data
        populateFormFields(profileData);
        
        // Update stats if available
        if (data.data?.stats || data.stats) {
            updateStatsDisplay(data.data?.stats || data.stats);
        }
        
        showLoadingState(false);
        console.log('Profile data loaded successfully');
    })
    .catch(error => {
        console.error('Error loading supplier data:', error);
        showLoadingState(false);
        
        // Show error but don't show notification since we removed them
        console.warn('Using fallback data due to API error');
        loadFallbackData();
    });
}

/**
 * Populate profile data in the header section
 * @param {Object} data - The supplier profile data
 */
function populateProfileData(data) {
    // Populate business name
    const businessNameElement = document.getElementById('businessName');
    if (businessNameElement) {
        businessNameElement.textContent = data.businessName || data.companyName || 'Your Business Name';
    }
    
    // Populate contact information using backend API field mapping
    const ownerNameElement = document.querySelector('#ownerName span');
    const emailElement = document.querySelector('#email span');
    const phoneElement = document.querySelector('#phone span');
    const businessTypeElement = document.querySelector('#businessType span');
    
    if (ownerNameElement) {
        ownerNameElement.textContent = data.primaryContact || data.contactName || data.ownerName || 'Contact Person';
    }
    
    if (emailElement) {
        emailElement.textContent = data.primaryEmail || data.email || 'email@example.com';
    }
    
    if (phoneElement) {
        phoneElement.textContent = data.primaryPhone || data.phone || 'Phone Number';
    }
    
    if (businessTypeElement) {
        businessTypeElement.textContent = formatBusinessType(data.businessType) || 'Business Type';
    }
    
    // Set profile image if available
    const profileImage = document.getElementById('profileImage');
    if (profileImage && data.profileImage) {
        profileImage.src = data.profileImage;
        profileImage.onerror = function() {
            this.src = '../images/avatars/user-avatar.png';
        };
    }
}

/**
 * Format business type for display
 * @param {string} type - The business type
 * @returns {string} Formatted business type
 */
function formatBusinessType(type) {
    if (!type) return '';
    
    const types = {
        'manufacturer': 'Manufacturer',
        'wholesaler': 'Wholesaler',
        'distributor': 'Distributor',
        'retailer': 'Retailer',
        'importer': 'Importer',
        'exporter': 'Exporter'
    };
    
    return types[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Show/hide loading state
 * @param {boolean} isLoading - Whether to show loading state
 */
function showLoadingState(isLoading) {
    const loadingElements = [
        document.getElementById('businessName'),
        document.querySelector('#ownerName span'),
        document.querySelector('#email span'),
        document.querySelector('#phone span'),
        document.querySelector('#businessType span')
    ];
    
    loadingElements.forEach(element => {
        if (element) {
            if (isLoading) {
                element.textContent = 'Loading...';
                element.style.color = '#6c757d';
                element.style.fontStyle = 'italic';
            } else {
                element.style.color = '';
                element.style.fontStyle = '';
            }
        }
    });
}

/**
 * Load fallback data when API fails
 */
function loadFallbackData() {
    const fallbackData = {
        businessName: 'Your Business Name',
        contactName: 'Contact Person',
        email: 'your.email@example.com',
        phone: 'Your Phone Number',
        businessType: 'Business Type'
    };
    
    populateProfileData(fallbackData);
}

/**
 * Get auth token from localStorage or sessionStorage
 * @returns {string} Auth token
 */
function getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
}

/**
 * Load profile stats
 */
function loadProfileStats() {
    const supplierId = getSupplierIdFromSession();
    const apiBaseUrl = getApiBaseUrl();
    
    // Load stats data from multiple endpoints
    Promise.all([
        fetch(`${apiBaseUrl}/supplier/products/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        }).then(res => res.ok ? res.json() : { totalProducts: 0, activeProducts: 0 }),
        
        fetch(`${apiBaseUrl}/supplier/orders/stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            }
        }).then(res => res.ok ? res.json() : { totalOrders: 0, monthlyRevenue: 0 })
    ])
    .then(([productStats, orderStats]) => {
        // Combine stats from different endpoints
        const combinedStats = {
            totalProducts: productStats.totalProducts || productStats.data?.totalProducts || 0,
            activeProducts: productStats.activeProducts || productStats.data?.activeProducts || 0,
            totalOrders: orderStats.totalOrders || orderStats.data?.totalOrders || 0,
            monthlyRevenue: orderStats.monthlyRevenue || orderStats.data?.monthlyRevenue || 0
        };
        
        updateStatsDisplay(combinedStats);
    })
    .catch(error => {
        console.error('Error loading stats:', error);
        // Use default values if API fails
        const defaultStats = {
            totalProducts: 0,
            totalOrders: 0,
            activeProducts: 0,
            monthlyRevenue: 0
        };
        updateStatsDisplay(defaultStats);
    });
}

/**
 * Update stats display
 * @param {Object} data - Stats data
 */
function updateStatsDisplay(data) {
    const totalProductsElement = document.getElementById('totalProducts');
    const totalOrdersElement = document.getElementById('totalOrders');
    const activeProductsElement = document.getElementById('activeProducts');
    const monthlyRevenueElement = document.getElementById('monthlyRevenue');
    
    if (totalProductsElement) {
        totalProductsElement.textContent = data.totalProducts || '0';
    }
    
    if (totalOrdersElement) {
        totalOrdersElement.textContent = data.totalOrders || '0';
    }
    
    if (activeProductsElement) {
        activeProductsElement.textContent = data.activeProducts || '0';
    }
    
    if (monthlyRevenueElement) {
        const revenue = parseFloat(data.monthlyRevenue) || 0;
        monthlyRevenueElement.textContent = '₹' + revenue.toLocaleString('en-IN');
    }
}

/**
 * Show message to user
 */
function showMessage(messageId, text, type = 'success') {
    const messageEl = document.getElementById(messageId);
    if (messageEl) {
        messageEl.textContent = text;
        messageEl.className = `message ${type} show`;
        
        // Hide after 5 seconds
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 5000);
    }
}

/**
 * Populate form fields with data
 * @param {Object} data - The supplier profile data
 */
function populateFormFields(data) {
    // Business Information Form - mapping to backend API fields
    const businessNameInput = document.getElementById('businessNameInput');
    if (businessNameInput) {
        businessNameInput.value = data.businessName || data.companyName || '';
    }
    
    const businessTypeSelect = document.getElementById('businessType');
    if (businessTypeSelect && data.businessType) {
        for (let i = 0; i < businessTypeSelect.options.length; i++) {
            if (businessTypeSelect.options[i].value === data.businessType) {
                businessTypeSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    const gstNumberInput = document.getElementById('gstNumber');
    if (gstNumberInput) {
        gstNumberInput.value = data.taxId || data.gstNumber || '';
    }
    
    const panNumberInput = document.getElementById('panNumber');  
    if (panNumberInput) {
        panNumberInput.value = data.businessRegistration || data.panNumber || '';
    }
    
    const businessDescriptionInput = document.getElementById('businessDescription');
    if (businessDescriptionInput) {
        businessDescriptionInput.value = data.companyDesc || data.description || '';
    }
    
    // Contact Details Form - mapping to backend API fields
    const contactNameInput = document.getElementById('contactName');
    if (contactNameInput) {
        contactNameInput.value = data.primaryContact || data.contactName || data.ownerName || '';
    }
    
    const positionInput = document.getElementById('position');
    if (positionInput) {
        positionInput.value = data.contactTitle || data.position || data.designation || '';
    }
    
    const contactEmailInput = document.getElementById('contactEmail');
    if (contactEmailInput) {
        contactEmailInput.value = data.primaryEmail || data.email || '';
    }
    
    const contactPhoneInput = document.getElementById('contactPhone');
    if (contactPhoneInput) {  
        contactPhoneInput.value = data.primaryPhone || data.phone || '';
    }
    
    const addressInput = document.getElementById('address');
    if (addressInput) {
        addressInput.value = data.businessAddress || data.address || '';
    }
    
    const websiteInput = document.getElementById('website');
    if (websiteInput) {
        websiteInput.value = data.website || '';
    }
}

/**
 * Initialize form submission handlers
 */
function initializeForms() {
    // Business Information Form
    const businessForm = document.getElementById('businessForm');
    if (businessForm) {
        businessForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                businessName: document.getElementById('businessNameInput').value,
                businessType: document.getElementById('businessType').value,
                companyDesc: document.getElementById('businessDescription').value,
                taxId: document.getElementById('gstNumber').value,
                businessRegistration: document.getElementById('panNumber').value
            };
            
            // Update the UI immediately for better user experience
            document.getElementById('businessName').textContent = formData.businessName;
            
            // Save to database
            saveToDatabase('business', formData);
        });
    }
    
    // Contact Details Form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                primaryContact: document.getElementById('contactName').value,
                contactTitle: document.getElementById('position').value,
                primaryEmail: document.getElementById('contactEmail').value,
                primaryPhone: document.getElementById('contactPhone').value,
                businessAddress: document.getElementById('address').value
            };
            
            // Update the UI immediately
            document.querySelector('#ownerName span').textContent = formData.primaryContact;
            document.querySelector('#email span').textContent = formData.primaryEmail;
            document.querySelector('#phone span').textContent = formData.primaryPhone;
            
            // Save to database
            saveToDatabase('contact', formData);
        });
    }
    
    // Password Change Form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Simple validation
            if (!currentPassword || !newPassword || !confirmPassword) {
                showNotification('Please fill in all password fields', 'error');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showNotification('New passwords do not match', 'error');
                return;
            }
            
            const formData = {
                currentPassword,
                newPassword
            };
            
            // Save to database
            saveToDatabase('password', formData);
            this.reset();
        });
    }
}

/**
 * Save data to the database
 * @param {string} section - The section being updated (business, contact, password)
 * @param {Object} formData - The form data to update
 */
function saveToDatabase(section, formData) {
    // Show loading state
    showNotification('Updating profile...', 'info');
    
    // Get API base URL
    const apiBaseUrl = getApiBaseUrl();
    
    // Map sections to correct API endpoints
    let endpoint;
    switch(section) {
        case 'business':
            endpoint = `${apiBaseUrl}/supplier/profile/company`;
            break;
        case 'contact':
            endpoint = `${apiBaseUrl}/supplier/profile/contact`;
            break;
        case 'password':
            endpoint = `${apiBaseUrl}/auth/change-password`;
            break;
        default:
            endpoint = `${apiBaseUrl}/supplier/profile`;
    }
    
    fetch(endpoint, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}` // Use JWT token
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Update failed with status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Show success message based on section
        let message = '';
        switch(section) {
            case 'business':
                message = 'Business information updated successfully!';
                break;
            case 'contact':
                message = 'Contact details updated successfully!';
                break;
            case 'password':
                message = 'Password changed successfully!';
                break;
            default:
                message = 'Profile updated successfully!';
        }
        showNotification(message, 'success');
    })
    .catch(error => {
        console.error(`Error updating ${section} information:`, error);
        showNotification(`Failed to update ${section} information. Please try again.`, 'error');
    });
}

/**
 * Get API base URL based on environment
 * @returns {string} API base URL
 */
function getApiBaseUrl() {
    // Auto-detect API URL based on environment
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    return isLocalhost ? 
           'http://localhost:5000/api' : 
           'https://smart-pos-system.onrender.com/api';
}

/**
 * Get authentication token from localStorage or session
 * @returns {string} The JWT token
 */
function getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
}

/**
 * Get CSRF token from meta tag for secure requests
 * @returns {string} CSRF token
 */
function getCsrfToken() {
    // Look for CSRF token in meta tag (should be added by your backend)
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : '';
}

/**
 * Initialize profile image upload functionality
 */
function initializeProfileImageUpload() {
    const profilePicture = document.getElementById('profilePicture');
    if (profilePicture) {
        profilePicture.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                
                // Update UI immediately for better UX
                const reader = new FileReader();
                reader.onload = function(e) {
                    const profileImage = document.getElementById('profileImage');
                    profileImage.src = e.target.result;
                };
                reader.readAsDataURL(file);
                
                // Upload to database
                const supplierId = getSupplierIdFromSession();
                const formData = new FormData();
                formData.append('profileImage', file);
                
                // Use correct API endpoint format
                fetch(`/api/suppliers/${supplierId}/upload-profile-image`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-Token': getCsrfToken() // Get CSRF token for security
                    },
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Upload failed with status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    showNotification('Profile image updated successfully', 'success');
                })
                .catch(error => {
                    console.error('Error uploading profile image:', error);
                    showNotification('Failed to upload profile image. Please try again.', 'error');
                });
            }
        });
    }
}

/**
 * Get supplier ID from session, local storage, or URL
 * @returns {string} The supplier ID
 */
function getSupplierIdFromSession() {
    // Try to get from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');
    
    if (idFromUrl) {
        return idFromUrl;
    }
    
    // Try to get from local storage
    const idFromStorage = localStorage.getItem('supplierId');
    
    if (idFromStorage) {
        return idFromStorage;
    }
    
    // Return a default ID for demo purposes
    return 'current';
}

/**
 * Show notification message
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, info)
 */
function showNotification(message, type = 'success') {
    // Check if notification container exists, create if not
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * Initialize form submission handlers
 */
function initializeForms() {
    // Business Information Form
    const businessForm = document.getElementById('businessForm');
    if (businessForm) {
        businessForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                businessName: document.getElementById('businessNameInput').value,
                businessType: document.getElementById('businessType').value,
                description: document.getElementById('businessDescription').value
            };
            
            await updateProfileData('business', formData);
        });
    }
    
    // Contact Details Form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                contactName: document.getElementById('contactName').value,
                position: document.getElementById('position').value,
                email: document.getElementById('contactEmail').value,
                phone: document.getElementById('contactPhone').value,
                address: document.getElementById('address').value
            };
            
            await updateProfileData('contact', formData);
        });
    }
    
    // Password Change Form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // Simple validation
            if (!currentPassword || !newPassword || !confirmPassword) {
                showNotification('Please fill in all password fields', 'error');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showNotification('New passwords do not match', 'error');
                return;
            }
            
            const formData = {
                currentPassword,
                newPassword
            };
            
            await updateProfileData('password', formData);
            this.reset();
        });
    }
}

/**
 * Update profile data via API
 * @param {string} section - The section being updated (business, contact, password)
 * @param {Object} formData - The form data to update
 */
async function updateProfileData(section, formData) {
    try {
        const supplierId = getSupplierIdFromSession();
        
        const response = await fetch(`/api/suppliers/profile/${supplierId}/${section}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update profile information if business or contact was updated
        if (section === 'business' || section === 'contact') {
            loadProfileData(); // Reload profile data to show updated information
        }
        
        showNotification(`${section.charAt(0).toUpperCase() + section.slice(1)} information updated successfully`, 'success');
    } catch (error) {
        console.error(`Error updating ${section} information:`, error);
        showNotification(`Failed to update ${section} information. Please try again.`, 'error');
    }
}

/**
 * Initialize profile image upload functionality
 */
function initializeProfileImageUpload() {
    const profilePicture = document.getElementById('profilePicture');
    if (profilePicture) {
        profilePicture.addEventListener('change', async function(e) {
            if (this.files && this.files[0]) {
                const file = this.files[0];
                
                // Update UI immediately for better UX
                const reader = new FileReader();
                reader.onload = function(e) {
                    const profileImage = document.getElementById('profileImage');
                    profileImage.src = e.target.result;
                };
                reader.readAsDataURL(file);
                
                // Upload the image to the server
                try {
                    const supplierId = getSupplierIdFromSession();
                    
                    // Create form data for file upload
                    const formData = new FormData();
                    formData.append('profileImage', file);
                    
                    const response = await fetch(`/api/suppliers/profile/${supplierId}/image`, {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    
                    showNotification('Profile image updated successfully', 'success');
                } catch (error) {
                    console.error('Error uploading profile image:', error);
                    showNotification('Failed to upload profile image. Please try again.', 'error');
                }
            }
        });
    }
}

/**
 * Get supplier ID from session, local storage, or URL
 * @returns {string} The supplier ID
 */
function getSupplierIdFromSession() {
    // Try to get from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');
    
    if (idFromUrl) {
        return idFromUrl;
    }
    
    // Try to get from local storage
    const idFromStorage = localStorage.getItem('supplierId');
    
    if (idFromStorage) {
        return idFromStorage;
    }
    
    // If no ID found, return a default (this would be replaced with proper auth logic)
    console.warn('No supplier ID found, using default');
    return 'current';
}

/**
 * Show notification message
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, info)
 */
function showNotification(message, type = 'success') {
    // Check if notification container exists, create if not
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
