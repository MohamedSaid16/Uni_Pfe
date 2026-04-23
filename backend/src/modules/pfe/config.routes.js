/**
 * PFE Configuration Routes
 * 
 * Admin-only routes for managing PFE system configurations
 * 
 * Access Control: All routes require authentication + 'admin' role
 * 
 * Schema Mapping (PfeConfig):
 * - id: Int (Primary Key, autoincrement)
 * - nom_config: String (VarChar(100), UNIQUE) - Configuration name/identifier
 * - valeur: String (VarChar(50)) - Configuration value
 * - description_ar: String? (Text, optional) - Arabic description
 * - description_en: String? (Text, optional) - English description
 * - anneeUniversitaire: String (VarChar(20)) - Academic year (e.g., "2025/2026")
 * - createdBy: Int? (User ID who created this config)
 * - createdAt: DateTime - Creation timestamp
 * - updatedAt: DateTime - Last update timestamp
 * 
 * Endpoints:
 * GET    /api/v1/pfe/config              - List all configs (filtered by year)
 * GET    /api/v1/pfe/config/:id          - Get a single config by ID
 * POST   /api/v1/pfe/config              - Create new config
 * PUT    /api/v1/pfe/config/:id          - Update config (full)
 * PATCH  /api/v1/pfe/config/:id          - Update config (partial)
 * DELETE /api/v1/pfe/config/:id          - Delete config
 */

const express = require('express');
const configController = require('./config.controller');

const router = express.Router();

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
