/**
 * Supplier Profile JavaScript
 * Handles profile page functionality including data loading,
 * form submissions, and tab navigation
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tab navigation
    initializeTabs();
    
    // Load supplier profile data from database
    loadProfileData();
    
    // Initialize form submissions
    initializeForms();
    
    // Initialize profile image upload
    initializeProfileImageUpload();
});

/**
 * Initialize tab navigation functionality
 */
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding content
            const tabId = button.getAttribute('data-tab');
            const activeContent = document.getElementById(tabId + 'Tab');
            if (activeContent) {
                activeContent.classList.add('active');
            }
        });
    });
}

/**
 * Load profile data directly from the database
 */
function loadProfileData() {
    // Get the supplier ID from URL or session
    const supplierId = getSupplierIdFromSession();
    
    // Direct database connection using fetch API to backend
    fetch(`/api/suppliers/${supplierId}/profile`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Update UI with data from database
            populateProfileData(data);
            populateFormFields(data);
        })
        .catch(error => {
            console.error('Error loading supplier data:', error);
            // Show a small notification instead of using mock data
            showNotification('Could not load profile data. Using placeholder values.', 'error');
            
            // Keep the loading placeholders that are already in the HTML
            // We don't inject mock data as the UI already has loading indicators
        });
}

/**
 * Populate profile data in the header section
 * @param {Object} data - The supplier profile data
 */
function populateProfileData(data) {
    // Populate business name
    document.getElementById('businessName').textContent = data.businessName || 'Your Business';
    
    // Populate contact information
    const ownerNameElement = document.querySelector('#ownerName span');
    const emailElement = document.querySelector('#email span');
    const phoneElement = document.querySelector('#phone span');
    
    if (ownerNameElement) ownerNameElement.textContent = data.contactName || 'Your Name';
    if (emailElement) emailElement.textContent = data.email || 'your.email@example.com';
    if (phoneElement) phoneElement.textContent = data.phone || 'Your Phone Number';
    
    // Set profile image if available
    if (data.profileImage) {
        const profileImage = document.getElementById('profileImage');
        profileImage.src = data.profileImage;
        profileImage.onerror = function() {
            this.src = '../images/avatars/user-avatar.png';
        };
    }
}

/**
 * Populate form fields with data
 * @param {Object} data - The supplier profile data
 */
function populateFormFields(data) {
    // Business Information Form
    document.getElementById('businessNameInput').value = data.businessName || '';
    
    const businessTypeSelect = document.getElementById('businessType');
    if (businessTypeSelect && data.businessType) {
        for (let i = 0; i < businessTypeSelect.options.length; i++) {
            if (businessTypeSelect.options[i].value === data.businessType) {
                businessTypeSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    document.getElementById('businessDescription').value = data.description || '';
    
    // Contact Details Form
    document.getElementById('contactName').value = data.contactName || '';
    document.getElementById('position').value = data.position || '';
    document.getElementById('contactEmail').value = data.email || '';
    document.getElementById('contactPhone').value = data.phone || '';
    document.getElementById('address').value = data.address || '';
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
                description: document.getElementById('businessDescription').value
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
                contactName: document.getElementById('contactName').value,
                position: document.getElementById('position').value,
                email: document.getElementById('contactEmail').value,
                phone: document.getElementById('contactPhone').value,
                address: document.getElementById('address').value
            };
            
            // Update the UI immediately
            document.querySelector('#ownerName span').textContent = formData.contactName;
            document.querySelector('#email span').textContent = formData.email;
            document.querySelector('#phone span').textContent = formData.phone;
            
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
    const supplierId = getSupplierIdFromSession();
    
    // Use correct API endpoint format
    fetch(`/api/suppliers/${supplierId}/${section}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCsrfToken() // Get CSRF token for security
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
        showNotification(`${section.charAt(0).toUpperCase() + section.slice(1)} information updated successfully`, 'success');
    })
    .catch(error => {
        console.error(`Error updating ${section} information:`, error);
        showNotification(`Failed to update ${section} information. Please try again.`, 'error');
    });
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
 * Populate form fields with data
 * @param {Object} data - The supplier profile data
 */
function populateFormFields(data) {
    // Business Information Form
    document.getElementById('businessNameInput').value = data.businessName || '';
    
    const businessTypeSelect = document.getElementById('businessType');
    if (businessTypeSelect && data.businessType) {
        for (let i = 0; i < businessTypeSelect.options.length; i++) {
            if (businessTypeSelect.options[i].value === data.businessType) {
                businessTypeSelect.selectedIndex = i;
                break;
            }
        }
    }
    
    document.getElementById('businessDescription').value = data.description || '';
    
    // Contact Details Form
    document.getElementById('contactName').value = data.contactName || '';
    document.getElementById('position').value = data.position || '';
    document.getElementById('contactEmail').value = data.email || '';
    document.getElementById('contactPhone').value = data.phone || '';
    document.getElementById('address').value = data.address || '';
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
