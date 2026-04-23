const express = require('express');
const configController = require('./config.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

const router = express.Router();

// Apply authentication middleware to all config routes
router.use(authMiddleware);

// Admin-only access control middleware
const adminOnly = (req, res, next) => {
  const userRoles = req.user?.roles || [];
  if (!userRoles.includes('admin')) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Admin role required',
    });
  }
  next();
};

// Routes

// GET all PFE configurations (admin only)
router.get('/', adminOnly, (req, res) => configController.getAll(req, res));

// GET a single configuration by ID (admin only)
router.get('/:id', adminOnly, (req, res) => configController.getById(req, res));

// CREATE a new configuration (admin only)
router.post('/', adminOnly, (req, res) => configController.create(req, res));

// UPDATE a configuration (admin only)
router.put('/:id', adminOnly, (req, res) => configController.update(req, res));
router.patch('/:id', adminOnly, (req, res) => configController.update(req, res));

// DELETE a configuration (admin only)
router.delete('/:id', adminOnly, (req, res) => configController.delete(req, res));

module.exports = router;
