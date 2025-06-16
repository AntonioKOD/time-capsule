'use client'

import React, { useState, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  FileText, 
  Camera, 
  Mic, 
  Mail, 
  Lock, 
  Globe, 
  ArrowLeft, 
  Send, 
  Eye,
  Sparkles,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  CreditCard,
  Heart,
  Star,
  Video,
  Play,
  Download,
  Share,
  // Phone, // SMS functionality commented out
  // MessageSquare, // SMS functionality commented out
} from 'lucide-react';
import { ContentType, CapsuleFormData, FormErrors, CapsulePreview } from '@/types/capsule';
import { validateCapsuleForm, countWords } from '@/lib/validation';
import html2canvas from 'html2canvas';

/**
 * Memory Capsule Creator Page
 * Inspired by FutureMe.org's nostalgic, warm aesthetic with modern Stripe integration
 * Features form validation, preview, payment processing, and shareable success state
 */
export default function CreateCapsulePage() {
  
  // Form state
  const [formData, setFormData] = useState<CapsuleFormData>({
    contentType: 'text',
    textContent: '',
    deliveryDate: '',
    recipients: [''],
    // phoneRecipients: [''], // SMS functionality commented out
    isPublic: false,
    isPaid: true,
    userEmail: '',
    // userPhone: '', // SMS functionality commented out
  });
  
  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    uniqueLink: string;
    shareableImageUrl: string;
    capsuleId: string;
  } | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [shareableImageUrl, setShareableImageUrl] = useState<string>('');
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Calculate minimum date (1 month from now) - memoized for performance
  const minDateString = useMemo(() => {
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() + 1);
    return minDate.toISOString().split('T')[0];
  }, []);
  
  // Calculate maximum date (20 years from now) - memoized for performance
  const maxDateString = useMemo(() => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 20);
    return maxDate.toISOString().split('T')[0];
  }, []);
  
  // Word count for text content - memoized for performance
  const wordCount = useMemo(() => 
    formData.textContent ? countWords(formData.textContent) : 0, 
    [formData.textContent]
  );
  
  /**
   * Handle form field changes
   */
  const handleInputChange = (field: keyof CapsuleFormData, value: string | boolean | File | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };
  
  /**
   * Handle recipient email changes
   */
  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...formData.recipients];
    newRecipients[index] = value;
    setFormData(prev => ({
      ...prev,
      recipients: newRecipients
    }));
    
    if (errors.recipients) {
      setErrors(prev => ({
        ...prev,
        recipients: undefined
      }));
    }
  };

  // SMS functionality removed - handlePhoneRecipientChange function
  
  /**
   * Add new recipient email field
   */
  const addRecipient = () => {
    if (formData.recipients.length < 3) {
      setFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, '']
      }));
    }
  };
  
  /**
   * Remove recipient email field
   */
  const removeRecipient = (index: number) => {
    if (formData.recipients.length > 1) {
      const newRecipients = formData.recipients.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        recipients: newRecipients
      }));
    }
  };

  // SMS functionality removed - addPhoneRecipient and removePhoneRecipient functions
  
  /**
   * Handle file upload
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        media: file
      }));
      
      // Create preview for images and videos
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setMediaPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setMediaPreview('');
      }
      
      if (errors.media) {
        setErrors(prev => ({
          ...prev,
          media: undefined
        }));
      }
    }
  };
  
  /**
   * Remove uploaded file
   */
  const removeFile = () => {
    setFormData(prev => ({
      ...prev,
      media: undefined
    }));
    setMediaPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  /**
   * Validate and show preview
   */
  const handlePreview = () => {
    const validationErrors = validateCapsuleForm(formData);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors({});
    setShowPreview(true);
  };
  
  /**
   * Submit form to create capsule (free version)
   */
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('contentType', formData.contentType);
      submitData.append('deliveryDate', formData.deliveryDate);
      submitData.append('recipients', formData.recipients.filter(email => email.trim()).join(','));
      // submitData.append('phoneRecipients', (formData.phoneRecipients || []).filter(phone => phone.trim()).join(',')); // SMS functionality commented out
      submitData.append('isPublic', formData.isPublic.toString());
      submitData.append('isPaid', 'false');
      
      if (formData.textContent) {
        submitData.append('textContent', formData.textContent);
      }
      
      if (formData.media) {
        submitData.append('media', formData.media);
      }
      
      if (formData.password) {
        submitData.append('password', formData.password);
      }
      
      if (formData.userEmail) {
        submitData.append('userEmail', formData.userEmail);
      }
      
      // SMS functionality commented out
      /*
      if (formData.userPhone) {
        submitData.append('userPhone', formData.userPhone);
      }
      */
      
      const response = await fetch('/api/capsules-custom', {
        method: 'POST',
        body: submitData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSuccessData(result.data);
        await generateShareableImage();
        setIsSuccess(true);
        setShowPreview(false);
      } else {
        setErrors({ general: result.error || 'Failed to create capsule' });
      }
    } catch (error) {
      console.error('Error creating capsule:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle paid capsule creation via Stripe
   */
  const handlePaidSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Create FormData for Stripe checkout
      const submitData = new FormData();
      submitData.append('contentType', formData.contentType);
      submitData.append('deliveryDate', formData.deliveryDate);
      submitData.append('recipients', formData.recipients.filter(email => email.trim()).join(','));
      // submitData.append('phoneRecipients', (formData.phoneRecipients || []).filter(phone => phone.trim()).join(',')); // SMS functionality commented out
      submitData.append('isPublic', formData.isPublic.toString());
      submitData.append('isPaid', 'true');
      
      if (formData.textContent) {
        submitData.append('textContent', formData.textContent);
      }
      
      if (formData.media) {
        submitData.append('media', formData.media);
      }
      
      if (formData.password) {
        submitData.append('password', formData.password);
      }
      
      if (formData.userEmail) {
        submitData.append('userEmail', formData.userEmail);
      }
      
      // SMS functionality commented out
      /*
      if (formData.userPhone) {
        submitData.append('userPhone', formData.userPhone);
      }
      */
      
      const response = await fetch('/api/stripe', {
        method: 'POST',
        body: submitData,
      });
      
      const result = await response.json();
      
      if (result.success && result.data?.sessionUrl) {
        // Redirect to Stripe Checkout
        window.location.href = result.data.sessionUrl;
      } else {
        setErrors({ general: result.error || 'Failed to create payment session' });
      }
    } catch (error) {
      console.error('Error creating payment session:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Generate shareable image using html2canvas
   */
  const generateShareableImage = async () => {
    try {
      const shareElement = document.getElementById('shareable-content');
      if (shareElement) {
        const canvas = await html2canvas(shareElement, {
          backgroundColor: '#f8fafc',
          scale: 2,
          width: 600,
          height: 400,
        });
        const imageUrl = canvas.toDataURL('image/png');
        setShareableImageUrl(imageUrl);
      }
    } catch (error) {
      console.error('Error generating shareable image:', error);
    }
  };
  
  /**
   * Create another capsule
   */
  const createAnother = () => {
    setFormData({
      contentType: 'text',
      textContent: '',
      deliveryDate: '',
      recipients: [''],
      // phoneRecipients: [''], // SMS functionality commented out
      isPublic: false,
      isPaid: true,
      userEmail: '',
      // userPhone: '', // SMS functionality commented out
    });
    setErrors({});
    setIsSuccess(false);
    setSuccessData(null);
    setShowPreview(false);
    setMediaPreview('');
    setShareableImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Validate form for payment requirements (without setting errors)
   */
  const isFormValidForPayment = (): boolean => {
    const validationErrors = validateCapsuleForm(formData);
    
    // Additional validation for paid capsules
    if (!formData.userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
      validationErrors.userEmail = 'Valid email is required for payment confirmation';
    }
    
    return Object.keys(validationErrors).length === 0;
  };

  /**
   * Validate form for payment requirements (with setting errors)
   */
  const validateForPayment = (): boolean => {
    const validationErrors = validateCapsuleForm(formData);
    
    // Additional validation for paid capsules
    if (!formData.userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userEmail)) {
      validationErrors.userEmail = 'Valid email is required for payment confirmation';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };
  
  // Success state
  if (isSuccess && successData) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto max-w-4xl px-6 py-12">
          <div className="animate-fade-in text-center">
            {/* Hidden shareable content for image generation */}
            <div id="shareable-content" className="hidden">
              <div className="w-[600px] h-[400px] bg-gradient-to-br from-rose-100 to-amber-100 p-8 flex flex-col justify-center items-center text-center">
                <div className="mb-6">
                  <Heart className="h-16 w-16 text-rose-500 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-slate-800 font-handwritten">
                    I sealed a memory for
                  </h2>
                  <p className="text-2xl font-semibold text-slate-700 mt-2">
                    {new Date(formData.deliveryDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-slate-600">
                  <p className="text-lg">✨ Memory Capsule Creator ✨</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center bg-blue border-4 border-black shadow-brutalist">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <h1 className="mb-4 text-4xl font-black text-black font-retro uppercase">
                Your Memory is Sealed! ✨
              </h1>
              <p className="text-xl text-black font-bold leading-relaxed max-w-2xl mx-auto">
                Your capsule has been created and will be delivered on{' '}
                <strong className="text-blue">
                  {new Date(formData.deliveryDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </strong>
              </p>
            </div>
            
            <div className="brutalist-card brutalist-card-white mb-8 p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="text-left">
                  <h3 className="font-black text-black mb-2 flex items-center gap-2 font-retro uppercase">
                    <Sparkles className="h-5 w-5 text-blue" />
                    Capsule Details
                  </h3>
                  <div className="space-y-2 text-sm text-black font-bold">
                    <p><strong>ID:</strong> {successData.capsuleId}</p>
                    <p><strong>Type:</strong> {formData.contentType}</p>
                    <p><strong>Recipients:</strong> {formData.recipients.filter(email => email.trim()).length || 'Just you'}</p>
                    <div className="flex gap-2 mt-2">
                      {formData.isPublic && <div className="brutalist-badge">Public</div>}
                      <div className="brutalist-badge brutalist-badge-black">Complete</div>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="font-black text-black mb-2 flex items-center gap-2 font-retro uppercase">
                    <Clock className="h-5 w-5 text-blue" />
                    What's Next?
                  </h3>
                  <div className="space-y-2 text-sm text-black font-bold">
                    <p>📧 Confirmation email sent</p>
                    <p>📅 Delivery scheduled</p>
                    <p>🔔 You'll be notified when it's ready</p>
                    <p>💝 Your memory is safely stored</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shareable Image Section */}
            {shareableImageUrl && (
              <div className="brutalist-card brutalist-card-blue mb-8 p-8 text-center">
                <h3 className="font-black text-white mb-4 flex items-center justify-center gap-2 font-retro uppercase">
                  <Star className="h-5 w-5 text-white" />
                  Share Your Memory
                </h3>
                <div className="mb-4">
                  <img 
                    src={shareableImageUrl} 
                    alt="Shareable memory capsule image" 
                    className="mx-auto border-4 border-black shadow-brutalist max-w-sm"
                  />
                </div>
                <p className="text-sm text-white font-bold mb-4">
                  Share this beautiful image to let others know you've sealed a memory!
                </p>
                <div className="button-group">
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.download = `memory-capsule-${new Date().toISOString().split('T')[0]}.png`;
                      link.href = shareableImageUrl;
                      link.click();
                    }}
                    className="brutalist-button brutalist-button-black brutalist-button-sm"
                  >
                    <Download className="button-icon-left h-4 w-4" />
                    Download Image
                  </button>
                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'I sealed a memory!',
                          text: `I just created a memory capsule to be opened on ${new Date(formData.deliveryDate).toLocaleDateString()}`,
                          url: window.location.origin,
                        });
                      }
                    }}
                    className="brutalist-button brutalist-button-secondary brutalist-button-sm"
                  >
                    <Share className="button-icon-left h-4 w-4" />
                    Share
                  </button>
                </div>
              </div>
            )}
            
            <div className="button-group">
              <button 
                onClick={createAnother}
                className="brutalist-button brutalist-button-primary brutalist-button-lg"
              >
                <Sparkles className="button-icon-left h-5 w-5" />
                Create Another Capsule
              </button>
              
              <Link href="/" className="brutalist-button brutalist-button-secondary brutalist-button-lg">
                <ArrowLeft className="button-icon-left h-5 w-5" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Preview state
  if (showPreview) {
    const previewData: CapsulePreview = {
      contentType: formData.contentType,
      textContent: formData.textContent,
      mediaPreview,
      deliveryDate: formData.deliveryDate,
      recipientCount: formData.recipients.filter(email => email.trim()).length,
      isPublic: formData.isPublic,
      isPaid: formData.isPaid,
    };
    
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto max-w-4xl px-6 py-12">
          <div className="animate-fade-in">
            <div className="mb-8 text-center">
              <h1 className="mb-4 text-4xl font-black text-black font-retro uppercase">
                Preview Your Memory Capsule
              </h1>
              <p className="text-xl text-black font-bold leading-relaxed">
                Take a final look before sealing your memory
                <span className="brutalist-badge ml-2">Complete Capsule $1</span>
              </p>
            </div>
            
            <div className="brutalist-card brutalist-card-white mb-8 overflow-hidden">
              <div className="brutalist-window-header">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {formData.contentType === 'text' && <FileText className="h-6 w-6" />}
                    {formData.contentType === 'photo' && <Camera className="h-6 w-6" />}
                    {formData.contentType === 'voice' && <Mic className="h-6 w-6" />}
                    {formData.contentType === 'video' && <Video className="h-6 w-6" />}
                    <span className="font-black uppercase">
                      {formData.contentType.charAt(0).toUpperCase() + formData.contentType.slice(1)} Capsule
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {formData.isPublic && <div className="brutalist-badge brutalist-badge-black">Public</div>}
                    {formData.password && <div className="brutalist-badge brutalist-badge-white"><Lock className="mr-1 h-3 w-3" />Protected</div>}
                  </div>
                </div>
                <div className="text-sm font-bold mt-2">
                  To be opened on {new Date(formData.deliveryDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              
              <div className="brutalist-window-content p-8">
                {formData.textContent && (
                  <div className="mb-6">
                    <h3 className="font-black text-black mb-3 font-retro uppercase">Your Message</h3>
                    <div className="bg-gray p-4 border-3 border-black shadow-brutalist">
                      <p className="text-black font-bold leading-relaxed whitespace-pre-wrap">
                        {formData.textContent}
                      </p>
                    </div>
                  </div>
                )}
                
                {formData.media && (
                  <div className="mb-6">
                    <h3 className="font-black text-black mb-3 font-retro uppercase">Attached Media</h3>
                    <div className="bg-gray p-4 border-3 border-black shadow-brutalist">
                      {mediaPreview && formData.contentType === 'photo' && (
                        <img 
                          src={mediaPreview} 
                          alt="Preview" 
                          className="max-w-full h-auto border-4 border-black shadow-brutalist max-h-64 object-cover"
                        />
                      )}
                      
                      {mediaPreview && formData.contentType === 'video' && (
                        <video 
                          src={mediaPreview} 
                          controls
                          className="max-w-full h-auto border-4 border-black shadow-brutalist max-h-64"
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
                      
                      {formData.contentType === 'voice' && (
                        <div className="space-y-3">
                          <audio 
                            src={mediaPreview || URL.createObjectURL(formData.media)} 
                            controls
                            className="w-full"
                          >
                            Your browser does not support the audio tag.
                          </audio>
                          <div className="flex items-center gap-3 text-black font-bold">
                            <Mic className="h-5 w-5" />
                            <span>{formData.media.name}</span>
                            <div className="brutalist-badge">{(formData.media.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                        </div>
                      )}
                      
                      {!mediaPreview && formData.contentType !== 'voice' && (
                        <div className="flex items-center gap-3 text-black font-bold">
                          {formData.contentType === 'photo' && <Camera className="h-5 w-5" />}
                          {formData.contentType === 'video' && <Video className="h-5 w-5" />}
                          <span>{formData.media.name}</span>
                          <div className="brutalist-badge">{(formData.media.size / 1024 / 1024).toFixed(2)} MB</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-black text-black mb-2 font-retro uppercase">Delivery Details</h3>
                    <div className="space-y-2 text-sm text-black font-bold">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(formData.deliveryDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{previewData.recipientCount} recipient{previewData.recipientCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>
                  
                  {formData.recipients.filter(email => email.trim()).length > 0 && (
                    <div>
                      <h3 className="font-black text-black mb-2 font-retro uppercase">Recipients</h3>
                      <div className="space-y-1">
                        {formData.recipients.filter(email => email.trim()).map((email, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-black font-bold">
                            <Mail className="h-4 w-4" />
                            <span>{email}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {errors.general && (
              <div className="brutalist-card brutalist-card-black mb-6 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-white" />
                  <span className="text-white font-bold">{errors.general}</span>
                </div>
              </div>
            )}
            
            <div className="button-group">
              <button 
                onClick={handlePaidSubmit}
                disabled={isSubmitting || !isFormValidForPayment()}
                className="brutalist-button brutalist-button-primary brutalist-button-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="button-icon-left h-5 w-5 loading-spinner rounded-full border-2 border-white border-t-transparent" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="button-icon-left h-5 w-5" />
                    Pay $1 & Seal Capsule
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setShowPreview(false)}
                className="brutalist-button brutalist-button-secondary brutalist-button-lg"
              >
                <ArrowLeft className="button-icon-left h-5 w-5" />
                Back to Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Main form
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto max-w-4xl px-6 py-12">
        <div className="animate-fade-in">
          {/* Header */}
          <div className="mb-12 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-black hover:text-blue transition-colors mb-6 font-bold"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            
            <h1 className="mb-6 text-5xl font-black text-black leading-tight font-retro uppercase">
              What moment do you want to seal?
            </h1>
            
            <p className="text-xl text-black font-bold leading-relaxed max-w-2xl mx-auto">
              Create a digital time capsule with your thoughts, photos, or voice messages. 
              Set it to open at the perfect moment in the future.
            </p>

            {/* Memory Capsule Info Banner */}
            <div className="mt-8 flex justify-center max-w-2xl mx-auto">
              <div className="brutalist-card brutalist-card-blue p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Star className="h-6 w-6 text-white" />
                  <h3 className="font-black text-white text-lg font-retro uppercase">Complete Memory Capsule</h3>
                </div>
                <p className="text-white font-bold mb-3">Photos • Voice Messages • Video Messages • Multiple Recipients • Secure Storage</p>
                <div className="brutalist-badge brutalist-badge-black text-lg px-4 py-2">$1</div>
                <p className="text-xs text-white font-bold mt-2">One-time payment • Lifetime storage</p>
              </div>
            </div>
          </div>
          
          <div className="brutalist-card brutalist-card-white p-8 overflow-hidden">
            <form className="space-y-8">
              {/* Content Type Selection */}
              <div className="space-y-4">
                <Label className="text-lg font-black text-black font-retro uppercase">
                  What type of memory would you like to preserve?
                </Label>
                <RadioGroup
                  value={formData.contentType}
                  onValueChange={(value) => handleInputChange('contentType', value as ContentType)}
                  className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                >
                  <div className="flex items-center space-x-2 p-4 border-3 border-black hover:bg-gray transition-colors">
                    <RadioGroupItem value="text" id="text" />
                    <Label htmlFor="text" className="flex items-center gap-3 cursor-pointer flex-1">
                      <FileText className="h-5 w-5 text-blue" />
                      <div>
                        <div className="font-black text-black">Written Message</div>
                        <div className="text-sm text-black font-bold">Share your thoughts and feelings</div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border-3 border-black hover:bg-gray transition-colors">
                    <RadioGroupItem value="photo" id="photo" />
                    <Label htmlFor="photo" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Camera className="h-5 w-5 text-blue" />
                      <div>
                        <div className="font-black text-black">Photo Memory</div>
                        <div className="text-sm text-black font-bold">Capture a special moment</div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border-3 border-black hover:bg-gray transition-colors">
                    <RadioGroupItem value="voice" id="voice" />
                    <Label htmlFor="voice" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Mic className="h-5 w-5 text-blue" />
                      <div>
                        <div className="font-black text-black">Voice Message</div>
                        <div className="text-sm text-black font-bold">Record your voice for the future</div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-4 border-3 border-black hover:bg-gray transition-colors">
                    <RadioGroupItem value="video" id="video" />
                    <Label htmlFor="video" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Video className="h-5 w-5 text-blue" />
                      <div>
                        <div className="font-black text-black">Video Message</div>
                        <div className="text-sm text-black font-bold">Share a video memory</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
                {errors.contentType && (
                  <div className="brutalist-card brutalist-card-black p-3">
                    <p className="text-sm text-white font-bold">{errors.contentType}</p>
                  </div>
                )}
              </div>
              
              <div className="border-t-3 border-black my-8"></div>
              
              {/* Text Content */}
              {(formData.contentType === 'text' || formData.textContent) && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="textContent" className="text-lg font-black text-black font-retro uppercase">
                      Your Message to the Future
                    </Label>
                    <div className={`brutalist-badge ${wordCount > 500 ? "brutalist-badge-black" : ""}`}>
                      {wordCount}/500 words
                    </div>
                  </div>
                  <Textarea
                    id="textContent"
                    placeholder="Dear future me... What are you thinking about right now? What hopes do you have? What challenges are you facing?"
                    value={formData.textContent || ''}
                    onChange={(e) => handleInputChange('textContent', e.target.value)}
                    className="brutalist-input min-h-32 text-base leading-relaxed resize-none"
                    aria-label="Enter capsule text content"
                  />
                  {errors.textContent && (
                    <div className="brutalist-card brutalist-card-black p-3">
                      <p className="text-sm text-white font-bold">{errors.textContent}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Media Upload */}
              {(formData.contentType === 'photo' || formData.contentType === 'voice' || formData.contentType === 'video') && (
                <div className="space-y-4">
                  <Label className="text-lg font-black text-black font-retro uppercase">
                    {formData.contentType === 'photo' && 'Upload Your Photo'}
                    {formData.contentType === 'voice' && 'Upload Your Voice Recording'}
                    {formData.contentType === 'video' && 'Upload Your Video'}
                  </Label>
                  
                  {!formData.media ? (
                    <div 
                      className="brutalist-card brutalist-card-gray p-8 text-center cursor-pointer hover:bg-white transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center gap-4">
                        {formData.contentType === 'photo' && <Camera className="h-12 w-12 text-blue" />}
                        {formData.contentType === 'voice' && <Mic className="h-12 w-12 text-blue" />}
                        {formData.contentType === 'video' && <Video className="h-12 w-12 text-blue" />}
                        <div>
                          <p className="text-lg font-black text-black">
                            Click to upload your {formData.contentType}
                          </p>
                          <p className="text-sm text-black font-bold">
                            {formData.contentType === 'photo' && 'JPEG or PNG, max 10MB'}
                            {formData.contentType === 'voice' && 'MP3, WAV, or M4A, max 25MB, up to 3 minutes'}
                            {formData.contentType === 'video' && 'MP4, MOV, or AVI, max 50MB, up to 3 minutes'}
                          </p>
                        </div>
                        <button type="button" className="brutalist-button brutalist-button-secondary brutalist-button-sm">
                          <Upload className="button-icon-left h-4 w-4" />
                          Choose File
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="brutalist-card brutalist-card-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {formData.contentType === 'photo' && <Camera className="h-5 w-5 text-blue" />}
                          {formData.contentType === 'voice' && <Mic className="h-5 w-5 text-blue" />}
                          {formData.contentType === 'video' && <Video className="h-5 w-5 text-blue" />}
                          <div>
                            <p className="font-black text-black">{formData.media.name}</p>
                            <p className="text-sm text-black font-bold">
                              {(formData.media.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={removeFile}
                          className="brutalist-button brutalist-button-black brutalist-button-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {mediaPreview && formData.contentType === 'photo' && (
                        <div className="mt-4">
                          <img 
                            src={mediaPreview} 
                            alt="Preview" 
                            className="max-w-full h-auto border-4 border-black shadow-brutalist max-h-48 object-cover"
                          />
                        </div>
                      )}
                      
                      {mediaPreview && formData.contentType === 'video' && (
                        <div className="mt-4">
                          <video 
                            src={mediaPreview} 
                            controls
                            className="max-w-full h-auto border-4 border-black shadow-brutalist max-h-48"
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                      
                      {formData.media && formData.contentType === 'voice' && (
                        <div className="mt-4">
                          <audio 
                            src={mediaPreview || URL.createObjectURL(formData.media)} 
                            controls
                            className="w-full"
                          >
                            Your browser does not support the audio tag.
                          </audio>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={
                      formData.contentType === 'photo' ? 'image/jpeg,image/jpg,image/png' :
                      formData.contentType === 'voice' ? 'audio/mpeg,audio/mp3,audio/wav,audio/m4a' :
                      formData.contentType === 'video' ? 'video/mp4,video/mov,video/avi,video/quicktime' : ''
                    }
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-label={`Upload ${formData.contentType} file`}
                  />
                  
                  {errors.media && (
                    <div className="brutalist-card brutalist-card-black p-3">
                      <p className="text-sm text-white font-bold">{errors.media}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="border-t-3 border-black my-8"></div>
              
              {/* Delivery Date */}
              <div className="space-y-4">
                <Label htmlFor="deliveryDate" className="text-lg font-black text-black font-retro uppercase">
                  When should this memory be delivered?
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray" />
                  <Input
                    id="deliveryDate"
                    type="date"
                    min={minDateString}
                    max={maxDateString}
                    value={formData.deliveryDate}
                    onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                    className="brutalist-input pl-10 text-base"
                    aria-label="Select delivery date"
                  />
                </div>
                <p className="text-sm text-black font-bold">
                  Choose a date between 1 month and 20 years from now
                </p>
                {errors.deliveryDate && (
                  <div className="brutalist-card brutalist-card-black p-3">
                    <p className="text-sm text-white font-bold">{errors.deliveryDate}</p>
                  </div>
                )}
              </div>
              
              <div className="border-t-3 border-black my-8"></div>
              
              {/* Recipients */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-black text-black font-retro uppercase">
                    Who should receive this capsule? (Optional)
                  </Label>
                  <div className="brutalist-badge">{formData.recipients.filter(email => email.trim()).length}/3</div>
                </div>
                
                <div className="space-y-3">
                  {formData.recipients.map((email, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray" />
                        <Input
                          type="email"
                          placeholder="friend@example.com"
                          value={email}
                          onChange={(e) => handleRecipientChange(index, e.target.value)}
                          className="brutalist-input pl-10"
                          aria-label={`Recipient email ${index + 1}`}
                        />
                      </div>
                      {formData.recipients.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeRecipient(index)}
                          className="brutalist-button brutalist-button-black brutalist-button-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {formData.recipients.length < 3 && (
                  <button 
                    type="button" 
                    onClick={addRecipient}
                    className="brutalist-button brutalist-button-secondary brutalist-button-full"
                  >
                    <Users className="button-icon-left h-4 w-4" />
                    Add Another Recipient
                  </button>
                )}
                
                {errors.recipients && (
                  <div className="brutalist-card brutalist-card-black p-3">
                    <p className="text-sm text-white font-bold">{errors.recipients}</p>
                  </div>
                )}
              </div>

              {/* Phone Recipients */}
              {/* SMS functionality commented out */}
              {/*
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-black text-black font-retro uppercase">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue" />
                      SMS Recipients (Optional)
                    </div>
                  </Label>
                  <div className="brutalist-badge">{(formData.phoneRecipients || []).filter(phone => phone.trim()).length}/3</div>
                </div>
                
                <p className="text-sm text-black font-bold">
                  📱 Send SMS notifications when the capsule is ready to open
                </p>
                
                <div className="space-y-3">
                  {(formData.phoneRecipients || ['']).map((phone, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray" />
                        <Input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={phone}
                          onChange={(e) => handlePhoneRecipientChange(index, e.target.value)}
                          className="brutalist-input pl-10"
                          aria-label={`Recipient phone ${index + 1}`}
                        />
                      </div>
                      {(formData.phoneRecipients || []).length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removePhoneRecipient(index)}
                          className="brutalist-button brutalist-button-black brutalist-button-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {(formData.phoneRecipients || []).length < 3 && (
                  <button 
                    type="button" 
                    onClick={addPhoneRecipient}
                    className="brutalist-button brutalist-button-secondary brutalist-button-full"
                  >
                    <Phone className="button-icon-left h-4 w-4" />
                    Add SMS Recipient
                  </button>
                )}
                
                {errors.phoneRecipients && (
                  <div className="brutalist-card brutalist-card-black p-3">
                    <p className="text-sm text-white font-bold">{errors.phoneRecipients}</p>
                  </div>
                )}
              </div>
              */}
              
              <div className="border-t-3 border-black my-8"></div>
              
              {/* User Email */}
              <div className="space-y-4">
                <Label htmlFor="userEmail" className="text-lg font-black text-black font-retro uppercase">
                  Your Email (Required for payment)
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray" />
                  <Input
                    id="userEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.userEmail || ''}
                    onChange={(e) => handleInputChange('userEmail', e.target.value)}
                    className="brutalist-input pl-10"
                    aria-label="Your email address"
                    required={formData.isPaid}
                  />
                </div>
                <p className="text-sm text-black font-bold">
                  Required for payment confirmation and capsule delivery notifications
                </p>
                {errors.userEmail && (
                  <div className="brutalist-card brutalist-card-black p-3">
                    <p className="text-sm text-white font-bold">{errors.userEmail}</p>
                  </div>
                )}
              </div>

              {/* User Phone */}
              {/* SMS functionality commented out */}
              {/*
              <div className="space-y-4">
                <Label htmlFor="userPhone" className="text-lg font-black text-black font-retro uppercase">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue" />
                    Your Phone Number (Optional)
                  </div>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray" />
                  <Input
                    id="userPhone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.userPhone || ''}
                    onChange={(e) => handleInputChange('userPhone', e.target.value)}
                    className="brutalist-input pl-10"
                    aria-label="Your phone number"
                  />
                </div>
                <p className="text-sm text-black font-bold">
                  📱 Get SMS notifications when your capsule is ready to open
                </p>
                {errors.userPhone && (
                  <div className="brutalist-card brutalist-card-black p-3">
                    <p className="text-sm text-white font-bold">{errors.userPhone}</p>
                  </div>
                )}
              </div>
              */}
              
              <div className="border-t-3 border-black my-8"></div>
              
              {/* Additional Options */}
              <div className="space-y-6">
                <h3 className="text-lg font-black text-black font-retro uppercase">Additional Options</h3>
                
                {/* Password Protection */}
                <div className="space-y-4">
                  <Label htmlFor="password" className="flex items-center gap-2 font-black text-black font-retro uppercase">
                    <Lock className="h-4 w-4" />
                    Password Protection (Optional)
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter a password to secure your capsule"
                    value={formData.password || ''}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="brutalist-input"
                    aria-label="Password to protect capsule"
                  />
                  <p className="text-sm text-black font-bold">
                    Minimum 6 characters. Recipients will need this password to open the capsule.
                  </p>
                  {errors.password && (
                    <div className="brutalist-card brutalist-card-black p-3">
                      <p className="text-sm text-white font-bold">{errors.password}</p>
                    </div>
                  )}
                </div>
                
                {/* Public Option */}
                {formData.contentType === 'text' && (
                  <div className="brutalist-card brutalist-card-white p-6 border-4 border-black shadow-brutalist">
                    <div className="flex items-start space-x-4">
                      <Checkbox
                        id="isPublic"
                        checked={formData.isPublic}
                        onCheckedChange={(checked) => handleInputChange('isPublic', checked)}
                        className="mt-1 scale-125"
                      />
                      <div className="flex-1">
                        <Label htmlFor="isPublic" className="flex items-center gap-2 font-black text-black cursor-pointer font-retro uppercase text-lg mb-3">
                          <Globe className="h-5 w-5 text-blue" />
                          Share in Public Gallery
                        </Label>
                        <p className="text-sm text-black font-bold mb-4 leading-relaxed">
                          ✨ <strong>Inspire others with your words!</strong> Your text message can be shared anonymously 
                          in our public gallery where people discover meaningful memories from around the world.
                        </p>
                        <p className="text-xs text-gray font-bold mb-4">
                          💡 Don't worry - you can also choose to share your memory after opening your time capsule!
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <div className="brutalist-badge text-xs px-3 py-1">Anonymous</div>
                          <div className="brutalist-badge text-xs px-3 py-1">Text Only</div>
                          <div className="brutalist-badge text-xs px-3 py-1">Optional</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* General Error */}
              {errors.general && (
                <div className="brutalist-card brutalist-card-black p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-white" />
                    <span className="text-white font-bold">{errors.general}</span>
                  </div>
                </div>
              )}
              
              {/* Submit Button */}
              <div className="pt-8">
                <button 
                  type="button"
                  onClick={handlePreview}
                  className="brutalist-button brutalist-button-primary brutalist-button-lg brutalist-button-full"
                >
                  <Eye className="button-icon-left h-6 w-6" />
                  Preview My Memory Capsule
                </button>
                <p className="text-center text-sm text-gray font-bold mt-4">
                  Review your capsule before payment • Secure checkout with Stripe
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 