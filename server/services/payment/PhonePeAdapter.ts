import crypto from 'crypto';
import axios from 'axios';
import { PaymentGatewayAdapter } from './PaymentGatewayAdapter';
import type { PaymentInitiateRequest, PaymentInitiateResponse, PaymentVerifyRequest, PaymentVerifyResponse } from '@shared/payment';

/**
 * PhonePe Payment Gateway Adapter
 * Implements PhonePe Web Integration Pay API
 * https://developer.phonepe.com/v1/reference/pay-api#pay-request-for-web-flow
 */
export class PhonePeAdapter extends PaymentGatewayAdapter {
  private merchantId: string;
  private saltKey: string;
  private saltIndex: string;
  private apiEndpoint: string;
  private redirectUrl: string;
  private callbackUrl: string;

  constructor() {
    super();
    this.merchantId = process.env.PHONEPE_MERCHANT_ID || '';
    this.saltKey = process.env.PHONEPE_SALT_KEY || '';
    this.saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
    this.apiEndpoint = process.env.PHONEPE_API_ENDPOINT || 'https://api-preprod.phonepe.com/apis/pg-sandbox';
    this.redirectUrl = process.env.PHONEPE_REDIRECT_URL || `${process.env.APP_URL}/payment/success`;
    this.callbackUrl = process.env.PHONEPE_CALLBACK_URL || `${process.env.APP_URL}/api/payment/callback`;
  }

  getGatewayName(): string {
    return 'phonepe';
  }

  /**
   * Initiate payment with PhonePe
   */
  async initiatePayment(request: PaymentInitiateRequest): Promise<PaymentInitiateResponse> {
    try {
      const merchantTransactionId = `TXN_${Date.now()}_${request.userId.substring(0, 8)}`;
      const merchantUserId = `USER_${request.userId.substring(0, 20)}`;

      // Prepare payment payload
      const paymentPayload = {
        merchantId: this.merchantId,
        merchantTransactionId,
        merchantUserId,
        amount: request.amount, // in paise
        redirectUrl: this.redirectUrl,
        redirectMode: 'POST',
        callbackUrl: this.callbackUrl,
        mobileNumber: request.userPhone || '',
        paymentInstrument: {
          type: 'PAY_PAGE'
        }
      };

      // Base64 encode the payload
      const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

      // Generate X-VERIFY checksum
      const checksumString = base64Payload + '/pg/v1/pay' + this.saltKey;
      const checksum = crypto.createHash('sha256').update(checksumString).digest('hex');
      const xVerify = `${checksum}###${this.saltIndex}`;

      // Make API request
      const response = await axios.post(
        `${this.apiEndpoint}/pg/v1/pay`,
        {
          request: base64Payload
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': xVerify
          }
        }
      );

      if (response.data.success && response.data.data?.instrumentResponse?.redirectInfo?.url) {
        return {
          success: true,
          transactionId: merchantTransactionId,
          orderId: merchantTransactionId,
          redirectUrl: response.data.data.instrumentResponse.redirectInfo.url,
          paymentData: response.data
        };
      }

      return {
        success: false,
        transactionId: merchantTransactionId,
        orderId: merchantTransactionId,
        error: response.data.message || 'Payment initiation failed'
      };

    } catch (error: any) {
      console.error('PhonePe payment initiation error:', error.response?.data || error.message);
      return {
        success: false,
        transactionId: '',
        orderId: '',
        error: error.response?.data?.message || error.message || 'Payment initiation failed'
      };
    }
  }

  /**
   * Verify payment status with PhonePe
   */
  async verifyPayment(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    try {
      const merchantTransactionId = request.transactionId;

      // Generate X-VERIFY checksum for status check
      const checksumString = `/pg/v1/status/${this.merchantId}/${merchantTransactionId}` + this.saltKey;
      const checksum = crypto.createHash('sha256').update(checksumString).digest('hex');
      const xVerify = `${checksum}###${this.saltIndex}`;

      // Check payment status
      const response = await axios.get(
        `${this.apiEndpoint}/pg/v1/status/${this.merchantId}/${merchantTransactionId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-VERIFY': xVerify,
            'X-MERCHANT-ID': this.merchantId
          }
        }
      );

      const paymentData = response.data;
      const isSuccess = paymentData.success && paymentData.code === 'PAYMENT_SUCCESS';

      return {
        success: true,
        verified: isSuccess,
        transactionId: merchantTransactionId,
        orderId: request.orderId,
        amount: paymentData.data?.amount || 0,
        status: isSuccess ? 'success' : paymentData.code === 'PAYMENT_PENDING' ? 'pending' : 'failed'
      };

    } catch (error: any) {
      console.error('PhonePe payment verification error:', error.response?.data || error.message);
      return {
        success: false,
        verified: false,
        transactionId: request.transactionId,
        orderId: request.orderId,
        amount: 0,
        status: 'failed',
        error: error.response?.data?.message || error.message || 'Payment verification failed'
      };
    }
  }

  /**
   * Verify callback signature from PhonePe
   */
  verifyCallbackSignature(xVerify: string, responseBase64: string): boolean {
    try {
      const [receivedChecksum] = xVerify.split('###');
      const expectedChecksum = crypto
        .createHash('sha256')
        .update(responseBase64 + this.saltKey)
        .digest('hex');
      
      return receivedChecksum === expectedChecksum;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }
}
