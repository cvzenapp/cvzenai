import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  FileText, 
  Calendar, 
  AlertCircle, 
  Download,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { paymentHistoryApi } from '@/services/paymentHistoryApi';
import { subscriptionApi } from '@/services/subscriptionApi';
import type { PaymentHistory, Invoice, PaymentSummary, SubscriptionWithDetails } from '@shared/payment';
import type { UserSubscription } from '@shared/subscription';

interface JobSeekerSubscriptionDashboardProps {
  userId: string;
  subscription: UserSubscription;
}

export function JobSeekerSubscriptionDashboard({ 
  userId, 
  subscription 
}: JobSeekerSubscriptionDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionWithDetails | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadData();
  }, [userId, subscription.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [payments, invoicesList, summary, details] = await Promise.all([
        paymentHistoryApi.getUserPaymentHistory(userId),
        paymentHistoryApi.getUserInvoices(userId),
        paymentHistoryApi.getPaymentSummary(subscription.id),
        paymentHistoryApi.getSubscriptionDetails(subscription.id)
      ]);

      setPaymentHistory(payments);
      setInvoices(invoicesList);
      setPaymentSummary(summary);
      setSubscriptionDetails(details);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount / 100);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Unknown
        </Badge>
      );
    }

    const variants: Record<string, { variant: any; icon: any; color?: string }> = {
      active: { variant: 'default', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700' },
      success: { variant: 'default', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700' },
      cancelled: { variant: 'destructive', icon: XCircle },
      expired: { variant: 'secondary', icon: Clock },
      completed: { variant: 'default', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700' },
      paid: { variant: 'default', icon: CheckCircle, color: 'bg-green-600 hover:bg-green-700' },
      pending: { variant: 'secondary', icon: Clock, color: 'bg-yellow-500 hover:bg-yellow-600' },
      failed: { variant: 'destructive', icon: XCircle }
    };

    const config = variants[status.toLowerCase()] || { variant: 'secondary', icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge 
        variant={config.variant as any} 
        className={`flex items-center gap-1 ${config.color || ''}`}
      >
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const blob = await paymentHistoryApi.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading invoice:', error);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancelling(true);
      await subscriptionApi.cancelUserSubscription(userId);
      await loadData();
      setCancelDialogOpen(false);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1891db]">
              {subscription.plan?.displayName}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {subscription.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} billing
            </p>
            <div className="mt-2">
              {getStatusBadge(subscription.status)}
            </div>
            {subscription.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel Subscription
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Billing Cycle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Started</span>
                <span className="font-medium">{formatDate(subscription.currentPeriodStart)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {subscription.status === 'cancelled' ? 'Expires On' : 'Renews On'}
                </span>
                <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
              </div>
              {subscription.createdAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subscribed</span>
                  <span className="font-medium">{formatDate(subscription.createdAt)}</span>
                </div>
              )}
              {subscriptionDetails?.isExpiringSoon && (
                <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Expires in {subscriptionDetails.daysUntilExpiry} days</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Total Paid</span>
                <span className="font-medium">
                  {paymentSummary ? formatCurrency(paymentSummary.totalPaid, paymentSummary.currency) : '₹0'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Payments</span>
                <span className="font-medium">{paymentSummary?.paymentCount || 0}</span>
              </div>
              {paymentSummary?.lastPaymentDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Last Payment</span>
                  <span className="font-medium">{formatDate(paymentSummary.lastPaymentDate)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancelled Subscription Warning */}
      {subscription.status === 'cancelled' && subscription.cancelledAt && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900">Subscription Cancelled</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Your subscription was cancelled on {formatDate(subscription.cancelledAt)}.
                  You can continue using the service until {formatDate(subscription.currentPeriodEnd)}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for Payment History and Invoices */}
      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payment History
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                View all your payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No payment history available
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-[#cfe2f3]/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          payment.paymentStatus === 'paid' || payment.paymentStatus === 'completed' || payment.paymentStatus === 'success'
                            ? 'bg-green-600'
                            : payment.paymentStatus === 'failed'
                            ? 'bg-red-600'
                            : 'bg-[#1891db]'
                        }`}>
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {formatCurrency(payment.amount, payment.currency)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.paymentDate ? formatDate(payment.paymentDate) : 'Pending'}
                          </div>
                          {payment.paymentMethod && (
                            <div className="text-xs text-gray-400 mt-1">
                              via {payment.paymentMethod}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(payment.paymentStatus)}
                        {payment.transactionId && (
                          <span className="text-xs text-gray-400">
                            {payment.transactionId.slice(0, 12)}...
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>
                Download and view your invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No invoices available
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-[#cfe2f3]/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-[#0a0a37] rounded-lg">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-gray-500">
                            Issued: {formatDate(invoice.issueDate)}
                          </div>
                          {invoice.paidDate && (
                            <div className="text-xs text-gray-400 mt-1">
                              Paid: {formatDate(invoice.paidDate)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(invoice.totalAmount, invoice.currency)}
                          </div>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period ({formatDate(subscription.currentPeriodEnd)}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
