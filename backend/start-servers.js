#!/usr/bin/env node

/**
 * Script to start both the main backend server and the OCR API server
 */

const { spawn } = require('child_process');
const path = require('path');

// Start main Express server
console.log('Starting main backend server...');
const mainServer = spawn('node', ['server.js'], {
  cwd: path.resolve(__dirname),
  stdio: 'inherit'
});

mainServer.on('error', (err) => {
  console.error('Failed to start main server:', err);
});

// Check if Python is available before starting OCR server
const checkPython = spawn('python', ['--version']);
checkPython.on('error', (err) => {
  console.warn('Python not found. OCR API server will not be started.');
  console.warn('To enable OCR functionality, please install Python and required dependencies.');
});

checkPython.on('close', (code) => {
  if (code === 0) {
    // Python is available, start OCR API server
    console.log('Starting OCR API server...');
    
    const ocrServer = spawn('python', ['ocr_api.py'], {
      cwd: path.resolve(__dirname, 'ocr'),
      stdio: 'inherit'
    });

    ocrServer.on('error', (err) => {
      console.error('Failed to start OCR API server:', err);
      console.log('OCR functionality will not be available.');
    });
    
    ocrServer.on('close', (code) => {
      if (code !== 0) {
        console.log(`OCR API server process exited with code ${code}`);
      }
    });
  }
});

process.on('SIGINT', () => {
  console.log('Shutting down all servers...');
  mainServer.kill('SIGINT');
  process.exit(0);
});
