const express = require('express');
const router = express.Router();
const dropController = require('../controllers/dropController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Public
router.get('/', dropController.getDrops);
router.get('/:slug', dropController.getDropBySlug);
router.post('/:slug/notify', dropController.subscribeToDrop);

// Admin
router.get('/admin/all', requireAuth, requireAdmin, dropController.getAdminDrops);
router.post('/admin', requireAuth, requireAdmin, dropController.createDrop);
router.put('/admin/:dropId', requireAuth, requireAdmin, dropController.updateDrop);
router.delete('/admin/:dropId', requireAuth, requireAdmin, dropController.deleteDrop);

module.exports = router;
