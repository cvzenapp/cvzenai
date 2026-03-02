import type { PaymentGateway } from '@shared/payment';
import { PaymentGatewayAdapter } from './PaymentGatewayAdapter';
import { PhonePeAdapter } from './PhonePeAdapter';

/**
 * Payment Gateway Factory
 * Returns the appropriate payment gateway adapter based on configuration
 */
export class PaymentGatewayFactory {
  private static defaultGateway: PaymentGateway = (process.env.PAYMENT_GATEWAY as PaymentGateway) || 'phonepe';

  /**
   * Get payment gateway adapter
   */
  static getGateway(gateway?: PaymentGateway): PaymentGatewayAdapter {
    const selectedGateway = gateway || this.defaultGateway;

    switch (selectedGateway) {
      case 'phonepe':
        return new PhonePeAdapter();
      
      case 'razorpay':
        // TODO: Implement RazorpayAdapter
        throw new Error('Razorpay gateway not implemented yet');
      
      case 'stripe':
        // TODO: Implement StripeAdapter
        throw new Error('Stripe gateway not implemented yet');
      
      default:
        throw new Error(`Unsupported payment gateway: ${selectedGateway}`);
    }
  }

  /**
   * Get default gateway name
   */
  static getDefaultGateway(): PaymentGateway {
    return this.defaultGateway;
  }

  /**
   * Set default gateway
   */
  static setDefaultGateway(gateway: PaymentGateway): void {
    this.defaultGateway = gateway;
  }
}
