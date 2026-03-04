import type { PaymentGateway } from '@shared/payment';
import { PaymentGatewayAdapter } from './PaymentGatewayAdapter';
import { PhonePeAdapter } from './PhonePeAdapter';
import { StripeAdapter } from './StripeAdapter';
import { RazorpayAdapter } from './RazorpayAdapter';

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
        return new RazorpayAdapter();
      
      case 'stripe':
        return new StripeAdapter();
      
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

  /**
   * Get available gateways
   */
  static getAvailableGateways(): PaymentGateway[] {
    return ['phonepe', 'razorpay', 'stripe'];
  }
}
