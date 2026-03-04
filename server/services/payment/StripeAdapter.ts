import Stripe from 'stripe';
import { PaymentGatewayAdapter } from './PaymentGatewayAdapter';
import type { PaymentInitiateRequest, PaymentInitiateResponse, PaymentVerifyRequest, PaymentVerifyResponse } from '@shared/payment';

/**
 * Stripe Payment Gateway Adapter
 */
export class StripeAdapter extends PaymentGatewayAdapter {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor() {
    super();
    const secretKey = process.env.STRIPE_SECRET_KEY;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16'
    });
  }

  getGatewayName(): string {
    return 'stripe';
  }

  async initiatePayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: request.currency.toLowerCase(),
            product_data: {
              name: request.planName,
              description: `Subscription to ${request.planName} plan`
            },
            unit_amount: request.amount // Stripe expects amount in smallest currency unit
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: `${process.env.APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/payment/cancel`,
        metadata: {
          transactionId: request.transactionId,
          planId: request.planId,
          userId: request.userId || '',
          companyId: request.companyId || '',
          ...request.metadata
        }
      });

      return {
        success: true,
        data: {
          paymentUrl: session.url!,
          transactionId: request.transactionId,
          gatewayTransactionId: session.id,
          gatewayResponse: session
        }
      };
    } catch (error: any) {
      console.error('Stripe payment initiation failed:', error);
      return {
        success: false,
        error: error.message || 'Payment initiation failed'
      };
    }
  }

  async verifyPayment(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(request.gatewayTransactionId);
      
      if (session.payment_status === 'paid') {
        return {
          success: true,
          data: {
            transactionId: request.transactionId,
            gatewayTransactionId: session.id,
            status: 'SUCCESS',
            amount: session.amount_total || 0,
            currency: session.currency?.toUpperCase() || 'USD',
            gatewayResponse: session
          }
        };
      } else {
        return {
          success: false,
          error: 'Payment not completed',
          data: {
            transactionId: request.transactionId,
            gatewayTransactionId: session.id,
            status: 'FAILED',
            amount: session.amount_total || 0,
            currency: session.currency?.toUpperCase() || 'USD',
            gatewayResponse: session
          }
        };
      }
    } catch (error: any) {
      console.error('Stripe payment verification failed:', error);
      return {
        success: false,
        error: error.message || 'Payment verification failed'
      };
    }
  }
}