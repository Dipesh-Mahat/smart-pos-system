const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const uploadDir = path.join(__dirname, '../uploads');
  const productImagesDir = path.join(uploadDir, 'products');
  const expenseAttachmentsDir = path.join(uploadDir, 'expenses');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  if (!fs.existsSync(productImagesDir)) {
    fs.mkdirSync(productImagesDir, { recursive: true });
  }
  
  if (!fs.existsSync(expenseAttachmentsDir)) {
    fs.mkdirSync(expenseAttachmentsDir, { recursive: true });
  }
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

// Configure storage for expense attachments
const expenseAttachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/expenses'));
  },
  filename: (req, file, cb) => {
    const shopId = req.user._id;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `expense-${shopId}-${uniqueSuffix}${ext}`);
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

// Setup multer for expense attachments
const uploadExpenseAttachment = multer({
  storage: expenseAttachmentStorage,
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

// Middleware for expense attachment upload
const expenseAttachmentUpload = (req, res, next) => {
  uploadExpenseAttachment(req, res, (err) => {
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
  expenseAttachmentUpload
};
