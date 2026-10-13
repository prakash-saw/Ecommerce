const express = require('express');
const router = express.Router();
const designController = require('../controllers/designController');
const { uploadArtwork } = require('../middleware/upload');
const { optionalAuth, requireAuth } = require('../middleware/auth');

router.post('/upload', optionalAuth, uploadArtwork.single('artwork'), designController.uploadArtwork);
router.post('/save', optionalAuth, designController.saveDesign);
router.get('/my-designs', requireAuth, designController.getMyDesigns);
router.post('/:designId/duplicate', requireAuth, designController.duplicateDesign);
router.delete('/:designId', requireAuth, designController.deleteDesign);
router.get('/:designId', optionalAuth, designController.getDesignById);

module.exports = router;
