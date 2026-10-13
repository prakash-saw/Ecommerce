const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const CustomDesign = require('../models/CustomDesign');
const DesignAsset = require('../models/DesignAsset');
const ArtworkService = require('../services/artworkService');
const PricingService = require('../services/pricingService');

/**
 * Upload customer artwork file
 */
exports.uploadArtwork = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No artwork image provided.' });
    }

    const { originalname, mimetype, size, filename } = req.file;
    const ownerId = req.user ? req.user._id.toString() : (req.headers['x-guest-session'] || 'guest_anon');

    // Assume standard 1000x1000px if dimension probe is unavailable without native deps
    const width = parseInt(req.body.width, 10) || 1200;
    const height = parseInt(req.body.height, 10) || 1200;

    const validation = ArtworkService.validateImageQuality({
      width,
      height,
      fileSizeBytes: size,
      mimeType: mimetype
    });

    if (!validation.isValid) {
      // Remove file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Artwork validation failed',
        errors: validation.errors
      });
    }

    const assetId = `ast_${crypto.randomBytes(6).toString('hex')}`;
    const publicUrl = `/uploads/artwork/${filename}`;

    const asset = new DesignAsset({
      assetId,
      storagePath: req.file.path,
      publicUrl,
      originalFilename: originalname,
      mimeType: mimetype,
      fileSizeBytes: size,
      dimensions: {
        width,
        height,
        dpi: validation.estimatedDpi
      },
      uploadOwner: ownerId
    });

    await asset.save();

    res.json({
      success: true,
      assetId,
      url: publicUrl,
      originalFilename: originalname,
      estimatedDpi: validation.estimatedDpi,
      warnings: validation.warnings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Save preview canvas snapshot image to server filesystem instead of MongoDB
 */
const saveBase64PreviewToFile = (base64Data, prefix = 'preview') => {
  if (!base64Data || !base64Data.startsWith('data:image')) {
    return base64Data || '';
  }

  try {
    const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches || matches.length < 3) return '';

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const previewDir = path.join(__dirname, '../../uploads/previews');

    if (!fs.existsSync(previewDir)) {
      fs.mkdirSync(previewDir, { recursive: true });
    }

    const filePath = path.join(previewDir, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/previews/${filename}`;
  } catch (err) {
    console.error('Error saving preview snapshot to file:', err.message);
    return '';
  }
};

/**
 * Save or update custom design configuration
 */
exports.saveDesign = async (req, res) => {
  try {
    const {
      designId,
      designName,
      garmentStyle,
      productId,
      selectedColor,
      selectedSize,
      sides,
      previewThumbnailBase64,
      saveAsNew
    } = req.body;

    const ownerId = req.user ? req.user._id.toString() : (req.headers['x-guest-session'] || 'guest_anon');

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    // Save thumbnails to disk if base64 provided
    let previewThumbnailUrl = '';
    if (previewThumbnailBase64) {
      previewThumbnailUrl = saveBase64PreviewToFile(previewThumbnailBase64, 'thumb');
    }

    // Clean side previews
    const processedSides = {
      front: {
        enabled: !!sides?.front?.enabled,
        elements: sides?.front?.elements || [],
        previewImageUrl: saveBase64PreviewToFile(sides?.front?.previewImageUrl, 'front_prev'),
        productionArtworkUrl: saveBase64PreviewToFile(sides?.front?.productionArtworkUrl, 'front_art')
      },
      back: {
        enabled: !!sides?.back?.enabled,
        elements: sides?.back?.elements || [],
        previewImageUrl: saveBase64PreviewToFile(sides?.back?.previewImageUrl, 'back_prev'),
        productionArtworkUrl: saveBase64PreviewToFile(sides?.back?.productionArtworkUrl, 'back_art')
      }
    };

    // Calculate warnings
    const warnings = [];
    const printLocations = [];
    if (processedSides.front.enabled && processedSides.front.elements.length > 0) printLocations.push('front');
    if (processedSides.back.enabled && processedSides.back.elements.length > 0) printLocations.push('back');

    if (printLocations.length === 0) {
      return res.status(400).json({ success: false, message: 'Please add at least one design element (text or image) to the t-shirt.' });
    }

    let existingDesign = null;
    if (designId && !saveAsNew) {
      existingDesign = await CustomDesign.findOne({ designId });
      if (existingDesign) {
        if (existingDesign.isLocked) {
          return res.status(400).json({ success: false, message: 'This design version is attached to a paid order and is locked.' });
        }
        if (req.user && req.user.role !== 'admin' && existingDesign.ownerId !== req.user._id.toString()) {
          return res.status(403).json({ success: false, message: 'You do not have permission to modify this design.' });
        }
      }
    }

    const finalDesignId = existingDesign ? existingDesign.designId : `dsgn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const nextVersion = existingDesign ? (existingDesign.version + 1) : 1;

    const design = existingDesign || new CustomDesign({ designId: finalDesignId });

    // Calculate verified unit price
    let unitPricePaise = await PricingService.calculateItemUnitPricePaise({
      productId,
      isCustom: true,
      printLocations
    });

    // Style adjustments if applicable
    const garmentCategory = garmentStyle || 'Oversized T-Shirt';
    if (garmentCategory === 'Hoodie') unitPricePaise += 70000; // +₹700
    else if (garmentCategory === 'Sweatshirt') unitPricePaise += 50000; // +₹500
    else if (garmentCategory === 'Polo T-Shirt') unitPricePaise += 20000; // +₹200

    design.designId = finalDesignId;
    design.ownerId = ownerId;
    design.designName = (designName || 'Custom T-Shirt Design').trim();
    design.garmentStyle = garmentCategory;
    design.productId = productId;
    design.version = nextVersion;
    design.selectedColor = selectedColor || { id: 'white', name: 'Optic White', hex: '#FFFFFF' };
    design.selectedSize = selectedSize || 'L';
    design.pricePaise = unitPricePaise;
    design.sides = processedSides;
    design.previewThumbnail = previewThumbnailUrl || design.sides.front.previewImageUrl;
    design.validation = {
      isValid: true,
      warnings,
      boundaryClipping: false,
      lowDpiDetected: false
    };

    await design.save();

    res.json({
      success: true,
      designId: design.designId,
      designName: design.designName,
      garmentStyle: design.garmentStyle,
      version: design.version,
      previewThumbnail: design.previewThumbnail,
      printLocations,
      unitPricePaise,
      validation: design.validation
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get all saved designs belonging to the authenticated customer
 */
exports.getMyDesigns = async (req, res) => {
  try {
    const ownerId = req.user._id.toString();
    const designs = await CustomDesign.find({ ownerId })
      .populate('productId', 'name slug basePricePaise images category')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: designs.length,
      designs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Duplicate an existing custom design
 */
exports.duplicateDesign = async (req, res) => {
  try {
    const { designId } = req.params;
    const original = await CustomDesign.findOne({ designId });
    if (!original) {
      return res.status(404).json({ success: false, message: 'Original design not found.' });
    }

    if (req.user.role !== 'admin' && original.ownerId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have permission to duplicate this design.' });
    }

    const newDesignId = `dsgn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const copy = new CustomDesign({
      designId: newDesignId,
      ownerId: req.user._id.toString(),
      designName: `${original.designName || 'Custom T-Shirt'} (Copy)`,
      garmentStyle: original.garmentStyle || 'Oversized T-Shirt',
      productId: original.productId,
      version: 1,
      selectedColor: original.selectedColor,
      selectedSize: original.selectedSize,
      pricePaise: original.pricePaise,
      sides: original.sides,
      previewThumbnail: original.previewThumbnail,
      validation: original.validation,
      status: 'saved',
      isLocked: false
    });

    await copy.save();
    res.status(201).json({
      success: true,
      message: 'Design duplicated successfully.',
      design: copy
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Delete a customer design
 */
exports.deleteDesign = async (req, res) => {
  try {
    const { designId } = req.params;
    const design = await CustomDesign.findOne({ designId });
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found.' });
    }

    if (req.user.role !== 'admin' && design.ownerId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have permission to delete this design.' });
    }

    if (design.isLocked) {
      return res.status(400).json({ success: false, message: 'Cannot delete design attached to a confirmed order.' });
    }

    await CustomDesign.deleteOne({ designId });
    res.json({
      success: true,
      message: 'Design deleted successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get design configuration by ID
 */
exports.getDesignById = async (req, res) => {
  try {
    const design = await CustomDesign.findOne({ designId: req.params.designId }).populate('productId');
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    // Owner or admin authorization check
    const currentOwnerId = req.user ? req.user._id.toString() : (req.headers['x-guest-session'] || 'guest_anon');
    if (req.user?.role !== 'admin' && design.ownerId !== currentOwnerId && design.ownerId !== 'guest_anon') {
      return res.status(403).json({ success: false, message: 'You do not have permission to view this custom design.' });
    }

    res.json({ success: true, design });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
