const fs = require('fs');
const path = require('path');
const { PRINT_SPECIFICATIONS } = require('../config/constants');

class ArtworkService {
  /**
   * Helper to parse image dimensions & verify magic numbers from raw file buffer
   */
  static inspectImageBuffer(buffer) {
    if (!buffer || buffer.length < 16) {
      return { detectedFormat: null, width: null, height: null };
    }

    // 1. PNG Header (89 50 4E 47 0D 0A 1A 0A)
    if (buffer.length >= 24 &&
        buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
        buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { detectedFormat: 'image/png', width, height };
    }

    // 2. JPEG Header (FF D8 FF)
    if (buffer.length >= 4 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      let offset = 2;
      let width = null;
      let height = null;
      while (offset < buffer.length - 8) {
        if (buffer[offset] !== 0xFF) {
          offset++;
          continue;
        }
        const marker = buffer[offset + 1];
        // SOF0 (0xC0), SOF1 (0xC1), SOF2 (0xC2)
        if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
          height = buffer.readUInt16BE(offset + 5);
          width = buffer.readUInt16BE(offset + 7);
          break;
        } else if (marker === 0xD9 || marker === 0xDA) {
          break; // Stop at SOS / EOI
        } else {
          const length = buffer.readUInt16BE(offset + 2);
          offset += 2 + length;
        }
      }
      return { detectedFormat: 'image/jpeg', width, height };
    }

    // 3. WebP Header (RIFF .... WEBP)
    if (buffer.length >= 30 &&
        buffer.toString('ascii', 0, 4) === 'RIFF' &&
        buffer.toString('ascii', 8, 12) === 'WEBP') {
      let width = null;
      let height = null;
      const vp8Chunk = buffer.toString('ascii', 12, 16);
      if (vp8Chunk === 'VP8 ' && buffer.length >= 30) {
        width = buffer.readUInt16LE(26) & 0x3fff;
        height = buffer.readUInt16LE(28) & 0x3fff;
      } else if (vp8Chunk === 'VP8L' && buffer.length >= 25) {
        const b0 = buffer[21];
        const b1 = buffer[22];
        const b2 = buffer[23];
        const b3 = buffer[24];
        width = 1 + (((b1 & 0x3f) << 8) | b0);
        height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      } else if (vp8Chunk === 'VP8X' && buffer.length >= 30) {
        width = 1 + buffer.readUIntLE(24, 3);
        height = 1 + buffer.readUIntLE(27, 3);
      }
      return { detectedFormat: 'image/webp', width, height };
    }

    return { detectedFormat: null, width: null, height: null };
  }

  /**
   * Validates image dimensions, file size and estimated DPI
   * Standard A3 garment print is 12" x 16". At 300 DPI = 3600 x 4800 px.
   * At 150 DPI minimum = 1800 x 2400 px.
   */
  static validateImageQuality({ width, height, fileSizeBytes, mimeType, filePath, buffer }) {
    const warnings = [];
    const errors = [];

    // Inspect file content if filePath or buffer provided
    let verifiedWidth = width;
    let verifiedHeight = height;

    let buf = buffer;
    if (!buf && filePath && fs.existsSync(filePath)) {
      try {
        const fd = fs.openSync(filePath, 'r');
        const headerBuf = Buffer.alloc(4096);
        fs.readSync(fd, headerBuf, 0, 4096, 0);
        fs.closeSync(fd);
        buf = headerBuf;
      } catch (readErr) {
        console.warn('Error reading file header:', readErr.message);
      }
    }

    if (buf) {
      const inspected = this.inspectImageBuffer(buf);
      if (inspected.detectedFormat && inspected.detectedFormat !== mimeType) {
        errors.push(`File content (${inspected.detectedFormat}) does not match declared type (${mimeType}).`);
      } else if (!inspected.detectedFormat) {
        errors.push(`Invalid image content. File signature does not match PNG, JPEG, or WebP.`);
      }
      if (inspected.width && inspected.height) {
        verifiedWidth = inspected.width;
        verifiedHeight = inspected.height;
      }
    }

    if (!PRINT_SPECIFICATIONS.ALLOWED_MIME_TYPES.includes(mimeType)) {
      errors.push(`Unsupported file format (${mimeType}). Supported: PNG, JPEG, WebP.`);
    }

    if (fileSizeBytes > PRINT_SPECIFICATIONS.MAX_FILE_SIZE_BYTES) {
      errors.push(`File size (${(fileSizeBytes / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 15MB.`);
    }

    // Minimum print dimensions
    if (verifiedWidth && verifiedWidth < 400) {
      errors.push(`Image width (${verifiedWidth}px) is too small for garment printing. Minimum width is 400px.`);
    }
    if (verifiedHeight && verifiedHeight < 400) {
      errors.push(`Image height (${verifiedHeight}px) is too small for garment printing. Minimum height is 400px.`);
    }

    // Estimate effective DPI across a standard 10-inch chest print area
    const safeW = verifiedWidth || 1200;
    const safeH = verifiedHeight || 1200;
    const estimatedDpi = Math.round(Math.min(safeW / 10, safeH / 12));

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
      estimatedDpi: Math.max(72, estimatedDpi),
      detectedWidth: verifiedWidth,
      detectedHeight: verifiedHeight
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
