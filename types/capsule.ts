// Types for Memory Capsule Creator
export type ContentType = 'text' | 'photo' | 'voice' | 'video';

export interface CapsuleFormData {
  contentType: ContentType;
  textContent?: string;
  media?: File;
  deliveryDate: string;
  recipients: string[];
  phoneRecipients?: string[];
  password?: string;
  isPublic: boolean;
  isPaid?: boolean;
  userEmail?: string;
  userPhone?: string;
}

export interface CapsuleData {
  id: string;
  contentType: ContentType;
  textContent?: string;
  media?: {
    url: string;
    filename: string;
    mimeType: string;
    filesize: number;
  };
  deliveryDate: string;
  recipients: string[];
  phoneRecipients?: string[];
  uniqueLink: string;
  password?: string;
  isPublic: boolean;
  isPaid: boolean;
  stripePaymentId?: string;
  userEmail?: string;
  userPhone?: string;
  createdAt: string;
  updatedAt: string;
  isReady?: boolean;
}

export interface PublicCapsuleData {
  id: string;
  textContent: string;
  tags: string[];
  createdAt: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface CapsuleApiResponse {
  success: boolean;
  data?: {
    uniqueLink: string;
    shareableImageUrl?: string;
    capsuleId: string;
  };
  error?: string;
}

export interface StripeCheckoutResponse {
  success: boolean;
  data?: {
    sessionUrl: string;
    sessionId: string;
  };
  error?: string;
}

export interface EmailScheduleData {
  capsuleId: string;
  recipients: string[];
  deliveryDate: string;
  uniqueLink: string;
  scheduledJobId?: string;
}

export interface FormErrors {
  contentType?: string;
  textContent?: string;
  media?: string;
  deliveryDate?: string;
  recipients?: string;
  phoneRecipients?: string;
  password?: string;
  userEmail?: string;
  userPhone?: string;
  isPublic?: string;
  isPaid?: string;
  general?: string;
}

export interface CapsulePreview {
  contentType: ContentType;
  textContent?: string;
  mediaPreview?: string;
  deliveryDate: string;
  recipientCount: number;
  isPublic: boolean;
  isPaid?: boolean;
}

export interface ShareableImageData {
  capsuleId: string;
  deliveryDate: string;
  contentType: ContentType;
  imageUrl: string;
} 