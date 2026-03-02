import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppHeader from '@/components/AppHeader';
import Footer from '@/components/Footer';

export default function PaymentFailure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get('error') || 'Payment was not completed';

  return (
    <div className="min-h-screen bg-brand-background flex flex-col">
      <AppHeader />
      
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          
          <h1 className="text-2xl font-normal text-brand-background mb-2">
            Payment Failed
          </h1>
          
          <p className="text-slate-600 mb-6">
            {errorMessage}
          </p>
          
          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-slate-700 mb-2">
              What happened?
            </h3>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Payment was cancelled or declined</li>
              <li>• Insufficient funds or payment limit exceeded</li>
              <li>• Network or technical issue occurred</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={() => navigate('/pricing')}
              className="w-full bg-brand-main hover:bg-blue-700"
            >
              Try Again
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() => navigate('/contact')}
              variant="ghost"
              className="w-full text-slate-600"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
