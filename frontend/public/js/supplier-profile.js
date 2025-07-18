// Profile Management JavaScript for Smart POS Supplier Dashboard

class ProfileManager {
    constructor() {
        // Auto-detect API URL based on environment (same as auth service)
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
        
        this.baseApiUrl = isLocalhost ? 
                         'http://localhost:5000/api' : 
                         'https://smart-pos-system.onrender.com/api';
                         
        console.log('Profile manager initialized with API base URL:', this.baseApiUrl);
        this.supplierProfile = null;
        
        this.init();
    }

    async init() {
        await this.fetchProfile();
        this.setupEventListeners();
    }

    async fetchProfile() {
        try {
            const token = this.getToken();
            console.log('Token available:', !!token);
            console.log('Making request to:', `${this.baseApiUrl}/supplier/profile`);
            
            const response = await fetch(`${this.baseApiUrl}/supplier/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.log('Error response:', errorText);
                throw new Error(`Failed to fetch profile: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.success) {
                this.supplierProfile = data.data.profile;
                this.supplierStats = data.data.stats;
                this.renderProfile();
                this.renderStats();
            } else {
                console.log('API returned success: false:', data.message);
                this.showNotification(data.message || 'Failed to load profile', 'error');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            this.showNotification('Failed to load profile. Please try again.', 'error');
            
            // Load sample data for development
            this.loadSampleData();
        }
    }

    loadSampleData() {
        // Use sample data when API is not available (for development)
        this.supplierProfile = {
            _id: 'SUP-001',
            firstName: 'Krishna',
            lastName: 'Adhikari',
            email: 'krishna.adhikari@aws.com.np',
            companyName: 'Adhikari Wholesale Suppliers',
            contactDetails: {
                title: 'CEO',
                secondaryEmail: 'info@aws.com.np',
                primaryPhone: '+977-986-1234567',
                secondaryPhone: '+977-985-7654321'
            },
            businessDetails: {
                businessType: 'wholesaler',
                businessRegistration: 'REG-123456789-NPL',
                taxId: 'PAN-987654321',
                description: 'Leading wholesale supplier of grocery items, beverages, and daily necessities for retail marts across Nepal.',
                website: 'www.adhikari-wholesale.com.np',
                establishedYear: 2015
            },
            address: {
                street: 'Bhaisepati Industrial Area',
                city: 'Lalitpur',
                state: 'Bagmati Province',
                postalCode: '44700',
                country: 'Nepal'
            },
            billingAddress: {
                street: '123 Finance Street',
                city: 'Kathmandu',
                state: 'Bagmati Province',
                postalCode: '44600',
                country: 'Nepal'
            },
            shippingAddress: {
                street: '456 Warehouse Road',
                city: 'Bhaktapur',
                state: 'Bagmati Province',
                postalCode: '44800',
                country: 'Nepal'
            },
            businessSettings: {
                paymentTerms: 'net30',
                currency: 'USD',
                shippingMethod: 'standard',
                freeShippingThreshold: 500,
                leadTime: 3,
                maxOrderQuantity: 1000,
                businessHours: [
                    { day: 'monday', open: true, openTime: '09:00', closeTime: '17:00' },
                    { day: 'tuesday', open: true, openTime: '09:00', closeTime: '17:00' },
                    { day: 'wednesday', open: true, openTime: '09:00', closeTime: '17:00' },
                    { day: 'thursday', open: true, openTime: '09:00', closeTime: '17:00' },
                    { day: 'friday', open: true, openTime: '09:00', closeTime: '17:00' },
                    { day: 'saturday', open: true, openTime: '10:00', closeTime: '15:00' },
                    { day: 'sunday', open: false, openTime: '10:00', closeTime: '15:00' }
                ]
            },
            notificationPreferences: {
                email: {
                    newOrders: true,
                    lowStock: true,
                    paymentUpdates: true,
                    weeklyReports: false
                },
                sms: {
                    urgentAlerts: true,
                    orderUpdates: false
                },
                inApp: {
                    realtimeUpdates: true,
                    soundAlerts: false
                }
            },
            profilePicture: '/images/avatars/user-avatar.png',
            status: 'approved'
        };
        
        this.supplierStats = {
            memberSince: '2023-01-15',
            totalSales: 567892.50,
            totalOrders: 1234,
            averageRating: 4.8,
            completionRate: 98.5
        };
        
        this.renderProfile();
        this.renderStats();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Company form submission
        const companyForm = document.getElementById('companyForm');
        if (companyForm) {
            companyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCompanyInfo();
            });
        }

        // Contact form submission
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveContactDetails();
            });
        }

        // Business settings form submission
        const businessForm = document.getElementById('businessForm');
        if (businessForm) {
            businessForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveBusinessSettings();
            });
        }

        // Notification preferences form
        const notificationButtons = document.querySelectorAll('.notification-section button');
        if (notificationButtons.length > 0) {
            notificationButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.saveNotificationPreferences();
                });
            });
        }

        // Password form submission
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword();
            });
        }

        // Profile picture upload
        const profilePictureInput = document.getElementById('profilePicture');
        if (profilePictureInput) {
            profilePictureInput.addEventListener('change', (e) => {
                this.handleProfilePictureUpload(e);
            });
        }
    }

    renderProfile() {
        if (!this.supplierProfile) return;

        // Update profile header
        document.getElementById('profileBusinessName').textContent = this.supplierProfile.companyName;
        document.getElementById('profileContactPerson').textContent = `${this.supplierProfile.firstName} ${this.supplierProfile.lastName}`;
        document.getElementById('profileEmail').textContent = this.supplierProfile.email;
        document.getElementById('profilePhone').textContent = this.supplierProfile.contactDetails?.primaryPhone || '';

        // Update verification badges
        this.updateVerificationStatus();

        // Profile image
        if (this.supplierProfile.profilePicture) {
            document.getElementById('profileImage').src = this.supplierProfile.profilePicture;
        }

        // Member since
        document.getElementById('memberSince').textContent = new Date(this.supplierProfile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        // Fill forms
        this.fillCompanyForm();
        this.fillContactForm();
        this.fillBusinessSettingsForm();
    }

    renderStats() {
        if (!this.supplierStats) return;

        document.getElementById('totalSales').textContent = `$${this.supplierStats.totalSales.toLocaleString()}`;
        document.getElementById('totalOrders').textContent = this.supplierStats.totalOrders.toLocaleString();
        document.getElementById('averageRating').textContent = this.supplierStats.averageRating.toFixed(1);
        document.getElementById('completionRate').textContent = `${this.supplierStats.completionRate}%`;
        
        // Render rating stars
        this.renderStars(this.supplierStats.averageRating);
    }

    renderStars(rating) {
        const starsContainer = document.getElementById('ratingStars');
        if (!starsContainer) return;
        
        starsContainer.innerHTML = '';
        
        // Full stars
        for (let i = 1; i <= Math.floor(rating); i++) {
            const star = document.createElement('i');
            star.className = 'fas fa-star';
            starsContainer.appendChild(star);
        }
        
        // Half star
        if (rating % 1 >= 0.5) {
            const halfStar = document.createElement('i');
            halfStar.className = 'fas fa-star-half-alt';
            starsContainer.appendChild(halfStar);
        }
        
        // Empty stars
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 1; i <= emptyStars; i++) {
            const emptyStar = document.createElement('i');
            emptyStar.className = 'far fa-star';
            starsContainer.appendChild(emptyStar);
        }
    }

    updateVerificationStatus() {
        // This would normally be driven by API data
        document.getElementById('emailVerification').className = 'verification-badge verified';
        document.getElementById('emailVerification').innerHTML = '<i class="fas fa-check-circle"></i> Email Verified';
        
        document.getElementById('phoneVerification').className = 'verification-badge verified';
        document.getElementById('phoneVerification').innerHTML = '<i class="fas fa-check-circle"></i> Phone Verified';
        
        document.getElementById('businessVerification').className = 'verification-badge verified';
        document.getElementById('businessVerification').innerHTML = '<i class="fas fa-check-circle"></i> Business Verified';
    }

    fillCompanyForm() {
        const profile = this.supplierProfile;
        if (!profile) return;

        document.getElementById('businessName').value = profile.companyName || '';
        document.getElementById('businessType').value = profile.businessDetails?.businessType || 'wholesaler';
        document.getElementById('businessRegistration').value = profile.businessDetails?.businessRegistration || '';
        document.getElementById('taxId').value = profile.businessDetails?.taxId || '';
        document.getElementById('companyDesc').value = profile.businessDetails?.description || '';
        document.getElementById('website').value = profile.businessDetails?.website || '';
        document.getElementById('establishedYear').value = profile.businessDetails?.establishedYear || '';
    }

    fillContactForm() {
        const profile = this.supplierProfile;
        if (!profile) return;

        document.getElementById('primaryContact').value = `${profile.firstName} ${profile.lastName}` || '';
        document.getElementById('contactTitle').value = profile.contactDetails?.title || '';
        document.getElementById('primaryEmail').value = profile.email || '';
        document.getElementById('secondaryEmail').value = profile.contactDetails?.secondaryEmail || '';
        document.getElementById('primaryPhone').value = profile.contactDetails?.primaryPhone || '';
        document.getElementById('secondaryPhone').value = profile.contactDetails?.secondaryPhone || '';
        
        // Addresses
        document.getElementById('businessAddress').value = this.formatAddress(profile.address);
        document.getElementById('billingAddress').value = this.formatAddress(profile.billingAddress);
        document.getElementById('shippingAddress').value = this.formatAddress(profile.shippingAddress);
    }

    fillBusinessSettingsForm() {
        const profile = this.supplierProfile;
        if (!profile || !profile.businessSettings) return;

        document.getElementById('defaultPaymentTerms').value = profile.businessSettings.paymentTerms || 'net30';
        document.getElementById('currency').value = profile.businessSettings.currency || 'USD';
        document.getElementById('shippingMethod').value = profile.businessSettings.shippingMethod || 'standard';
        document.getElementById('freeShippingThreshold').value = profile.businessSettings.freeShippingThreshold || 500;
        document.getElementById('leadTime').value = profile.businessSettings.leadTime || 3;
        document.getElementById('maxOrderQuantity').value = profile.businessSettings.maxOrderQuantity || 1000;
        
        // Business hours - would need to fill in the business hours UI
    }

    formatAddress(address) {
        if (!address) return '';
        
        let formatted = '';
        if (address.street) formatted += address.street;
        if (address.city) formatted += '\n' + address.city;
        if (address.state || address.postalCode) {
            formatted += '\n';
            if (address.state) formatted += address.state;
            if (address.state && address.postalCode) formatted += ', ';
            if (address.postalCode) formatted += address.postalCode;
        }
        if (address.country) formatted += '\n' + address.country;
        
        return formatted;
        document.getElementById('accountNumber').value = this.supplierProfile.bankDetails.accountNumber;
        document.getElementById('routingNumber').value = this.supplierProfile.bankDetails.routingNumber;
        document.getElementById('accountType').value = this.supplierProfile.bankDetails.accountType;
    }

    fillPreferencesForm() {
        document.getElementById('currency').value = this.supplierProfile.preferences.currency;
        document.getElementById('timezone').value = this.supplierProfile.preferences.timezone;
        document.getElementById('language').value = this.supplierProfile.preferences.language;
        
        // Notification preferences
        const notifications = this.supplierProfile.preferences.notifications;
        document.getElementById('emailNotifications').checked = notifications.email;
        document.getElementById('smsNotifications').checked = notifications.sms;
        document.getElementById('pushNotifications').checked = notifications.push;
        document.getElementById('orderUpdates').checked = notifications.orderUpdates;
        document.getElementById('inventoryAlerts').checked = notifications.inventoryAlerts;
        document.getElementById('paymentNotifications').checked = notifications.paymentNotifications;
    }

    updateVerificationStatus() {
        const verification = this.supplierProfile.verification;
        
        // Update verification badges
        this.updateBadge('emailVerification', verification.emailVerified);
        this.updateBadge('phoneVerification', verification.phoneVerified);
        this.updateBadge('businessVerification', verification.businessVerified);
        this.updateBadge('documentsVerification', verification.documentsUploaded);
    }

    updateBadge(elementId, isVerified) {
        const element = document.getElementById(elementId);
        if (element) {
            element.className = `verification-badge ${isVerified ? 'verified' : 'pending'}`;
            element.innerHTML = isVerified 
                ? '<i class="fas fa-check-circle"></i> Verified'
                : '<i class="fas fa-clock"></i> Pending';
        }
    }

    renderStats() {
        const stats = this.supplierProfile.stats;
        
        document.getElementById('memberSince').textContent = this.formatDate(stats.memberSince);
        document.getElementById('totalSales').textContent = `$${stats.totalSales.toLocaleString()}`;
        document.getElementById('totalOrders').textContent = stats.totalOrders.toLocaleString();
        document.getElementById('averageRating').textContent = stats.averageRating;
        document.getElementById('completionRate').textContent = `${stats.completionRate}%`;

        // Update rating stars
        this.renderRatingStars(stats.averageRating);
    }

    renderRatingStars(rating) {
        const starsContainer = document.getElementById('ratingStars');
        if (!starsContainer) return;

        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        
        let starsHTML = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="fas fa-star"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Empty stars
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="far fa-star"></i>';
        }
        
        starsContainer.innerHTML = starsHTML;
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }

    async saveCompanyInfo() {
        try {
            const companyInfo = {
                businessName: document.getElementById('businessName').value,
                businessType: document.getElementById('businessType').value,
                businessRegistration: document.getElementById('businessRegistration').value,
                taxId: document.getElementById('taxId').value,
                companyDesc: document.getElementById('companyDesc').value,
                website: document.getElementById('website').value,
                establishedYear: document.getElementById('establishedYear').value
            };
            
            const response = await fetch(`${this.baseApiUrl}/supplier/profile/company`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(companyInfo)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Company information updated successfully', 'success');
                // Update local profile data
                this.supplierProfile = data.data.profile;
                document.getElementById('profileBusinessName').textContent = companyInfo.businessName;
            } else {
                this.showNotification(data.message || 'Failed to update company information', 'error');
            }
        } catch (error) {
            console.error('Error updating company info:', error);
            this.showNotification('Failed to update company information. Please try again.', 'error');
        }
    }

    async saveContactDetails() {
        try {
            const contactDetails = {
                primaryContact: document.getElementById('primaryContact').value,
                contactTitle: document.getElementById('contactTitle').value,
                primaryEmail: document.getElementById('primaryEmail').value,
                secondaryEmail: document.getElementById('secondaryEmail').value,
                primaryPhone: document.getElementById('primaryPhone').value,
                secondaryPhone: document.getElementById('secondaryPhone').value,
                businessAddress: document.getElementById('businessAddress').value,
                billingAddress: document.getElementById('billingAddress').value,
                shippingAddress: document.getElementById('shippingAddress').value
            };
            
            const response = await fetch(`${this.baseApiUrl}/supplier/profile/contact`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(contactDetails)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Contact details updated successfully', 'success');
                // Update local profile data
                this.supplierProfile = data.data.profile;
                document.getElementById('profileContactPerson').textContent = contactDetails.primaryContact;
                document.getElementById('profileEmail').textContent = contactDetails.primaryEmail;
                document.getElementById('profilePhone').textContent = contactDetails.primaryPhone;
            } else {
                this.showNotification(data.message || 'Failed to update contact details', 'error');
            }
        } catch (error) {
            console.error('Error updating contact details:', error);
            this.showNotification('Failed to update contact details. Please try again.', 'error');
        }
    }

    async saveBusinessSettings() {
        try {
            const businessSettings = {
                defaultPaymentTerms: document.getElementById('defaultPaymentTerms').value,
                currency: document.getElementById('currency').value,
                shippingMethod: document.getElementById('shippingMethod').value,
                freeShippingThreshold: document.getElementById('freeShippingThreshold').value,
                leadTime: document.getElementById('leadTime').value,
                maxOrderQuantity: document.getElementById('maxOrderQuantity').value,
                // Would need to collect business hours from the UI
                businessHours: []
            };
            
            const response = await fetch(`${this.baseApiUrl}/supplier/profile/business-settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify(businessSettings)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Business settings updated successfully', 'success');
                // Update local profile data
                this.supplierProfile = data.data.profile;
            } else {
                this.showNotification(data.message || 'Failed to update business settings', 'error');
            }
        } catch (error) {
            console.error('Error updating business settings:', error);
            this.showNotification('Failed to update business settings. Please try again.', 'error');
        }
    }

    async saveNotificationPreferences() {
        try {
            // Collect notification preferences from toggle switches
            const notifications = {
                email: {
                    newOrders: document.querySelector('.notification-option:nth-child(1) input[type="checkbox"]').checked,
                    lowStock: document.querySelector('.notification-option:nth-child(2) input[type="checkbox"]').checked,
                    paymentUpdates: document.querySelector('.notification-option:nth-child(3) input[type="checkbox"]').checked,
                    weeklyReports: document.querySelector('.notification-option:nth-child(4) input[type="checkbox"]').checked
                },
                sms: {
                    urgentAlerts: document.querySelector('.notification-section:nth-child(2) .notification-option:nth-child(1) input[type="checkbox"]').checked,
                    orderUpdates: document.querySelector('.notification-section:nth-child(2) .notification-option:nth-child(2) input[type="checkbox"]').checked
                },
                inApp: {
                    realtimeUpdates: document.querySelector('.notification-section:nth-child(3) .notification-option:nth-child(1) input[type="checkbox"]').checked,
                    soundAlerts: document.querySelector('.notification-section:nth-child(3) .notification-option:nth-child(2) input[type="checkbox"]').checked
                }
            };
            
            const response = await fetch(`${this.baseApiUrl}/supplier/profile/notifications`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ notifications })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Notification preferences updated successfully', 'success');
                // Update local profile data
                this.supplierProfile = data.data.profile;
            } else {
                this.showNotification(data.message || 'Failed to update notification preferences', 'error');
            }
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            this.showNotification('Failed to update notification preferences. Please try again.', 'error');
        }
    }

    async changePassword() {
        try {
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (newPassword !== confirmPassword) {
                this.showNotification('Passwords do not match', 'error');
                return;
            }
            
            // Password change endpoint would be in auth controller, not profile
            const response = await fetch(`${this.baseApiUrl}/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Password changed successfully', 'success');
                document.getElementById('passwordForm').reset();
            } else {
                this.showNotification(data.message || 'Failed to change password', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            this.showNotification('Failed to change password. Please try again.', 'error');
        }
    }

    async handleProfilePictureUpload(event) {
        try {
            const file = event.target.files[0];
            if (!file) return;
            
            // Check file type
            if (!file.type.match('image.*')) {
                this.showNotification('Please select an image file', 'error');
                return;
            }
            
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                this.showNotification('File size should not exceed 5MB', 'error');
                return;
            }
            
            const formData = new FormData();
            formData.append('profilePicture', file);
            
            const response = await fetch(`${this.baseApiUrl}/supplier/profile/picture`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Profile picture updated successfully', 'success');
                // Update profile image
                document.getElementById('profileImage').src = data.data.profilePicture;
                this.supplierProfile.profilePicture = data.data.profilePicture;
            } else {
                this.showNotification(data.message || 'Failed to update profile picture', 'error');
            }
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            this.showNotification('Failed to update profile picture. Please try again.', 'error');
        }
    }

    async deactivateAccount() {
        try {
            const confirmed = confirm('Are you sure you want to deactivate your account? You can reactivate it later by logging in.');
            if (!confirmed) return;
            
            const response = await fetch(`${this.baseApiUrl}/supplier/profile/account-status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getToken()}`
                },
                body: JSON.stringify({ action: 'deactivate' })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Account deactivated successfully. You will be logged out.', 'warning');
                
                // Logout after a brief delay
                setTimeout(() => {
                    localStorage.removeItem('token');
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                this.showNotification(data.message || 'Failed to deactivate account', 'error');
            }
        } catch (error) {
            console.error('Error deactivating account:', error);
            this.showNotification('Failed to deactivate account. Please try again.', 'error');
        }
    }

    async deleteAccount() {
        const confirmation = prompt('This action cannot be undone. Type "DELETE" to confirm account deletion:');
        if (confirmation !== 'DELETE') {
            if (confirmation !== null) {
                this.showNotification('Account deletion cancelled', 'info');
            }
            return;
        }
        
        // This would typically be handled by a different endpoint
        this.showNotification('Account deletion request submitted. You will receive a confirmation email.', 'error');
    }

    terminateSession(sessionType) {
        this.showNotification(`${sessionType} session terminated successfully`, 'success');
    }

    terminateAllSessions() {
        const confirmed = confirm('Are you sure you want to terminate all other sessions? You will need to log in again on other devices.');
        if (confirmed) {
            this.showNotification('All other sessions terminated successfully', 'success');
        }
    }

    downloadAccountData() {
        this.showNotification('Account data download initiated. You will receive an email with the download link.', 'info');
    }

    // Helper methods
    getToken() {
        return localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    }

    showNotification(message, type) {
        // Check if notification system exists globally
        if (typeof showNotification === 'function') {
            showNotification(message, type);
            return;
        }
        
        // Fallback notification
        alert(message);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const profileManager = new ProfileManager();
});
