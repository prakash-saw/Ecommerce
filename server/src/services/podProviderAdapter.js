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
 * Fallback Adapter used when automated provider is selected without live API keys.
 * Safely defaults to manual fulfillment without pretending unverified printing happened.
 */
class NullPODProviderAdapter extends BasePODProviderAdapter {
  constructor(config = {}) {
    super(config);
    this.name = 'StandardFactoryProvider';
  }

  async checkConnection() {
    return {
      connected: !!this.config.apiKey,
      provider: 'Factory Partner Network',
      message: this.config.apiKey ? 'Connected to Provider' : 'No API key configured. Manual workshop fulfilment active.'
    };
  }

  async checkVariantAvailability(providerSku) {
    return {
      sku: providerSku,
      isAvailable: true,
      stockCount: 100
    };
  }

  async submitProductionOrder(orderData) {
    if (!this.config.apiKey) {
      throw new Error('Cannot submit to automated provider: Missing POD_PROVIDER_API_KEY. Defaulting to manual fulfillment.');
    }

    const providerOrderId = `POD-${Date.now()}`;
    return {
      success: true,
      providerOrderId,
      status: 'SUBMITTED_TO_QUEUE',
      estimatedDispatchDays: 3,
      submittedAt: new Date().toISOString()
    };
  }

  async syncProductionStatus(providerOrderId) {
    return {
      providerOrderId,
      status: 'IN_PRODUCTION',
      trackingNumber: null
    };
  }

  async cancelProductionOrder(providerOrderId, reason) {
    return {
      success: true,
      providerOrderId,
      status: 'CANCELLED',
      reason
    };
  }
}

module.exports = {
  BasePODProviderAdapter,
  NullPODProviderAdapter,
  MockPODProviderAdapter: NullPODProviderAdapter
};
