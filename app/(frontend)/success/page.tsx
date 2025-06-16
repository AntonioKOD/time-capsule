'use client'

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Mail,
  CreditCard,
  Heart,
  Star,
  AlertCircle,
  Loader2
} from 'lucide-react';

/**
 * Success Page Content - Handles successful Stripe payments
 * Displays confirmation and capsule details after payment
 */
function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<{
    sessionId: string;
    paymentStatus: string;
    customerEmail: string;
    amountTotal: number;
    currency: string;
    contentType: string;
    deliveryDate: string;
    isPublic: boolean;
    recipientCount: number;
    capsuleId: string;
    created: number;
  } | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!sessionId) {
      setError('No payment session found');
      setIsLoading(false);
      return;
    }

    // Verify payment and get capsule details
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/stripe/verify?session_id=${sessionId}`);
        const result = await response.json();
        
        if (result.success) {
          setPaymentData(result.data);
        } else {
          setError(result.error || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setError('Failed to verify payment');
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto max-w-4xl px-6 py-12">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-amber-500 shadow-lg">
              <Loader2 className="h-12 w-12 text-white animate-spin" />
            </div>
            <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white font-handwritten">
              <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                Processing Your Payment...
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              Please wait while we confirm your payment and create your memory capsule.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto max-w-4xl px-6 py-12">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-500 shadow-lg">
              <AlertCircle className="h-12 w-12 text-white" />
            </div>
            <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white font-handwritten">
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Payment Error
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
              {error}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                size="lg"
                className="h-14 px-8 text-lg bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold rounded-full"
              >
                <Link href="/create">
                  Try Again
                </Link>
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                asChild
                className="h-14 px-8 text-lg border-2 border-rose-200 hover:bg-rose-50 dark:border-rose-700 dark:hover:bg-rose-800 font-medium rounded-full text-rose-700 hover:text-rose-800"
              >
                <Link href="/">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto max-w-4xl px-6 py-12">
        <div className="animate-fade-in text-center">
          <div className="mb-8">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg animate-pulse-gentle">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white font-handwritten">
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Payment Successful! ✨
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Your complete memory capsule has been created and will be delivered on{' '}
              <strong className="text-emerald-600">
                {paymentData?.deliveryDate && new Date(paymentData.deliveryDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </strong>
            </p>
          </div>
          
          <Card className="mb-8 border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl rounded-2xl border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-emerald-500" />
                    Payment Details
                  </h3>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <p><strong>Amount:</strong> $1.00 USD</p>
                    <p><strong>Session:</strong> {sessionId?.substring(0, 20)}...</p>
                    <p><strong>Status:</strong> <Badge className="bg-emerald-100 text-emerald-700">Paid</Badge></p>
                    <p><strong>Type:</strong> Complete Capsule</p>
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-500" />
                    Capsule Details
                  </h3>
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {paymentData?.capsuleId && <p><strong>ID:</strong> {paymentData.capsuleId}</p>}
                    {paymentData?.contentType && <p><strong>Type:</strong> {paymentData.contentType}</p>}
                    {paymentData?.recipientCount && <p><strong>Recipients:</strong> {paymentData.recipientCount}</p>}
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-amber-100 text-amber-700">Complete</Badge>
                      {paymentData?.isPublic && <Badge variant="secondary" className="bg-rose-100 text-rose-700">Public</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="mb-8 border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20">
            <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <AlertDescription className="text-emerald-700 dark:text-emerald-300">
                              <strong>Confirmation sent!</strong> We&apos;ve sent a payment receipt and capsule details to your email. 
                You&apos;ll receive another notification when your capsule is ready to open.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card className="border-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg rounded-2xl">
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Scheduled</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Your capsule is safely stored and scheduled for delivery
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg rounded-2xl">
              <CardContent className="p-6 text-center">
                <Star className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Complete Features</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Photos, voice messages, video messages, and multiple recipients included
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-rose-50 to-pink-50 dark:bg-slate-800/90 backdrop-blur-sm shadow-lg rounded-2xl">
              <CardContent className="p-6 text-center">
                <Heart className="h-8 w-8 text-rose-500 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Secure</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Your memory is encrypted and safely protected
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild
              size="lg"
              className="h-14 px-8 text-lg bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-semibold rounded-full animate-pulse-gentle"
            >
              <Link href="/create">
                <Sparkles className="mr-2 h-5 w-5" />
                Create Another Capsule
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              asChild
              className="h-14 px-8 text-lg border-2 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-800 font-medium rounded-full text-emerald-700 hover:text-emerald-800"
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading fallback component
 */
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto max-w-4xl px-6 py-12">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-amber-500 shadow-lg">
            <Loader2 className="h-12 w-12 text-white animate-spin" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white font-handwritten">
            <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
              Loading...
            </span>
          </h1>
        </div>
      </div>
    </div>
  );
}

/**
 * Success Page - Handles successful Stripe payments
 * Displays confirmation and capsule details after payment
 */
export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessPageContent />
    </Suspense>
  );
} 