const fs = require('fs');
const path = require('path');

// Create cross-platform build script for Vercel deployment
async function build() {
  console.log('Starting build process...');
  
  try {
    // No need to copy files for Vercel - we're using the outputDirectory in vercel.json
    console.log('Vercel will use frontend/public as the output directory');
    
    // Make sure mobile-scanner.html is accessible
    try {
      const mobileScanner = fs.readFileSync(
        path.join(__dirname, '..', 'frontend', 'mobile-scanner.html'),
        'utf8'
      );
      
      // Write to the frontend/public directory
      fs.writeFileSync(
        path.join(__dirname, '..', 'frontend', 'public', 'mobile-scanner.html'),
        mobileScanner
      );
      
      console.log('Copied mobile-scanner.html to frontend/public directory');
    } catch (err) {
      console.error('Error handling mobile-scanner.html:', err);
    }
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
