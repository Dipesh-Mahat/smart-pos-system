const fs = require('fs');
const path = require('path');

// Create cross-platform build script for Vercel deployment
async function build() {
  console.log('Starting build process...');
  
  try {
    // No need to copy files for Vercel - we're using the outputDirectory in vercel.json
    console.log('Vercel will use frontend/public as the output directory');
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
