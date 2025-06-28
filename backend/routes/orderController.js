const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get available suppliers for shopowner
// @route   GET /api/suppliers/available
// @access  Private (Shopowner)
exports.getAvailableSuppliers = async (req, res) => {
  try {
    if (req.user.role !== 'shopowner') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    const suppliers = await User.find({ 
      role: 'supplier', 
      status: 'approved' 
    }).select('firstName lastName email phone');
    
    res.status(200).json({ success: true, suppliers });
  } catch (error) {
    console.error('Error getting suppliers:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve suppliers' });
  }
};

// @desc    Get products from a specific supplier
// @route   GET /api/suppliers/:supplierId/products
// @access  Private (Shopowner)
exports.getSupplierProducts = async (req, res) => {
  try {
    if (req.user.role !== 'shopowner') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const { supplierId } = req.params;
    
    // Verify supplier exists and is approved
    const supplier = await User.findOne({ 
      _id: supplierId, 
      role: 'supplier', 
      status: 'approved' 
    }).select('firstName lastName email shopName');
    
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found or not approved' });
    }

    // Get products from this supplier
    // Note: This assumes products have a supplierInfo field pointing to the supplier
    // If your product model is different, adjust this query accordingly
    const products = await Product.find({
      'supplierInfo.supplierId': supplierId,
      isActive: true
    }).select('name description price costPrice stock minStockLevel unit imageUrl category supplierInfo');

    res.status(200).json({ 
      success: true, 
      supplier,
      products 
    });
  } catch (error) {
    console.error('Error getting supplier products:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve supplier products' });
  }
};

// ...existing code...