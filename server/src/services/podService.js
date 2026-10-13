const PODJob = require('../models/PODJob');
const Order = require('../models/Order');
const CustomDesign = require('../models/CustomDesign');
const ArtworkService = require('./artworkService');
const { NullPODProviderAdapter } = require('./podProviderAdapter');
const { FULFILLMENT_MODES, FULFILLMENT_STATUS } = require('../config/constants');

class PODService {
  constructor() {
    this.mode = process.env.POD_FULFILLMENT_MODE || FULFILLMENT_MODES.MANUAL;
    this.providerAdapter = new NullPODProviderAdapter({
      apiKey: process.env.POD_PROVIDER_API_KEY || null
    });
  }

  /**
   * Initializes POD production jobs for all custom items in a newly verified paid order
   */
  async createPODJobsForOrder(order) {
    const jobs = [];

    for (let i = 0; i < order.items.length; i++) {
      const item = order.items[i];
      if (!item.isCustom) continue;

      const design = await CustomDesign.findOne({ designId: item.customDesignId });

      // Generate pre-press production manifest
      const manifest = ArtworkService.generateProductionManifest({
        orderNumber: order.orderNumber,
        design: design || {},
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize
      });

      const podJob = new PODJob({
        orderId: order._id,
        orderNumber: order.orderNumber,
        customDesignId: item.customDesignId,
        designVersion: item.designVersion,
        productName: item.productName,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor,
        quantity: item.quantity,
        printLocations: item.printLocations,
        productionArtwork: {
          frontHighResUrl: design?.sides?.front?.productionArtworkUrl || design?.sides?.front?.previewImageUrl || '',
          backHighResUrl: design?.sides?.back?.productionArtworkUrl || design?.sides?.back?.previewImageUrl || '',
          previewThumbnail: item.previewImageUrl,
          manifestUrl: JSON.stringify(manifest)
        },
        providerMode: this.mode,
        productionStatus: 'pending_review'
      });

      await podJob.save();
      jobs.push(podJob);
    }

    return jobs;
  }

  /**
   * Admin approves a POD design and moves it to production
   */
  async approveDesign({ jobId, reviewerEmail, reviewNotes }) {
    const job = await PODJob.findById(jobId);
    if (!job) throw new Error('POD Job not found');

    job.productionStatus = 'approved';
    job.reviewNotes = reviewNotes || 'Artwork approved for printing';
    job.reviewedBy = reviewerEmail;
    job.reviewedAt = new Date();
    await job.save();

    // Check if connected to an automated provider and credentials exist
    if (job.providerMode === FULFILLMENT_MODES.AUTOMATED && process.env.POD_PROVIDER_API_KEY) {
      try {
        const providerRes = await this.providerAdapter.submitProductionOrder(job);
        job.providerDetails.providerOrderId = providerRes.providerOrderId;
        job.providerDetails.providerStatus = providerRes.status;
        job.providerDetails.submittedAt = new Date();
        job.productionStatus = 'printing';
        await job.save();
      } catch (err) {
        console.error('Automated POD submission failed:', err.message);
        job.reviewNotes += ` | Provider submission warning: ${err.message}`;
        await job.save();
      }
    }

    // Update parent order status
    await Order.findByIdAndUpdate(job.orderId, {
      fulfilmentStatus: 'approved',
      $push: {
        auditLog: {
          actor: reviewerEmail,
          action: 'ARTWORK_APPROVED',
          note: `Custom design ${job.customDesignId} approved for order ${job.orderNumber}`
        }
      }
    });

    return job;
  }

  /**
   * Admin rejects artwork with a required reason
   */
  async rejectDesign({ jobId, reviewerEmail, rejectionReason }) {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new Error('Rejection reason is required.');
    }

    const job = await PODJob.findById(jobId);
    if (!job) throw new Error('POD Job not found');

    job.productionStatus = 'rejected';
    job.rejectionReason = rejectionReason.trim();
    job.reviewedBy = reviewerEmail;
    job.reviewedAt = new Date();
    await job.save();

    await Order.findByIdAndUpdate(job.orderId, {
      fulfilmentStatus: 'artwork_rejected',
      rejectionReason: rejectionReason.trim(),
      $push: {
        auditLog: {
          actor: reviewerEmail,
          action: 'ARTWORK_REJECTED',
          note: `Rejected reason: ${rejectionReason.trim()}`
        }
      }
    });

    return job;
  }

  /**
   * Update production progress step
   */
  async updateProductionStatus({ jobId, status, trackingInfo, adminEmail }) {
    const job = await PODJob.findById(jobId);
    if (!job) throw new Error('POD Job not found');

    job.productionStatus = status;
    await job.save();

    // Sync order fulfilment status
    const statusMap = {
      printing: 'in_production',
      quality_passed: 'quality_checked',
      completed: 'packed'
    };

    const updateFields = {};
    if (statusMap[status]) {
      updateFields.fulfilmentStatus = statusMap[status];
    }

    if (trackingInfo && trackingInfo.trackingNumber) {
      updateFields.tracking = {
        carrier: trackingInfo.carrier || 'BlueDart Express',
        trackingNumber: trackingInfo.trackingNumber,
        trackingUrl: trackingInfo.trackingUrl || '',
        shippedAt: new Date()
      };
      updateFields.fulfilmentStatus = 'shipped';
    }

    await Order.findByIdAndUpdate(job.orderId, {
      ...updateFields,
      $push: {
        auditLog: {
          actor: adminEmail || 'Admin',
          action: `PRODUCTION_STATUS_${status.toUpperCase()}`,
          note: `Production updated to ${status}`
        }
      }
    });

    return job;
  }
}

module.exports = new PODService();
