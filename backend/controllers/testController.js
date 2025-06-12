// Simple dashboard controller for testing
exports.getTestDashboard = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Dashboard data retrieved successfully',
    data: {
      sales: {
        total: 0,
        count: 0
      },
      inventory: {
        totalItems: 0,
        lowStock: 0
      },
      customers: {
        total: 0
      }
    }
  });
};
