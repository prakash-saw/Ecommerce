/**
 * Base Abstract Provider Adapter Interface for Print-on-Demand providers
 * (e.g. Printrove, Qikink, Gelato, or custom factory API)
 */
class BasePODProviderAdapter {
  constructor(config = {}) {
    this.name = 'BaseAdapter';
    this.config = config;
  }

  /**
   * Check if credentials and connectivity are valid
   */
  async checkConnection() {
    throw new Error('Method checkConnection() must be implemented by POD adapter.');
  }

  /**
   * Check garment and blank inventory with the provider
   */
  async checkVariantAvailability(providerSku) {
    throw new Error('Method checkVariantAvailability() must be implemented by POD adapter.');
  }

  /**
   * Submit an approved order item to the provider's production queue
   */
  async submitProductionOrder(orderData) {
    throw new Error('Method submitProductionOrder() must be implemented by POD adapter.');
  }

  /**
   * Fetch live production & tracking status from the provider
   */
  async syncProductionStatus(providerOrderId) {
    throw new Error('Method syncProductionStatus() must be implemented by POD adapter.');
  }

  /**
   * Cancel a submitted order if not yet printed
   */
  async cancelProductionOrder(providerOrderId, reason) {
    throw new Error('Method cancelProductionOrder() must be implemented by POD adapter.');
  }
}

/**
 * NullPODProviderAdapter:
 * Safe null adapter ensuring no simulated provider success, synthetic IDs,
 * fixed stock claims, or fabricated status updates occur in fulfillment flows.
 * Manual fulfillment remains authoritative unless a verified real provider adapter is integrated.
 */
class NullPODProviderAdapter extends BasePODProviderAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'ManualWorkshopFulfillment';
  }

  async checkConnection() {
    return {
      connected: false,
      provider: 'None (Manual Fulfillment)',
      message: 'No live external POD provider connected. Dedicated atelier workshop manual fulfillment is active.'
    };
  }

  async checkVariantAvailability(providerSku) {
    return {
      sku: providerSku,
      isAvailable: false,
      stockCount: null,
      message: 'Automated provider stock sync not available. Use atelier catalogue inventory.'
    };
  }

  async submitProductionOrder(orderData) {
    // Never simulate provider success or generate synthetic order IDs
    if (!this.config.apiKey) {
      throw new Error('Cannot submit to automated provider: Missing POD_PROVIDER_API_KEY. Defaulting to manual fulfillment.');
    }
    throw new Error('Cannot submit to automated provider: No verified third-party POD provider adapter implemented. Fulfill orders manually via atelier workshop.');
  }

  async syncProductionStatus(providerOrderId) {
    return {
      success: false,
      providerOrderId,
      status: null,
      message: 'Status synchronization unavailable without an active provider integration.'
    };
  }

  async cancelProductionOrder(providerOrderId, reason) {
    return {
      success: false,
      providerOrderId,
      status: null,
      reason,
      message: 'Automated cancellation unavailable without active provider adapter.'
    };
  }
}

module.exports = {
  BasePODProviderAdapter,
  NullPODProviderAdapter,
  MockPODProviderAdapter: NullPODProviderAdapter
};
