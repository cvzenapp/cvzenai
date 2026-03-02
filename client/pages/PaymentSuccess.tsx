import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { paymentApi } from '@/services/paymentApi';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const transactionId = searchParams.get('transactionId');
    
    if (!transactionId) {
      setError('Transaction ID not found');
      setVerifying(false);
      return;
    }

    try {
      const result = await paymentApi.verifyPayment(transactionId);
      
      if (result.verified && result.status === 'success') {
        setVerified(true);
      } else {
        setError('Payment verification failed');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setError('Failed to verify payment');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <AppHeader />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          {verifying ? (
            <>
              <Loader2 className="h-16 w-16 text-brand-main animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-normal text-brand-background mb-2">
                Verifying Payment
              </h1>
              <p className="text-slate-600">
                Please wait while we confirm your payment...
              </p>
            </>
          ) : verified ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-normal text-brand-background mb-2">
                Payment Successful!
              </h1>
              <p className="text-slate-600 mb-6">
                Your subscription has been activated successfully.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-brand-main hover:bg-blue-700"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => navigate('/pricing')}
                  variant="outline"
                  className="w-full"
                >
                  View Plans
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-3xl">✕</span>
              </div>
              <h1 className="text-2xl font-normal text-brand-background mb-2">
                Verification Failed
              </h1>
              <p className="text-slate-600 mb-6">
                {error || 'Unable to verify your payment'}
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/pricing')}
                  className="w-full bg-brand-main hover:bg-blue-700"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => navigate('/contact')}
                  variant="outline"
                  className="w-full"
                >
                  Contact Support
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
