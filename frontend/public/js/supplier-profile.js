// Profile Management JavaScript for Smart POS Supplier Dashboard

class ProfileManager {
    constructor() {
        this.supplierProfile = {
            id: 'SUP-001',
            businessName: 'TechWorld Electronics',
            contactPerson: 'John Smith',
            email: 'john.smith@techworld.com',
            phone: '+1 (555) 123-4567',
            website: 'www.techworld-electronics.com',
            address: {
                street: '123 Technology Street',
                city: 'Tech City',
                state: 'California',
                zipCode: '90210',
                country: 'United States'
            },
            businessInfo: {
                registrationNumber: 'REG-123456789',
                taxId: 'TAX-987654321',
                businessType: 'Corporation',
                founded: '2015',
                employees: '50-100',
                description: 'Leading supplier of electronic components and accessories for retail businesses.'
            },
            bankDetails: {
                bankName: 'First National Bank',
                accountNumber: '****-****-****-1234',
                routingNumber: '123456789',
                accountType: 'Business Checking'
            },
            preferences: {
                currency: 'USD',
                timezone: 'America/Los_Angeles',
                language: 'English',
                notifications: {
                    email: true,
                    sms: false,
                    push: true,
                    orderUpdates: true,
                    inventoryAlerts: true,
                    paymentNotifications: true
                }
            },
            verification: {
                emailVerified: true,
                phoneVerified: true,
                businessVerified: true,
                documentsUploaded: true
            },
            stats: {
                memberSince: '2023-01-15',
                totalSales: 567892.50,
                totalOrders: 1234,
                averageRating: 4.8,
                completionRate: 98.5
            }
        };

        this.init();
    }

    init() {
        this.renderProfile();
        this.setupEventListeners();
        this.renderStats();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Profile form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfile();
            });
        }

        // Business info form submission
        const businessForm = document.getElementById('businessForm');
        if (businessForm) {
            businessForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveBusinessInfo();
            });
        }

        // Banking form submission
        const bankingForm = document.getElementById('bankingForm');
        if (bankingForm) {
            bankingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveBankingInfo();
            });
        }

        // Preferences form submission
        const preferencesForm = document.getElementById('preferencesForm');
        if (preferencesForm) {
            preferencesForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.savePreferences();
            });
        }

        // Password change form
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

        // Document upload
        const documentInputs = document.querySelectorAll('.document-upload');
        documentInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleDocumentUpload(e);
            });
        });

        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobileToggle');
        const sidebar = document.getElementById('sidebar');
        
        if (mobileToggle && sidebar) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }
    }

    renderProfile() {
        // Update profile header
        document.getElementById('profileBusinessName').textContent = this.supplierProfile.businessName;
        document.getElementById('profileContactPerson').textContent = this.supplierProfile.contactPerson;
        document.getElementById('profileEmail').textContent = this.supplierProfile.email;
        document.getElementById('profilePhone').textContent = this.supplierProfile.phone;

        // Update verification badges
        this.updateVerificationStatus();

        // Fill profile form
        this.fillProfileForm();
        this.fillBusinessForm();
        this.fillBankingForm();
        this.fillPreferencesForm();
    }

    fillProfileForm() {
        document.getElementById('businessName').value = this.supplierProfile.businessName;
        document.getElementById('contactPerson').value = this.supplierProfile.contactPerson;
        document.getElementById('email').value = this.supplierProfile.email;
        document.getElementById('phone').value = this.supplierProfile.phone;
        document.getElementById('website').value = this.supplierProfile.website;
        
        // Address fields
        document.getElementById('street').value = this.supplierProfile.address.street;
        document.getElementById('city').value = this.supplierProfile.address.city;
        document.getElementById('state').value = this.supplierProfile.address.state;
        document.getElementById('zipCode').value = this.supplierProfile.address.zipCode;
        document.getElementById('country').value = this.supplierProfile.address.country;
    }

    fillBusinessForm() {
        document.getElementById('registrationNumber').value = this.supplierProfile.businessInfo.registrationNumber;
        document.getElementById('taxId').value = this.supplierProfile.businessInfo.taxId;
        document.getElementById('businessType').value = this.supplierProfile.businessInfo.businessType;
        document.getElementById('founded').value = this.supplierProfile.businessInfo.founded;
        document.getElementById('employees').value = this.supplierProfile.businessInfo.employees;
        document.getElementById('description').value = this.supplierProfile.businessInfo.description;
    }

    fillBankingForm() {
        document.getElementById('bankName').value = this.supplierProfile.bankDetails.bankName;
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

    saveProfile() {
        // Get form data
        const formData = new FormData(document.getElementById('profileForm'));
        
        // Update profile object
        this.supplierProfile.businessName = formData.get('businessName');
        this.supplierProfile.contactPerson = formData.get('contactPerson');
        this.supplierProfile.email = formData.get('email');
        this.supplierProfile.phone = formData.get('phone');
        this.supplierProfile.website = formData.get('website');
        
        // Update address
        this.supplierProfile.address.street = formData.get('street');
        this.supplierProfile.address.city = formData.get('city');
        this.supplierProfile.address.state = formData.get('state');
        this.supplierProfile.address.zipCode = formData.get('zipCode');
        this.supplierProfile.address.country = formData.get('country');

        // Update profile display
        this.renderProfile();
        
        this.showNotification('Profile updated successfully', 'success');
    }

    saveBusinessInfo() {
        const formData = new FormData(document.getElementById('businessForm'));
        
        // Update business info
        this.supplierProfile.businessInfo.registrationNumber = formData.get('registrationNumber');
        this.supplierProfile.businessInfo.taxId = formData.get('taxId');
        this.supplierProfile.businessInfo.businessType = formData.get('businessType');
        this.supplierProfile.businessInfo.founded = formData.get('founded');
        this.supplierProfile.businessInfo.employees = formData.get('employees');
        this.supplierProfile.businessInfo.description = formData.get('description');

        this.showNotification('Business information updated successfully', 'success');
    }

    saveBankingInfo() {
        const formData = new FormData(document.getElementById('bankingForm'));
        
        // Update banking info
        this.supplierProfile.bankDetails.bankName = formData.get('bankName');
        this.supplierProfile.bankDetails.accountNumber = formData.get('accountNumber');
        this.supplierProfile.bankDetails.routingNumber = formData.get('routingNumber');
        this.supplierProfile.bankDetails.accountType = formData.get('accountType');

        this.showNotification('Banking information updated successfully', 'success');
    }

    savePreferences() {
        const formData = new FormData(document.getElementById('preferencesForm'));
        
        // Update preferences
        this.supplierProfile.preferences.currency = formData.get('currency');
        this.supplierProfile.preferences.timezone = formData.get('timezone');
        this.supplierProfile.preferences.language = formData.get('language');
        
        // Update notifications
        this.supplierProfile.preferences.notifications.email = formData.has('emailNotifications');
        this.supplierProfile.preferences.notifications.sms = formData.has('smsNotifications');
        this.supplierProfile.preferences.notifications.push = formData.has('pushNotifications');
        this.supplierProfile.preferences.notifications.orderUpdates = formData.has('orderUpdates');
        this.supplierProfile.preferences.notifications.inventoryAlerts = formData.has('inventoryAlerts');
        this.supplierProfile.preferences.notifications.paymentNotifications = formData.has('paymentNotifications');

        this.showNotification('Preferences updated successfully', 'success');
    }

    changePassword() {
        const formData = new FormData(document.getElementById('passwordForm'));
        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        if (newPassword !== confirmPassword) {
            this.showNotification('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 8) {
            this.showNotification('Password must be at least 8 characters long', 'error');
            return;
        }

        // Simulate password change
        this.showNotification('Password changed successfully', 'success');
        document.getElementById('passwordForm').reset();
    }

    handleProfilePictureUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showNotification('Please select an image file', 'error');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const profileImage = document.getElementById('profileImage');
            if (profileImage) {
                profileImage.src = e.target.result;
            }
        };
        reader.readAsDataURL(file);

        this.showNotification('Profile picture updated successfully', 'success');
    }

    handleDocumentUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const documentType = event.target.dataset.type;
        
        // Simulate document upload
        setTimeout(() => {
            this.showNotification(`${documentType} uploaded successfully`, 'success');
            
            // Update verification status
            this.supplierProfile.verification.documentsUploaded = true;
            this.updateVerificationStatus();
        }, 1000);
    }

    verifyEmail() {
        // Simulate email verification
        this.showNotification('Verification email sent. Please check your inbox.', 'info');
    }

    verifyPhone() {
        // Simulate phone verification
        this.showNotification('Verification SMS sent. Please check your phone.', 'info');
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.profileManager = new ProfileManager();
});
