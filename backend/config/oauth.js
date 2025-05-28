/**
 * OAuth Configuration
 * 
 * This file handles loading the OAuth credentials from secure storage
 * and provides them to the application.
 */

const fs = require('fs');
const path = require('path');

// Path to the credentials file (protected by .gitignore)
const GOOGLE_CREDENTIALS_PATH = path.join(__dirname, 'secrets', 'google_oauth_credentials.json');

/**
 * Load Google OAuth credentials
 * @returns {Object} Google OAuth credentials
 */
function loadGoogleCredentials() {
  try {
    // Check if the file exists
    if (!fs.existsSync(GOOGLE_CREDENTIALS_PATH)) {
      console.error('Google OAuth credentials file not found!');
      console.error('Expected location:', GOOGLE_CREDENTIALS_PATH);
      console.error('Please place your credentials file in the correct location.');
      return null;
    }
    
    // Read and parse the credentials
    const rawData = fs.readFileSync(GOOGLE_CREDENTIALS_PATH);
    const credentials = JSON.parse(rawData);
    return credentials;
  } catch (error) {
    console.error('Error loading Google credentials:', error.message);
    return null;
  }
}

module.exports = {
  google: loadGoogleCredentials()
};