const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Public Support Ticket creation
router.post('/support/tickets', adminController.createPublicSupportTicket);

// Public Collections
router.get('/collections', adminController.getPublicCollections);
router.get('/collections/:slug', adminController.getPublicCollectionBySlug);

// Public Settings
router.get('/settings/public', adminController.getPublicSettings);

module.exports = router;
