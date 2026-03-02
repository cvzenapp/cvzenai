import type { PaymentInitiateRequest, PaymentInitiateResponse, PaymentVerifyRequest, PaymentVerifyResponse } from '@shared/payment';

/**
 * Abstract Payment Gateway Adapter
 * Implement this interface for each payment gateway
 */
export abstract class PaymentGatewayAdapter {
  abstract initiatePayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse>;
  abstract verifyPayment(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse>;
  abstract getGatewayName(): string;
}
