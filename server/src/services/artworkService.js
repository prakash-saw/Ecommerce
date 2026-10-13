const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PRINT_SPECIFICATIONS } = require('../config/constants');

class ArtworkService {
  /**
   * Validates image dimensions, file size and estimated DPI
   * Standard A3 garment print is 12" x 16". At 300 DPI = 3600 x 4800 px.
   * At 150 DPI minimum = 1800 x 2400 px.
   */
  static validateImageQuality({ width, height, fileSizeBytes, mimeType }) {
    const warnings = [];
    const errors = [];

    if (!PRINT_SPECIFICATIONS.ALLOWED_MIME_TYPES.includes(mimeType)) {
      errors.push(`Unsupported file format (${mimeType}). Supported: PNG, JPEG, WebP.`);
    }

    if (fileSizeBytes > PRINT_SPECIFICATIONS.MAX_FILE_SIZE_BYTES) {
      errors.push(`File size (${(fileSizeBytes / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 15MB.`);
    }

    // Estimate effective DPI across a standard 10-inch chest print area
    const estimatedDpi = Math.round(Math.min(width / 10, height / 12));

    if (estimatedDpi < PRINT_SPECIFICATIONS.RECOMMENDED_MIN_DPI) {
      warnings.push(`Low artwork resolution (~${estimatedDpi} DPI). Recommended: at least 150 DPI (1800x2400px) for crisp garment screen/DTG printing.`);
    } else if (estimatedDpi < PRINT_SPECIFICATIONS.IDEAL_DPI) {
      warnings.push(`Moderate artwork resolution (~${estimatedDpi} DPI). Suitable for standard print, but 300 DPI delivers optimum photographic detail.`);
    }

    if (mimeType !== 'image/png' && mimeType !== 'image/webp') {
      warnings.push(`Artwork is not a transparent PNG. Background pixels will be printed unless manually isolated during pre-press.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      estimatedDpi: Math.max(72, estimatedDpi)
    };
  }

  /**
   * Generates a Production Manifest for printers / factory pre-press
   */
  static generateProductionManifest({ orderNumber, design, selectedColor, selectedSize }) {
    const manifest = {
      specVersion: '1.0-POD-MANIFOLD',
      generatedAt: new Date().toISOString(),
      orderNumber,
      garment: {
        type: 'Heavyweight Boxy Unisex Tee (240 GSM)',
        colorName: selectedColor.name,
        colorHex: selectedColor.hex,
        size: selectedSize,
      },
      printAreaDimensions: {
        widthInches: PRINT_SPECIFICATIONS.PRINT_AREA_WIDTH_INCHES,
        heightInches: PRINT_SPECIFICATIONS.PRINT_AREA_HEIGHT_INCHES,
        targetDpi: PRINT_SPECIFICATIONS.IDEAL_DPI,
        canvasPixelWidth: PRINT_SPECIFICATIONS.PRINT_AREA_WIDTH_INCHES * PRINT_SPECIFICATIONS.IDEAL_DPI,
        canvasPixelHeight: PRINT_SPECIFICATIONS.PRINT_AREA_HEIGHT_INCHES * PRINT_SPECIFICATIONS.IDEAL_DPI,
      },
      sides: {
        front: design.sides?.front?.enabled ? {
          enabled: true,
          elementCount: design.sides.front.elements?.length || 0,
          elements: design.sides.front.elements,
          artworkUrl: design.sides.front.productionArtworkUrl || design.sides.front.previewImageUrl
        } : { enabled: false },
        back: design.sides?.back?.enabled ? {
          enabled: true,
          elementCount: design.sides.back.elements?.length || 0,
          elements: design.sides.back.elements,
          artworkUrl: design.sides.back.productionArtworkUrl || design.sides.back.previewImageUrl
        } : { enabled: false }
      },
      prepressNotes: [
        'Check color profile: convert RGB to sRGB or CMYK based on Direct-to-Garment (DTG) RIP requirements.',
        'Preserve alpha channel transparency on PNG files.',
        'Pre-treat white and colored garments according to ink formulation.'
      ]
    };

    return manifest;
  }
}

module.exports = ArtworkService;
