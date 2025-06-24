const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authJWT');
const authorize = require('../middleware/authorize');
const AutoOrder = require('../models/AutoOrder');

// Get all auto-orders for the current shopowner
router.get('/', authenticateJWT, authorize('shopowner'), async (req, res) => {
  try {
    const autoOrders = await AutoOrder.find({ shopId: req.user._id });
    res.status(200).json({ success: true, autoOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a new auto-order
router.post('/', authenticateJWT, authorize('shopowner'), async (req, res) => {
  try {
    const { supplierId, productId, quantity, frequency, nextOrderDate, notes } = req.body;
    const autoOrder = new AutoOrder({
      shopId: req.user._id,
      supplierId,
      productId,
      quantity,
      frequency,
      nextOrderDate,
      notes
    });
    await autoOrder.save();
    res.status(201).json({ success: true, autoOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update an auto-order
router.put('/:id', authenticateJWT, authorize('shopowner'), async (req, res) => {
  try {
    const autoOrder = await AutoOrder.findOneAndUpdate(
      { _id: req.params.id, shopId: req.user._id },
      req.body,
      { new: true }
    );
    if (!autoOrder) {
      return res.status(404).json({ success: false, message: 'Auto-order not found' });
    }
    res.status(200).json({ success: true, autoOrder });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete an auto-order
router.delete('/:id', authenticateJWT, authorize('shopowner'), async (req, res) => {
  try {
    const autoOrder = await AutoOrder.findOneAndDelete({ _id: req.params.id, shopId: req.user._id });
    if (!autoOrder) {
      return res.status(404).json({ success: false, message: 'Auto-order not found' });
    }
    res.status(200).json({ success: true, message: 'Auto-order deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
