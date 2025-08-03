// Quick authentication setup for POS testing
// Run this in browser console to set authentication token

const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OGRhNmYwNzdlOTMzOGRhYjBlMDkxOSIsImVtYWlsIjoicmFtQGtpcmFuYS5jb20iLCJyb2xlIjoic2hvcG93bmVyIiwianRpIjoiZjc5NGU2MjljZTAwOTkyYzRhZDMxYjA4ZTFkYTA4YTciLCJpYXQiOjE3NTQyMjE5NDgsImV4cCI6MTc1NDI2NTE0OCwiYXVkIjoicG9zLXVzZXJzIiwiaXNzIjoic21hcnQtcG9zLXN5c3RlbSJ9.U1rhBo-mpyXkHBhUH9YS80FhG6cAlhydBWmiltdXy10";

const refreshToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OGRhNmYwNzdlOTMzOGRhYjBlMDkxOSIsImp0aSI6ImYwMTU4ODdmOGNkZGFkNmNiMzI4MTQxMzI4YTdlMDliIiwiaWF0IjoxNzU0MjIxOTQ4LCJleHAiOjE3NTQ4MjY3NDgsImF1ZCI6InBvcy11c2VycyIsImlzcyI6InNtYXJ0LXBvcy1zeXN0ZW0ifQ.BqUmSHWjkwcfcgmm-DGR2pN_nn-pL0AqOcfWoIq7LA8";

const user = {
    "id": "688da6f077e9338dab0e0919",
    "email": "ram@kirana.com",
    "role": "shopowner",
    "firstName": "Ram Bahadur",
    "lastName": "Shrestha",
    "username": "ram_kirana",
    "shopName": "Ram Kirana Pasal"
};

// Set authentication data in localStorage
localStorage.setItem('neopos_auth_token', authToken);
localStorage.setItem('neopos_refresh_token', refreshToken);
localStorage.setItem('neopos_user', JSON.stringify(user));

// Set token expiry (12 hours from now)
const expiryTime = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
localStorage.setItem('neopos_token_expiry', expiryTime);

console.log('✅ Authentication token set successfully!');
console.log('User:', user.firstName, user.lastName);
console.log('Shop:', user.shopName);
console.log('Token expires at:', expiryTime);
console.log('🔄 Please refresh the page to apply authentication.');
