const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { promisify } = require('util');
const FileType = require('file-type');
const { logSecurityEvent } = require('./securityLogger');

// Allowed file types and their corresponding MIME types
const ALLOWED_FILE_TYPES = {
    images: {
        mimetypes: ['image/jpeg', 'image/png', 'image/webp'],
        extensions: ['.jpg', '.jpeg', '.png', '.webp'],
        maxSize: 5 * 1024 * 1024 // 5MB
    },
    documents: {
        mimetypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        extensions: ['.pdf', '.docx'],
        maxSize: 10 * 1024 * 1024 // 10MB
    },
    receipts: {
        mimetypes: ['image/jpeg', 'image/png', 'application/pdf'],
        extensions: ['.jpg', '.jpeg', '.png', '.pdf'],
        maxSize: 2 * 1024 * 1024 // 2MB
    }
};

// Virus scanning simulation (in production, use real antivirus API)
const simulateVirusScan = async (filePath) => {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate scan
    const fileSize = fs.statSync(filePath).size;
    // Simulated detection of suspicious patterns
    const isSuspicious = fileSize > 100 * 1024 * 1024; // Flag files > 100MB
    return !isSuspicious;
};

// Generate secure random filename
const generateSecureFilename = (originalname, type) => {
    const extension = path.extname(originalname).toLowerCase();
    const randomName = crypto.randomBytes(32).toString('hex');
    return `${type}_${Date.now()}_${randomName}${extension}`;
};

// Ensure upload directories exist with secure permissions
const createUploadDirs = () => {
    const uploadDir = path.join(__dirname, '../uploads');
    const productImagesDir = path.join(uploadDir, 'products');

    
    const createSecureDir = (dir) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { 
                recursive: true,
                mode: 0o750 // Restricted permissions
            });
        }
    };
  
    createSecureDir(uploadDir);
    createSecureDir(productImagesDir);

};

/**
 * Validate file before processing
 * @param {Object} file - The uploaded file object
 * @param {string} type - The type of file (images/documents/receipts)
 * @returns {Promise<boolean>} - Whether the file is valid
 */
const validateFile = async (file, type) => {
    try {
        const allowedTypes = ALLOWED_FILE_TYPES[type];
        if (!allowedTypes) {
            throw new Error('Invalid file type category');
        }

        // Check file size
        if (file.size > allowedTypes.maxSize) {
            throw new Error(`File size exceeds the ${allowedTypes.maxSize / (1024 * 1024)}MB limit`);
        }

        // Verify file extension
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedTypes.extensions.includes(ext)) {
            throw new Error('Invalid file extension');
        }

        // Verify MIME type using file-type
        const fileType = await FileType.fromBuffer(file.buffer);
        if (!fileType || !allowedTypes.mimetypes.includes(fileType.mime)) {
            throw new Error('Invalid file type');
        }

        // Check for executable content
        const isExecutable = ext.match(/\.(exe|dll|bat|cmd|sh|ps1|vbs|js)$/i);
        if (isExecutable) {
            throw new Error('Executable files are not allowed');
        }

        return true;
    } catch (error) {
        logSecurityEvent('FILE_VALIDATION_FAILED', {
            filename: file.originalname,
            type,
            error: error.message
        });
        return false;
    }
};

/**
 * Process and store uploaded file securely
 * @param {Object} file - The uploaded file

 * @returns {Promise<string>} - The secure filename
 */
const processAndStoreFile = async (file, type) => {
    try {
        // Generate secure filename
        const secureFilename = generateSecureFilename(file.originalname, type);
        const uploadDir = path.join(__dirname, '../uploads', type);
        const filePath = path.join(uploadDir, secureFilename);

        // Ensure upload directory exists
        await promisify(fs.mkdir)(uploadDir, { recursive: true, mode: 0o750 });

        // Write file with restricted permissions
        await promisify(fs.writeFile)(filePath, file.buffer, { mode: 0o640 });

        // Verify file integrity
        const uploadedHash = crypto
            .createHash('sha256')
            .update(file.buffer)
            .digest('hex');

        const storedBuffer = await promisify(fs.readFile)(filePath);
        const storedHash = crypto
            .createHash('sha256')
            .update(storedBuffer)
            .digest('hex');

        if (uploadedHash !== storedHash) {
            throw new Error('File integrity check failed');
        }

        // Simulate virus scan (replace with real AV in production)
        const isSafe = await simulateVirusScan(filePath);
        if (!isSafe) {
            await promisify(fs.unlink)(filePath);
            throw new Error('File failed security scan');
        }

        return secureFilename;
    } catch (error) {
        logSecurityEvent('FILE_PROCESSING_ERROR', {
            error: error.message,
            type
        });
        throw error;
    }
};

// Configure multer with security settings
const upload = (type) => {
    const storage = multer.memoryStorage(); // Use memory storage for processing

    const fileFilter = async (req, file, cb) => {
        try {
            if (!ALLOWED_FILE_TYPES[type]) {
                cb(new Error('Invalid upload type'));
                return;
            }

            const isValid = await validateFile(file, type);
            if (!isValid) {
                cb(new Error('File validation failed'));
                return;
            }

            cb(null, true);
        } catch (error) {
            cb(error);
        }
    };

    return multer({
        storage,
        fileFilter,
        limits: {
            fileSize: ALLOWED_FILE_TYPES[type]?.maxSize || 1024 * 1024, // Default 1MB
            files: 1 // Only allow one file per request
        }
    });
};

// Handle file upload with security checks
const handleFileUpload = async (req, type) => {
    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }

        // Additional validation
        const isValid = await validateFile(req.file, type);
        if (!isValid) {
            throw new Error('File validation failed');
        }

        // Process and store the file
        const filename = await processAndStoreFile(req.file, type);
        
        logSecurityEvent('FILE_UPLOAD_SUCCESS', {
            filename,
            type,
            size: req.file.size
        });

        return filename;
    } catch (error) {
        logSecurityEvent('FILE_UPLOAD_FAILED', {
            error: error.message,
            type
        });
        throw error;
    }
};

// Clean up temporary files
const cleanupTempFiles = async (filepath) => {
    try {
        if (fs.existsSync(filepath)) {
            await promisify(fs.unlink)(filepath);
        }
    } catch (error) {
        console.error('Error cleaning up temporary file:', error);
    }
};

module.exports = {
    upload,
    handleFileUpload,
    cleanupTempFiles,
    ALLOWED_FILE_TYPES
};

// Create upload directories
createUploadDirs();

// Configure storage for product images
const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/products'));
  },
  filename: (req, file, cb) => {
    const shopId = req.user._id;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${shopId}-${uniqueSuffix}${ext}`);
  }
});



  destination: (req, file, cb) => {

  },
  filename: (req, file, cb) => {
    const shopId = req.user._id;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);

  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// File filter for documents
const documentFileFilter = (req, file, cb) => {
  // Accept documents and images
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|txt)$/i)) {
    return cb(new Error('Only image and document files are allowed!'), false);
  }
  cb(null, true);
};

// Setup multer for product images
const uploadProductImage = multer({
  storage: productImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: imageFileFilter
}).single('image');




  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: documentFileFilter
}).single('attachment');

// Middleware for product image upload
const productImageUpload = (req, res, next) => {
  uploadProductImage(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred
      return res.status(400).json({ error: err.message });
    }
    
    // All good, continue
    next();
  });
};




    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      // An unknown error occurred
      return res.status(400).json({ error: err.message });
    }
    
    // All good, continue
    next();
  });
};

module.exports = {
  productImageUpload,

};
