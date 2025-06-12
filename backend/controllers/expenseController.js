const Expense = require('../models/Expense');
const path = require('path');
const fs = require('fs');

// Get all expenses
exports.getExpenses = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      startDate, 
      endDate, 
      category, 
      sort = 'date', 
      order = 'desc' 
    } = req.query;
    
    // Build query
    const query = { shopId: req.user._id };
    
    // Add date range filter
    if (startDate || endDate) {
      query.date = {};
      
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.date.$lte = endDateObj;
      }
    }
    
    // Add category filter
    if (category) {
      query.category = category;
    }
    
    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const expenses = await Expense.find(query)
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('addedBy', 'name')
      .lean();
    
    // Get total count for pagination
    const totalExpenses = await Expense.countDocuments(query);
    
    // Return expenses with pagination data
    res.status(200).json({
      expenses,
      pagination: {
        total: totalExpenses,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalExpenses / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting expenses:', error);
    res.status(500).json({ error: 'Failed to retrieve expenses' });
  }
};

// Get a single expense
exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      shopId: req.user._id
    }).populate('addedBy', 'name');
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.status(200).json(expense);
  } catch (error) {
    console.error('Error getting expense:', error);
    res.status(500).json({ error: 'Failed to retrieve expense' });
  }
};

// Create a new expense
exports.createExpense = async (req, res) => {
  try {
    // Add shop ID and user ID to expense data
    const expenseData = {
      ...req.body,
      shopId: req.user._id,
      addedBy: req.user._id
    };
    
    // Create expense
    const expense = new Expense(expenseData);
    await expense.save();
    
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to create expense' });
  }
};

// Update an expense
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, shopId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.status(200).json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

// Delete an expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      shopId: req.user._id
    });
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.status(200).json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};

// Get expense categories
exports.getExpenseCategories = async (req, res) => {
  try {
    // Return all possible expense categories from the schema
    const categories = [
      'rent', 
      'utilities', 
      'salary', 
      'inventory', 
      'equipment', 
      'marketing', 
      'maintenance', 
      'taxes', 
      'insurance', 
      'other'
    ];
    
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error getting expense categories:', error);
    res.status(500).json({ error: 'Failed to retrieve expense categories' });
  }
};

// Get expense summary by month
exports.getMonthlyExpenseSummary = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    // Build date range for the year
    const startDate = new Date(parseInt(year), 0, 1); // January 1st
    const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59, 999); // December 31st
    
    // Aggregate monthly expenses
    const monthlySummary = await Expense.aggregate([
      {
        $match: {
          shopId: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$date' } },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);
    
    // Format the result as an array with entries for all 12 months
    const result = Array(12).fill().map((_, index) => {
      const month = index + 1;
      const found = monthlySummary.find(item => item._id.month === month);
      
      return {
        month,
        monthName: new Date(parseInt(year), index).toLocaleString('default', { month: 'long' }),
        totalAmount: found ? found.totalAmount : 0,
        count: found ? found.count : 0
      };
    });
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting monthly expense summary:', error);
    res.status(500).json({ error: 'Failed to retrieve monthly expense summary' });
  }
};

// Upload expense attachment
exports.uploadExpenseAttachment = async (req, res) => {
  try {
    // The file is already handled by the expenseAttachmentUpload middleware
    if (!req.file) {
      return res.status(400).json({ error: 'No attachment file provided' });
    }
    
    // Find expense and ensure it belongs to the shop
    const expense = await Expense.findOne({
      _id: req.params.id,
      shopId: req.user._id
    });
    
    if (!expense) {
      // Delete the uploaded file if expense doesn't exist
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // If expense already has an attachment, delete the old one
    if (expense.attachmentUrl) {
      const oldAttachmentPath = path.join(__dirname, '..', expense.attachmentUrl.replace(/^\//, ''));
      if (fs.existsSync(oldAttachmentPath)) {
        fs.unlinkSync(oldAttachmentPath);
      }
    }
    
    // Update expense with new attachment URL
    const attachmentUrl = `/uploads/expenses/${path.basename(req.file.path)}`;
    expense.attachmentUrl = attachmentUrl;
    expense.attachmentType = req.file.mimetype;
    expense.attachmentName = req.file.originalname;
    await expense.save();
    
    res.status(200).json({ 
      message: 'Expense attachment uploaded successfully',
      attachmentUrl: attachmentUrl,
      attachmentType: req.file.mimetype,
      attachmentName: req.file.originalname
    });
  } catch (error) {
    console.error('Error uploading expense attachment:', error);
    
    // Delete the uploaded file if there was an error
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to upload expense attachment' });
  }
};
