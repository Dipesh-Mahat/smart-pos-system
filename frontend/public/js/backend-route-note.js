// Backend route for system health endpoint
// This should be added to routes/index.js if it doesn't already exist

router.get('/api/admin/system-health', authenticateJWT, authorize('admin'), adminController.getSystemHealth);
