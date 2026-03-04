import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PaymentGatewayAdapter } from './PaymentGatewayAdapter';
import type { PaymentInitiateRequest, PaymentInitiateResponse, PaymentVerifyRequest, PaymentVerifyResponse } from '@shared/payment';

/**
 * Razorpay Payment Gateway Adapter
 */
export class RazorpayAdapter extends PaymentGatewayAdapter {
  private razorpay: Razorpay;
  private keySecret: string;

  constructor() {
    super();
    const keyId = process.env.RAZORPAY_KEY_ID;
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || '';
    
    if (!keyId || !this.keySecret) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required');
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: this.keySecret
    });
  }

  getGatewayName(): string {
    return 'razorpay';
  }

  async initiatePayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    try {
      const order = await this.razorpay.orders.create({
        amount: request.amount, // Amount in paise
        currency: request.currency,
        receipt: request.transactionId,
        notes: {
          planId: request.planId,
          userId: request.userId || '',
          companyId: request.companyId || '',
          ...request.metadata
        }
      });

      // For Razorpay, we need to return checkout options for frontend
      const checkoutOptions = {
        key: process.env.RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'CVZen',
        description: `Subscription to ${request.planName} plan`,
        order_id: order.id,
        callback_url: `${process.env.APP_URL}/api/payment/callback`,
        prefill: {
          name: request.metadata?.userName || '',
          email: request.metadata?.userEmail || ''
        },
        theme: {
          color: '#3B82F6'
        }
      };

      return {
        success: true,
        data: {
          paymentUrl: `${process.env.APP_URL}/payment/razorpay?options=${encodeURIComponent(JSON.stringify(checkoutOptions))}`,
          transactionId: request.transactionId,
          gatewayTransactionId: order.id,
          gatewayResponse: order,
          checkoutOptions
        }
      };
    } catch (error: any) {
      console.error('Razorpay payment initiation failed:', error);
      return {
        success: false,
        error: error.message || 'Payment initiation failed'
      };
    }
  }

  async verifyPayment(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = request.gatewayResponse || {};
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return {
          success: false,
          error: 'Missing required payment parameters'
        };
      }

      // Verify signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return {
          success: false,
          error: 'Invalid payment signature',
          data: {
            transactionId: request.transactionId,
            gatewayTransactionId: razorpay_order_id,
            status: 'FAILED',
            amount: 0,
            currency: 'INR'
          }
        };
      }

      // Fetch payment details
      const payment = await this.razorpay.payments.fetch(razorpay_payment_id);
      
      if (payment.status === 'captured') {
        return {
          success: true,
          data: {
            transactionId: request.transactionId,
            gatewayTransactionId: razorpay_order_id,
            status: 'SUCCESS',
            amount: payment.amount,
            currency: payment.currency.toUpperCase(),
            gatewayResponse: payment
          }
        };
      } else {
        return {
          success: false,
          error: 'Payment not captured',
          data: {
            transactionId: request.transactionId,
            gatewayTransactionId: razorpay_order_id,
            status: 'FAILED',
            amount: payment.amount,
            currency: payment.currency.toUpperCase(),
            gatewayResponse: payment
          }
        };
      }
    } catch (error: any) {
      console.error('Razorpay payment verification failed:', error);
      return {
        success: false,
        error: error.message || 'Payment verification failed'
      };
    }
  }
}