// Script to test API functionality
// Run with: node test-api.js

const fetch = require('node-fetch');

// API Base URL
const API_URL = 'http://localhost:5000/api';

// Sample user credentials for testing
const testUser = {
  username: 'testshopowner_' + Date.now(),
  email: 'testshopowner_' + Date.now() + '@example.com',
  password: 'Test1234!',
  firstName: 'Test',
  lastName: 'Shopowner',
  role: 'shopowner',
  shopName: 'Test Shop'
};

let authToken = null;

// Helper function for API requests
async function makeRequest(url, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  };

  console.log(`Making ${method} request to ${url}`);
  const response = await fetch(url, options);
  const data = await response.json();

  console.log(`Response (${response.status}):`, JSON.stringify(data, null, 2));
  return { status: response.status, data };
}

// Test API health endpoint
async function testHealthEndpoint() {
  console.log('\n--- Testing Health Endpoint ---');
  await makeRequest(`${API_URL}/health`);
}

// Register a new user
async function registerUser() {
  console.log('\n--- Registering Test User ---');
  try {
    const { status, data } = await makeRequest(`${API_URL}/auth/register`, 'POST', testUser);
    if (status === 201 || status === 200) {
      console.log('User registered successfully');
      return data.token;
    } else if (status === 409) {
      console.log('User already exists, proceeding to login');
      return null;
    } else {
      console.error('Failed to register user');
      return null;
    }
  } catch (error) {
    console.error('Error registering user:', error);
    return null;
  }
}

// Login a user
async function loginUser() {
  console.log('\n--- Logging in Test User ---');
  const credentials = {
    email: testUser.email,
    password: testUser.password
  };

  try {
    const { status, data } = await makeRequest(`${API_URL}/auth/login`, 'POST', credentials);
    if (status === 200) {
      console.log('User logged in successfully');
      return data.token;
    } else {
      console.error('Failed to login');
      return null;
    }
  } catch (error) {
    console.error('Error logging in:', error);
    return null;
  }
}

// Test shop owner endpoint
async function testShopownerEndpoint(token) {
  console.log('\n--- Testing Shopowner Endpoint ---');
  if (!token) {
    console.error('No token available, skipping test');
    return;
  }

  await makeRequest(`${API_URL}/shop/test-shopowner`, 'GET', null, token);
}

// Test shop dashboard endpoint
async function testShopDashboard(token) {
  console.log('\n--- Testing Shop Dashboard Endpoint ---');
  if (!token) {
    console.error('No token available, skipping test');
    return;
  }

  await makeRequest(`${API_URL}/shop/dashboard/summary`, 'GET', null, token);
}

// Main test sequence
async function runTests() {
  console.log('=== Starting API Tests ===');
  
  // Test health endpoint
  await testHealthEndpoint();
  
  // Try to register a new user
  let token = await registerUser();
  
  // If registration didn't work or user already exists, try logging in
  if (!token) {
    token = await loginUser();
  }
  
  // Test shopowner endpoints with the token
  if (token) {
    authToken = token;
    await testShopownerEndpoint(token);
    await testShopDashboard(token);
  } else {
    console.error('Unable to get authentication token. Tests cannot continue.');
  }
  
  console.log('\n=== API Tests Completed ===');
}

// Run the tests
runTests().catch(err => {
  console.error('Test error:', err);
});
