/**
 * Mobile Scanner Controller
 * Handles OCR processing and mobile scanning functionality (QR code logic removed)
 */

// QRCode generation removed; direct mobile login/scan only
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');

// Configure multer for image uploads
const upload = multer({
  dest: 'uploads/scanned/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});



/**
 * Process OCR scan with AI assistance
 */
const processOCRScan = async (req, res) => {
  try {
    const { type, text, image } = req.body;
    const shopId = req.user.shopId;
    const userId = req.user.id;
    
    if (!text && !image) {
      return res.status(400).json({
        success: false,
        message: 'Either text or image is required for processing'
      });
    }
    
    let extractedText = text;
    
    // If image is provided, extract text using OCR
    if (image && !text) {
      extractedText = await extractTextFromImage(image);
    }
    
    // Process the extracted text with AI
    const processedData = await processTextWithAI(extractedText, type, shopId);
    
    res.status(200).json({
      success: true,
      data: {
        extractedText,
        processedData,
        type,
        suggestions: generateActionSuggestions(processedData, type)
      }
    });
    
  } catch (error) {
    console.error('Error processing OCR scan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process scan',
      error: error.message
    });
  }
};

/**
 * Upload and process scanned image
 */
const uploadScanImage = upload.single('scanImage');

const processScanImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }
    
    const { type = 'product' } = req.body;
    const shopId = req.user.shopId;
    
    // Read the uploaded image
    const imagePath = req.file.path;
    const imageBuffer = await fs.readFile(imagePath);
    
    // Extract text using OCR
    const extractedText = await extractTextFromImage(imageBuffer);
    
    // Process with AI
    const processedData = await processTextWithAI(extractedText, type, shopId);
    
    // Clean up uploaded file
    await fs.unlink(imagePath);
    
    res.status(200).json({
      success: true,
      data: {
        extractedText,
        processedData,
        type,
        suggestions: generateActionSuggestions(processedData, type)
      }
    });
    
  } catch (error) {
    console.error('Error processing scan image:', error);
    
    // Clean up file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error cleaning up file:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to process image',
      error: error.message
    });
  }
};

/**
 * Extract text from image using Google Vision API or fallback OCR
 */
async function extractTextFromImage(imageBuffer) {
  try {
    // If Gemini API is available, use it for OCR
    if (process.env.GEMINI_API_KEY) {
      return await extractTextWithGemini(imageBuffer);
    }
    
    // Fallback: Simple text extraction placeholder
    // In a real implementation, you could use Tesseract.js or other OCR libraries
    return 'Text extraction requires API configuration. Please add your Gemini API key.';
    
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Extract text using Gemini Vision API
 */
async function extractTextWithGemini(imageBuffer) {
  try {
    const base64Image = imageBuffer.toString('base64');
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [
            {
              text: "Extract all text from this image. If it's a receipt or bill, identify products, prices, and quantities. If it's a product label, extract product name, barcode, price, and other details. Format the response as clear, structured text."
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1000
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return response.data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('No text extracted from image');
    }
    
  } catch (error) {
    console.error('Gemini OCR error:', error);
    throw new Error('Failed to extract text using AI');
  }
}

/**
 * Process extracted text with AI to identify products and information
 */
async function processTextWithAI(text, type, shopId) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return processTextFallback(text, type);
    }
    
    const prompt = buildProcessingPrompt(text, type);
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1500
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const aiResponse = response.data.candidates[0].content.parts[0].text;
      return parseAIProcessedText(aiResponse, type);
    } else {
      return processTextFallback(text, type);
    }
    
  } catch (error) {
    console.error('AI text processing error:', error);
    return processTextFallback(text, type);
  }
}

/**
 * Build AI processing prompt based on scan type
 */
function buildProcessingPrompt(text, type) {
  const basePrompt = `Analyze the following text extracted from a ${type} scan:\n\n"${text}"\n\n`;
  
  switch (type) {
    case 'product':
      return basePrompt + `
Extract product information and format as JSON:
{
  "products": [
    {
      "name": "product name",
      "barcode": "barcode if found",
      "price": "price if found",
      "description": "product description",
      "category": "suggested category",
      "brand": "brand if found"
    }
  ],
  "confidence": "high/medium/low",
  "suggestions": ["action suggestions"]
}`;

    case 'bill':
      return basePrompt + `
Extract bill/receipt information and format as JSON:
{
  "items": [
    {
      "name": "item name",
      "quantity": "quantity",
      "price": "unit price",
      "total": "total price"
    }
  ],
  "totalAmount": "total bill amount",
  "date": "bill date if found",
  "merchant": "merchant name if found",
  "confidence": "high/medium/low",
  "suggestions": ["suggestions for adding to inventory"]
}`;

    case 'inventory':
      return basePrompt + `
Extract inventory information and format as JSON:
{
  "items": [
    {
      "name": "item name",
      "quantity": "current quantity",
      "location": "location if mentioned",
      "condition": "condition if mentioned"
    }
  ],
  "confidence": "high/medium/low",
  "suggestions": ["inventory management suggestions"]
}`;

    default:
      return basePrompt + `
Extract all relevant information and format as JSON:
{
  "extracted_info": "structured information",
  "confidence": "high/medium/low",
  "suggestions": ["general suggestions"]
}`;
  }
}

/**
 * Parse AI-processed text response
 */
function parseAIProcessedText(aiResponse, type) {
  try {
    // Clean the response
    let cleanResponse = aiResponse.trim();
    cleanResponse = cleanResponse.replace(/```json\s*|\s*```/g, '');
    cleanResponse = cleanResponse.replace(/```\s*|\s*```/g, '');
    
    // Try to parse as JSON
    if (cleanResponse.startsWith('{') && cleanResponse.endsWith('}')) {
      return JSON.parse(cleanResponse);
    }
    
    // Fallback: structure the text response
    return {
      extracted_info: aiResponse,
      confidence: 'medium',
      suggestions: ['Review the extracted information and add manually if needed']
    };
    
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return {
      extracted_info: aiResponse,
      confidence: 'low',
      suggestions: ['Could not parse AI response automatically']
    };
  }
}

/**
 * Fallback text processing when AI is not available
 */
function processTextFallback(text, type) {
  const lines = text.split('\n').filter(line => line.trim());
  
  switch (type) {
    case 'product':
      return {
        products: [{
          name: extractProductName(lines),
          price: extractPrice(text),
          description: lines.join(' ').substring(0, 100),
          category: 'General'
        }],
        confidence: 'low',
        suggestions: ['Review and edit product information before adding']
      };
      
    case 'bill':
      return {
        items: extractBillItems(lines),
        totalAmount: extractPrice(text),
        confidence: 'low',
        suggestions: ['Verify extracted items before adding to inventory']
      };
      
    default:
      return {
        extracted_info: text,
        confidence: 'low',
        suggestions: ['Manual review required']
      };
  }
}

/**
 * Helper functions for text extraction
 */
function extractProductName(lines) {
  // Look for lines that might be product names (not prices, not too short)
  for (const line of lines) {
    if (line.length > 3 && !line.match(/^\d+\.?\d*$/) && !line.match(/^Rs\.?\s*\d+/)) {
      return line.trim();
    }
  }
  return 'Unknown Product';
}

function extractPrice(text) {
  // Look for price patterns (Rs., NPR, numbers with currency)
  const priceMatch = text.match(/(?:Rs\.?|NPR|₹)\s*(\d+(?:\.\d{2})?)/i) || 
                    text.match(/(\d+(?:\.\d{2})?)\s*(?:Rs\.?|NPR|₹)/i) ||
                    text.match(/(\d+\.\d{2})/);
  
  return priceMatch ? parseFloat(priceMatch[1]) : 0;
}

function extractBillItems(lines) {
  const items = [];
  
  for (const line of lines) {
    if (line.includes('x') || line.includes('*')) {
      // Looks like a quantity line
      const parts = line.split(/[x*]/);
      if (parts.length >= 2) {
        items.push({
          name: parts[1].trim(),
          quantity: parseInt(parts[0]) || 1,
          price: extractPrice(line)
        });
      }
    }
  }
  
  return items.length > 0 ? items : [{
    name: 'Unknown Item',
    quantity: 1,
    price: extractPrice(lines.join(' '))
  }];
}

/**
 * Generate action suggestions based on processed data
 */
function generateActionSuggestions(processedData, type) {
  const suggestions = [];
  
  switch (type) {
    case 'product':
      if (processedData.products?.length > 0) {
        suggestions.push('Add products to your inventory');
        suggestions.push('Set reorder levels for new products');
        suggestions.push('Update product categories if needed');
      }
      break;
      
    case 'bill':
      if (processedData.items?.length > 0) {
        suggestions.push('Add bill items to inventory');
        suggestions.push('Update supplier information');
        suggestions.push('Record expense for accounting');
      }
      break;
      
    case 'inventory':
      suggestions.push('Update inventory quantities');
      suggestions.push('Check for discrepancies');
      suggestions.push('Schedule next inventory count');
      break;
  }
  
  return suggestions;
}

/**
 * Get scanner configuration
 */
const getScannerConfig = async (req, res) => {
  try {
    const { type = 'product' } = req.query;
    
    const config = {
      type,
  features: {
    barcode: true,
    ocr: !!process.env.GEMINI_API_KEY,
    imageUpload: true,
    flashlight: true
  },
      settings: {
        autoFocus: true,
        continuousScanning: type === 'inventory',
        soundEnabled: true,
        vibrationEnabled: true
      },
      scanTypes: {
        product: {
          title: 'Product Scanner',
          description: 'Scan product barcodes and labels',
          icon: 'fa-shopping-bag'
        },
        bill: {
          title: 'Bill Scanner',
          description: 'Scan receipts and bills',
          icon: 'fa-receipt'
        },
        inventory: {
          title: 'Inventory Scanner',
          description: 'Scan inventory items',
          icon: 'fa-boxes'
        }
      }
    };
    
    res.status(200).json({
      success: true,
      data: config
    });
    
  } catch (error) {
    console.error('Error getting scanner config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get scanner configuration',
      error: error.message
    });
  }
};

/**
 * Check session status
 */
const checkSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Check if session exists
    if (!global.scannerSessions || !global.scannerSessions[sessionId]) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Session not found'
      });
    }
    
    const session = global.scannerSessions[sessionId];
    
    // Check if session is still valid (less than 30 minutes old)
    const sessionAge = Date.now() - new Date(session.createdAt).getTime();
    const isValid = sessionAge < 24 * 60 * 60 * 1000; // 24 hours
    
    res.status(200).json({
      success: true,
      valid: isValid,
      connected: !!session.connected,
      sessionId,
      createdAt: session.createdAt,
      deviceInfo: session.deviceInfo || null
    });
    
  } catch (error) {
    console.error('Error checking session status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check session status',
      error: error.message
    });
  }
};

/**
 * Get available connection modes
 */
const getConnectionModes = async (req, res) => {
  try {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    
    // Find suitable IP addresses for different connection types
    let localNetworkIPs = [];
    let hotspotIPs = [];
    
    Object.keys(networkInterfaces).forEach(ifaceName => {
      const iface = networkInterfaces[ifaceName];
      iface.forEach(details => {
        // Only include IPv4 addresses that are not internal
        if (details.family === 'IPv4' && !details.internal) {
          // Check if it might be a hotspot (often 192.168.137.x or 172.20.x.x)
          if (details.address.startsWith('192.168.137.') || 
              details.address.startsWith('172.20.') || 
              details.address.includes('hotspot')) {
            hotspotIPs.push(details.address);
          } else if (!details.address.startsWith('169.254.')) { 
            // Skip link-local addresses
            localNetworkIPs.push(details.address);
          }
        }
      });
    });
    
    res.status(200).json({
      success: true,
      modes: {
        online: process.env.NODE_ENV === 'production',
        local: localNetworkIPs.length > 0,
        hotspot: hotspotIPs.length > 0
      },
      networkInfo: {
        localIPs: localNetworkIPs,
        hotspotIPs
      }
    });
    
  } catch (error) {
    console.error('Error getting connection modes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get connection modes',
      error: error.message
    });
  }
};

module.exports = {
  // All QR code logic removed; only direct mobile login/scan supported
  processOCRScan,
  uploadScanImage: uploadScanImage,
  processScanImage,
  getScannerConfig,
  checkSessionStatus,
  getConnectionModes
};
