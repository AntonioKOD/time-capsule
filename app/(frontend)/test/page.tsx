'use client'

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  FileText, 
  Camera, 
  Mic, 
  Mail, 
  Lock, 
  Globe, 
  Send, 
  Eye,
  Sparkles,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  TestTube,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Video,
  Bell,
  MessageSquare
} from 'lucide-react';

interface TestCapsuleData {
  id: string;
  uniqueLink: string;
  contentType: string;
  textContent?: string;
  deliveryDate: string;
  status: string;
  createdAt: string;
  isTestMode?: boolean;
}

interface CapsuleContent {
  id: string;
  contentType: string;
  textContent?: string;
  media?: any;
  deliveryDate: string;
  createdAt: string;
  isPublic: boolean;
}

/**
 * Capsule System Test Page
 * Demonstrates creation, storage, scheduling, and opening of memory capsules
 */
export default function CapsuleTestPage() {
  // Test capsule creation state
  const [createForm, setCreateForm] = useState({
    contentType: 'text',
    textContent: '',
    deliveryDate: '',
    recipients: [''],
    password: '',
    isPublic: false,
    testMode: true, // For immediate testing
    userEmail: 'test@example.com', // For email testing
  });

  // Test capsule opening state
  const [openForm, setOpenForm] = useState({
    uniqueLink: '',
    password: '',
  });

  // State management
  const [isCreating, setIsCreating] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [createdCapsules, setCreatedCapsules] = useState<TestCapsuleData[]>([]);
  const [openedCapsule, setOpenedCapsule] = useState<CapsuleContent | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [emailSchedulerStatus, setEmailSchedulerStatus] = useState<any>(null);
  const [isProcessingEmails, setIsProcessingEmails] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isTestingSMS, setIsTestingSMS] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('+1234567890');

  // Calculate test dates
  const now = new Date();
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
  const oneHourFromNow = new Date();
  oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  /**
   * Convert Date to datetime-local input format
   */
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  /**
   * Test Capsule Creation
   */
  const handleCreateTestCapsule = async () => {
    setIsCreating(true);
    setErrors({});
    setMessages({});

    try {
      const formData = new FormData();
      formData.append('contentType', createForm.contentType);
      formData.append('textContent', createForm.textContent);
      // Convert datetime-local format to ISO string for the API
      const deliveryDateISO = createForm.deliveryDate ? new Date(createForm.deliveryDate).toISOString() : '';
      formData.append('deliveryDate', deliveryDateISO);
      formData.append('recipients', createForm.recipients.filter(email => email.trim()).join(','));
      formData.append('password', createForm.password);
      formData.append('isPublic', createForm.isPublic.toString());
      formData.append('isPaid', 'false'); // Test mode is free
      formData.append('testMode', 'true'); // Enable test mode for flexible dates
      formData.append('userEmail', createForm.userEmail || 'test@example.com'); // Test email

      const response = await fetch('/api/capsules', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const newCapsule: TestCapsuleData = {
          id: result.data.capsuleId,
          uniqueLink: result.data.uniqueLink,
          contentType: createForm.contentType,
          textContent: createForm.textContent,
          deliveryDate: deliveryDateISO,
          status: 'scheduled',
          createdAt: new Date().toISOString(),
          isTestMode: true,
        };

        setCreatedCapsules(prev => [newCapsule, ...prev]);
        const isImmediate = new Date(deliveryDateISO) <= new Date();
        setMessages({ 
          create: `✅ Test capsule created! Unique link: ${result.data.uniqueLink}${isImmediate ? ' - Ready to open immediately!' : ''}` 
        });
        
        // Auto-fill the open form for easy testing
        setOpenForm({
          uniqueLink: result.data.uniqueLink,
          password: createForm.password,
        });
      } else {
        setErrors({ create: result.error });
      }
    } catch (error) {
      setErrors({ create: 'Failed to create test capsule' });
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Test Capsule Opening
   */
  const handleOpenTestCapsule = async () => {
    setIsOpening(true);
    setErrors({});
    setMessages({});

    try {
      const params = new URLSearchParams({
        link: openForm.uniqueLink,
      });

      if (openForm.password) {
        params.append('password', openForm.password);
      }

      const response = await fetch(`/api/capsules?${params}`);
      const result = await response.json();

      if (result.success) {
        setOpenedCapsule(result.data);
        setMessages({ open: '✅ Capsule opened successfully!' });
      } else {
        setErrors({ open: result.error });
        setOpenedCapsule(null);
      }
    } catch (error) {
      setErrors({ open: 'Failed to open capsule' });
      setOpenedCapsule(null);
    } finally {
      setIsOpening(false);
    }
  };

  /**
   * Email Scheduler Testing
   */
  const handleTriggerEmailScheduler = async (action: 'process' | 'retry' | 'notifications' = 'process') => {
    setIsProcessingEmails(true);
    try {
      const response = await fetch('/api/email-scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();
      
      if (result.success) {
        const actionText = action === 'process' ? 'Processed' : action === 'retry' ? 'Retried' : 'Sent notifications for';
        setMessages({ 
          scheduler: `✅ ${actionText} ${result.data.processed} capsules. ${result.data.succeeded} succeeded, ${result.data.failed.length} failed.` 
        });
      } else {
        setErrors({ scheduler: result.error });
      }
    } catch (error) {
      setErrors({ scheduler: 'Failed to trigger email scheduler' });
    } finally {
      setIsProcessingEmails(false);
    }
  };

  const handleGetEmailStats = async () => {
    try {
      const response = await fetch('/api/email-scheduler');
      const result = await response.json();
      
      if (result.success) {
        setEmailSchedulerStatus(result.data);
      }
    } catch (error) {
      console.error('Failed to get email stats:', error);
    }
  };

  /**
   * Test Resend Email Configuration
   */
  const handleTestResendEmail = async () => {
    setIsTestingEmail(true);
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: createForm.userEmail || 'antonio_kodheli@icloud.com' }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessages({ 
          email: `✅ Test email sent successfully to ${result.recipient}! Check your inbox.` 
        });
      } else {
        setErrors({ email: `❌ Test email failed: ${result.error}` });
      }
    } catch (error) {
      setErrors({ email: 'Failed to send test email' });
    } finally {
      setIsTestingEmail(false);
    }
  };

  /**
   * Test SMS Configuration
   */
  const handleTestSMS = async () => {
    setIsTestingSMS(true);
    try {
      const response = await fetch('/api/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: testPhoneNumber }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessages({ 
          sms: `✅ Test SMS sent successfully to ${result.phoneNumber}! Message ID: ${result.messageId}` 
        });
      } else {
        setErrors({ sms: `❌ Test SMS failed: ${result.error}` });
      }
    } catch (error) {
      setErrors({ sms: 'Failed to send test SMS' });
    } finally {
      setIsTestingSMS(false);
    }
  };

  /**
   * Test SMS Configuration (GET)
   */
  const handleTestSMSConfig = async () => {
    setIsTestingSMS(true);
    try {
      const response = await fetch('/api/test-sms');
      const result = await response.json();
      
      if (result.success) {
        setMessages({ 
          sms: `✅ SMS configuration test passed! ${result.details}` 
        });
      } else {
        setErrors({ sms: `❌ SMS configuration test failed: ${result.error}` });
      }
    } catch (error) {
      setErrors({ sms: 'Failed to test SMS configuration' });
    } finally {
      setIsTestingSMS(false);
    }
  };

  /**
   * Quick Test Buttons
   */
  const generateQuickTest = (type: 'immediate' | 'scheduled' | 'password' | 'today') => {
    const baseDate = new Date();
    
    const testData = {
      immediate: {
        textContent: "This is a test capsule that should open immediately! 🎉 Testing the time capsule system.",
        deliveryDate: formatDateForInput(new Date(baseDate.getTime() - 60000)), // 1 minute ago
        password: '',
        isPublic: false,
      },
      today: {
        textContent: "This capsule is scheduled for today and will test email delivery! 📧 Check your inbox when it's delivered.",
        deliveryDate: formatDateForInput(endOfToday), // End of today
        password: '',
        isPublic: false,
      },
      scheduled: {
        textContent: "This capsule is scheduled for the future. It contains hopes and dreams from the past! ⏰",
        deliveryDate: formatDateForInput(oneHourFromNow),
        password: '',
        isPublic: true,
      },
      password: {
        textContent: "This is a secret capsule protected by password. The password is 'secret123' 🔒",
        deliveryDate: formatDateForInput(new Date(baseDate.getTime() - 60000)), // 1 minute ago
        password: 'secret123',
        isPublic: false,
      }
    };

    setCreateForm(prev => ({
      ...prev,
      ...testData[type],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto max-w-6xl px-6 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <TestTube className="h-10 w-10 text-violet-600" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Capsule System Test</h1>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl mx-auto">
            Test the complete memory capsule lifecycle: creation, storage, scheduling, and opening.
            This page demonstrates how the time capsule system works behind the scenes.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Capsule Creation Test */}
          <Card className="border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl text-slate-900 dark:text-white">
                <Sparkles className="h-6 w-6 text-violet-600" />
                Test Capsule Creation
                <Badge className="bg-orange-500 text-white text-xs">TEST MODE</Badge>
              </CardTitle>
              <p className="text-slate-600 dark:text-slate-300">
                Create test capsules to understand the storage and scheduling system
                <br />
                <span className="text-xs text-orange-600 font-medium">⚡ Test mode allows immediate and past delivery dates</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Test Buttons */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Quick Test Scenarios:</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateQuickTest('immediate')}
                    className="text-green-700 border-green-200 hover:bg-green-50"
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Immediate Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateQuickTest('today')}
                    className="text-violet-700 border-violet-200 hover:bg-violet-50"
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Today + Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateQuickTest('scheduled')}
                    className="text-blue-700 border-blue-200 hover:bg-blue-50"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Scheduled (1hr)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateQuickTest('password')}
                    className="text-amber-700 border-amber-200 hover:bg-amber-50"
                  >
                    <Lock className="h-4 w-4 mr-1" />
                    Password Protected
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Content Type */}
              <div className="space-y-3">
                <Label>Content Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'text', icon: FileText, label: 'Text' },
                    { value: 'photo', icon: Camera, label: 'Photo' },
                    { value: 'voice', icon: Mic, label: 'Voice' },
                    { value: 'video', icon: Video, label: 'Video' },
                  ].map(({ value, icon: Icon, label }) => (
                    <button
                      key={value}
                      onClick={() => setCreateForm(prev => ({ ...prev, contentType: value }))}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                        createForm.contentType === value
                          ? 'border-violet-300 bg-violet-50 text-violet-700'
                          : 'border-slate-200 hover:border-violet-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Content */}
              <div className="space-y-2">
                <Label htmlFor="testTextContent">Message Content</Label>
                <Textarea
                  id="testTextContent"
                  placeholder="Enter your test message here..."
                  value={createForm.textContent}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, textContent: e.target.value }))}
                  className="min-h-24"
                />
              </div>

              {/* Delivery Date */}
              <div className="space-y-2">
                <Label htmlFor="testDeliveryDate">Delivery Date & Time</Label>
                <Input
                  id="testDeliveryDate"
                  type="datetime-local"
                  value={createForm.deliveryDate}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                />
                <p className="text-xs text-slate-500">
                  💡 Past date = immediate testing, Future date = scheduled testing
                </p>
                {createForm.deliveryDate && (
                  <p className="text-xs text-violet-600">
                    Selected: {new Date(createForm.deliveryDate).toLocaleString()} 
                    {new Date(createForm.deliveryDate) <= new Date() ? ' (⚡ Immediate)' : ' (⏰ Scheduled)'}
                  </p>
                )}
              </div>

              {/* Email for Testing */}
              <div className="space-y-2">
                <Label htmlFor="testUserEmail">Email Address (for testing email delivery)</Label>
                <Input
                  id="testUserEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  value={createForm.userEmail}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, userEmail: e.target.value }))}
                />
                <p className="text-xs text-violet-600">
                  📧 Enter your email to test capsule creation and delivery emails
                </p>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="testPassword">Password (Optional)</Label>
                <Input
                  id="testPassword"
                  type="password"
                  placeholder="Leave blank for no password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>

              {/* Create Button */}
              <Button
                onClick={handleCreateTestCapsule}
                disabled={isCreating || !createForm.textContent || !createForm.deliveryDate}
                className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                {isCreating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating Test Capsule...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Create Test Capsule
                  </>
                )}
              </Button>

              {/* Messages */}
              {messages.create && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{messages.create}</AlertDescription>
                </Alert>
              )}

              {errors.create && (
                <Alert className="border-red-200 bg-red-50 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.create}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Capsule Opening Test */}
          <Card className="border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl text-slate-900 dark:text-white">
                <Eye className="h-6 w-6 text-amber-600" />
                Test Capsule Opening
              </CardTitle>
              <p className="text-slate-600 dark:text-slate-300">
                Test opening capsules with unique links and password verification
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Unique Link */}
              <div className="space-y-2">
                <Label htmlFor="uniqueLink">Unique Link / ID</Label>
                <Input
                  id="uniqueLink"
                  placeholder="Enter capsule unique link"
                  value={openForm.uniqueLink}
                  onChange={(e) => setOpenForm(prev => ({ ...prev, uniqueLink: e.target.value }))}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="openPassword">Password (if required)</Label>
                <Input
                  id="openPassword"
                  type="password"
                  placeholder="Enter password if capsule is protected"
                  value={openForm.password}
                  onChange={(e) => setOpenForm(prev => ({ ...prev, password: e.target.value }))}
                />
              </div>

              {/* Open Button */}
              <Button
                onClick={handleOpenTestCapsule}
                disabled={isOpening || !openForm.uniqueLink}
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                {isOpening ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Opening Capsule...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Open Capsule
                  </>
                )}
              </Button>

              {/* Messages */}
              {messages.open && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{messages.open}</AlertDescription>
                </Alert>
              )}

              {errors.open && (
                <Alert className="border-red-200 bg-red-50 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.open}</AlertDescription>
                </Alert>
              )}

              {/* Opened Capsule Content */}
              {openedCapsule && (
                <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-green-600" />
                      Opened Capsule Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{openedCapsule.contentType}</Badge>
                      {openedCapsule.isPublic && <Badge className="bg-blue-500 text-white">Public</Badge>}
                    </div>
                    
                    {openedCapsule.textContent && (
                      <div className="p-4 bg-white dark:bg-slate-800 rounded-lg">
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                          {openedCapsule.textContent}
                        </p>
                      </div>
                    )}
                    
                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                      <p><strong>Created:</strong> {new Date(openedCapsule.createdAt).toLocaleString()}</p>
                      <p><strong>Delivery:</strong> {new Date(openedCapsule.deliveryDate).toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Email Scheduler Testing */}
        <Card className="mt-8 border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl text-slate-900 dark:text-white">
              <Mail className="h-6 w-6 text-violet-600" />
              Email Scheduler Testing
            </CardTitle>
            <p className="text-slate-600 dark:text-slate-300">
              Test the automated email delivery system powered by Resend
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Stats and Test */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleGetEmailStats}
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Email Stats
              </Button>
              <Button
                onClick={handleTestResendEmail}
                disabled={isTestingEmail}
                variant="outline"
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                {isTestingEmail ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Test Resend
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => handleTriggerEmailScheduler('process')}
                disabled={isProcessingEmails}
                className="bg-violet-500 hover:bg-violet-600"
              >
                {isProcessingEmails ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Process Deliveries
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleTriggerEmailScheduler('retry')}
                disabled={isProcessingEmails}
                variant="outline"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Retry Failed
              </Button>
              <Button
                onClick={() => handleTriggerEmailScheduler('notifications')}
                disabled={isProcessingEmails}
                variant="outline"
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <Bell className="h-4 w-4 mr-2" />
                Send Notifications
              </Button>
            </div>

            {/* Email Test Messages */}
            {messages.email && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{messages.email}</AlertDescription>
              </Alert>
            )}

            {errors.email && (
              <Alert className="border-red-200 bg-red-50 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.email}</AlertDescription>
              </Alert>
            )}

            {/* Email Scheduler Messages */}
            {messages.scheduler && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{messages.scheduler}</AlertDescription>
              </Alert>
            )}

            {errors.scheduler && (
              <Alert className="border-red-200 bg-red-50 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.scheduler}</AlertDescription>
              </Alert>
            )}

            {/* Email Stats Display */}
            {emailSchedulerStatus && (
              <Card className="bg-slate-50 dark:bg-slate-700/50">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">{emailSchedulerStatus.scheduled}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Scheduled</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{emailSchedulerStatus.delivered}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Delivered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{emailSchedulerStatus.failed}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{emailSchedulerStatus.overdue}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Overdue</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
              <p><strong>Testing Instructions:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Create a "Today + Email" capsule with your email address</li>
                <li>Use "Process Deliveries" to manually trigger the email scheduler</li>
                <li>Use "Send Notifications" to test pre-opening alerts (1hr, 30min, 10min before)</li>
                <li>Check your inbox for capsule creation, notification, and delivery emails</li>
                <li>View stats to monitor system performance</li>
              </ul>
              <p><strong>Pre-Opening Notifications:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>🔔 1 hour before opening - Initial reminder</li>
                <li>⚡ 30 minutes before opening - Get ready alert</li>
                <li>🚨 10 minutes before opening - Final countdown</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* SMS Testing */}
        <Card className="mt-8 border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-2xl text-slate-900 dark:text-white">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              SMS Testing
            </CardTitle>
            <p className="text-slate-600 dark:text-slate-300">
              Test the SMS notification system powered by Twilio
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Phone Number Input */}
            <div className="flex items-center gap-4">
              <Input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleTestSMS}
                disabled={isTestingSMS}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isTestingSMS ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    Testing...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Test SMS
                  </>
                )}
              </Button>
            </div>

            {/* SMS Configuration Test */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleTestSMSConfig}
                disabled={isTestingSMS}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                {isTestingSMS ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test SMS Config
                  </>
                )}
              </Button>
            </div>

            {/* SMS Test Messages */}
            {messages.sms && (
              <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{messages.sms}</AlertDescription>
              </Alert>
            )}

            {errors.sms && (
              <Alert className="border-red-200 bg-red-50 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.sms}</AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
              <p><strong>SMS Testing Instructions:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Enter your phone number in international format (+1 for US/Canada)</li>
                <li>Use "Test SMS Config" to verify Twilio configuration</li>
                <li>Use "Send Test SMS" to send a test message to your phone</li>
                <li>Check your phone for the test message</li>
                <li>SMS notifications are sent when capsules are created and delivered</li>
              </ul>
              <p><strong>Supported Formats:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>📱 +1 (555) 123-4567 - US/Canada format</li>
                <li>🌍 +44 20 7946 0958 - International format</li>
                <li>🔢 +1234567890 - Simple international format</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Created Capsules List */}
        {createdCapsules.length > 0 && (
          <Card className="mt-8 border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl text-slate-900 dark:text-white">
                <Users className="h-6 w-6 text-blue-600" />
                Test Capsules Created ({createdCapsules.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {createdCapsules.map((capsule, index) => (
                  <div key={capsule.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{capsule.contentType}</Badge>
                        <Badge className={
                          new Date(capsule.deliveryDate) <= new Date() 
                            ? "bg-green-500 text-white" 
                            : "bg-amber-500 text-white"
                        }>
                          {new Date(capsule.deliveryDate) <= new Date() ? 'Ready' : 'Scheduled'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <strong>Link:</strong> {capsule.uniqueLink}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <strong>Delivery:</strong> {new Date(capsule.deliveryDate).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenForm({ uniqueLink: capsule.uniqueLink, password: '' })}
                    >
                      Test Open
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Info */}
        <Card className="mt-8 border-0 bg-slate-100/90 dark:bg-slate-700/90 backdrop-blur-sm shadow-xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg text-slate-700 dark:text-slate-300">System Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p><strong>API Endpoints:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code>POST /api/capsules</code> - Create new capsule</li>
              <li><code>GET /api/capsules?link=...&password=...</code> - Open existing capsule</li>
              <li><code>GET /api/email-scheduler</code> - Get email delivery statistics</li>
              <li><code>POST /api/email-scheduler</code> - Trigger email processing (process/retry/notifications)</li>
              <li><code>POST /api/email-scheduler/notifications</code> - Process pre-opening notifications</li>
            </ul>
            <p><strong>Testing Notes:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Set delivery date in the past for immediate testing</li>
              <li>Use "Today + Email" for capsules that will be delivered today via email</li>
              <li>Password protection is optional but recommended for sensitive content</li>
              <li>Public capsules appear in the gallery (text-only)</li>
              <li>Each capsule gets a unique UUID for access control</li>
              <li>Email system powered by Resend with beautiful HTML templates</li>
              <li>Pre-opening notifications sent at 1hr, 30min, and 10min intervals before opening</li>
              <li>Notification system tracks sent alerts to prevent duplicates</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 