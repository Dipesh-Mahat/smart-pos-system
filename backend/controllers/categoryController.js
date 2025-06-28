const Category = require('../models/Category');
const Product = require('../models/Product');

// Get all categories for a shop
exports.getCategories = async (req, res) => {
  try {
    const { includeProducts = false } = req.query;
    
    let categories = await Category.find({ shopId: req.user._id })
      .populate('parentCategory', 'name')
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    
    // If includeProducts is true, get product count for each category
    if (includeProducts === 'true') {
      categories = await Promise.all(categories.map(async (category) => {
        const productCount = await Product.countDocuments({
          shopId: req.user._id,
          category: category.name
        });
        return { ...category, productCount };
      }));
    }
    
    res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve categories' });
  }
};

// Get a single category
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      shopId: req.user._id
    }).populate('parentCategory', 'name');
    
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    
    // Get products in this category
    const products = await Product.find({
      shopId: req.user._id,
      category: category.name
    }).select('name price stock imageUrl');
    
    res.status(200).json({ 
      success: true, 
      category: { ...category.toObject(), products } 
    });
  } catch (error) {
    console.error('Error getting category:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve category' });
  }
};

// Create a new category
exports.createCategory = async (req, res) => {
  try {
    const categoryData = {
      ...req.body,
      shopId: req.user._id
    };
    
    const category = new Category(categoryData);
    await category.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Category created successfully', 
      category 
    });
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Category with this name already exists' 
      });
    }
    
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
};

// Update a category
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, shopId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Category updated successfully', 
      category 
    });
  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Category with this name already exists' 
      });
    }
    
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      shopId: req.user._id
    });
    
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    
    // Check if category has products
    const productCount = await Product.countDocuments({
      shopId: req.user._id,
      category: category.name
    });
    
    if (productCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot delete category. ${productCount} products are assigned to this category. Please reassign or delete the products first.` 
      });
    }
    
    // Check if category has subcategories
    const subcategoryCount = await Category.countDocuments({
      shopId: req.user._id,
      parentCategory: category._id
    });
    
    if (subcategoryCount > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot delete category. ${subcategoryCount} subcategories exist. Please delete subcategories first.` 
      });
    }
    
    await Category.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ 
      success: true, 
      message: 'Category deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
};

// Get category hierarchy (tree structure)
exports.getCategoryHierarchy = async (req, res) => {
  try {
    const categories = await Category.find({ shopId: req.user._id })
      .populate('parentCategory', 'name')
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    
    // Build hierarchy tree
    const categoryMap = {};
    const rootCategories = [];
    
    // First pass: create map and identify root categories
    categories.forEach(category => {
      categoryMap[category._id] = { ...category, children: [] };
      if (!category.parentCategory) {
        rootCategories.push(categoryMap[category._id]);
      }
    });
    
    // Second pass: build parent-child relationships
    categories.forEach(category => {
      if (category.parentCategory) {
        const parent = categoryMap[category.parentCategory._id];
        if (parent) {
          parent.children.push(categoryMap[category._id]);
        }
      }
    });
    
    res.status(200).json({ success: true, categories: rootCategories });
  } catch (error) {
    console.error('Error getting category hierarchy:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve category hierarchy' });
  }
};

// Reorder categories
exports.reorderCategories = async (req, res) => {
  try {
    const { categoryOrders } = req.body; // Array of { id, sortOrder }
    
    if (!Array.isArray(categoryOrders)) {
      return res.status(400).json({ 
        success: false, 
        error: 'categoryOrders must be an array' 
      });
    }
    
    // Update sort order for each category
    const updatePromises = categoryOrders.map(({ id, sortOrder }) =>
      Category.findOneAndUpdate(
        { _id: id, shopId: req.user._id },
        { sortOrder: parseInt(sortOrder) },
        { runValidators: true }
      )
    );
    
    await Promise.all(updatePromises);
    
    res.status(200).json({ 
      success: true, 
      message: 'Categories reordered successfully' 
    });
  } catch (error) {
    console.error('Error reordering categories:', error);
    res.status(500).json({ success: false, error: 'Failed to reorder categories' });
  }
};
