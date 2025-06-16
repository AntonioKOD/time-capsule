import { ContentType, CapsuleFormData, FormErrors } from "@/types/capsule";

/**
 * Validate email format using regex
 * @param email - Email address to validate
 * @returns boolean - Whether email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate phone number format
 * @param phoneNumber - Phone number to validate
 * @returns boolean - Whether phone number is valid
 */
// SMS functionality commented out
/*
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Check for valid length (7-15 digits for international numbers)
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return false;
  }
  
  // If it starts with 1 and has 11 digits, it's likely US/Canada
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return true;
  }
  
  // If it has 10 digits, assume US/Canada
  if (digitsOnly.length === 10) {
    return true;
  }
  
  // For other international numbers, accept 7-15 digits
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}
*/

/**
 * Format phone number for display
 * @param phoneNumber - Phone number to format
 * @returns string - Formatted phone number
 */
// SMS functionality commented out
/*
export function formatPhoneNumberDisplay(phoneNumber: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // US/Canada format
  if (digitsOnly.length === 10) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }
  
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`;
  }
  
  // International format - just add + if not present
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  return `+${digitsOnly}`;
}
*/

/**
 * Validate file size and type for media uploads
 * @param file - File to validate
 * @param contentType - Type of content (photo or voice)
 * @returns object - Validation result with error message if invalid
 */
export function validateMediaFile(
  file: File,
  contentType: ContentType
): { isValid: boolean; error?: string } {
  // Set different max sizes based on content type
  let maxSize: number;
  if (contentType === 'photo') {
    maxSize = 10 * 1024 * 1024; // 10MB for photos
  } else if (contentType === 'voice') {
    maxSize = 25 * 1024 * 1024; // 25MB for voice (3 minutes)
  } else if (contentType === 'video') {
    maxSize = 50 * 1024 * 1024; // 50MB for video (3 minutes)
  } else {
    maxSize = 5 * 1024 * 1024; // Default 5MB
  }
  
  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`
    };
  }
  
  // Check file type based on content type
  if (contentType === 'photo') {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "Photo must be JPEG or PNG format"
      };
    }
  } else if (contentType === 'voice') {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "Voice recording must be MP3, WAV, or M4A format"
      };
    }
    
    // For voice recordings, we'd ideally check duration here
    // This would require additional audio processing
  } else if (contentType === 'video') {
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "Video must be MP4, MOV, or AVI format"
      };
    }
    
    // For videos, we'd ideally check duration here
    // This would require additional video processing
  }
  
  return { isValid: true };
}

/**
 * Validate delivery date
 * @param dateString - Date string to validate
 * @returns object - Validation result with error message if invalid
 */
export function validateDeliveryDate(dateString: string): { isValid: boolean; error?: string } {
  const date = new Date(dateString);
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
  const twentyYearsFromNow = new Date();
  twentyYearsFromNow.setFullYear(twentyYearsFromNow.getFullYear() + 20);
  
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: "Please enter a valid date"
    };
  }
  
  if (date < oneMonthFromNow) {
    return {
      isValid: false,
      error: "Delivery date must be at least 1 month in the future"
    };
  }
  
  if (date > twentyYearsFromNow) {
    return {
      isValid: false,
      error: "Delivery date cannot be more than 20 years in the future"
    };
  }
  
  return { isValid: true };
}

/**
 * Count words in text content
 * @param text - Text to count words in
 * @returns number - Word count
 */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Validate complete capsule form data
 * @param formData - Form data to validate
 * @returns FormErrors - Object containing any validation errors
 */
export function validateCapsuleForm(formData: CapsuleFormData): FormErrors {
  const errors: FormErrors = {};
  
  // Validate content type
  if (!formData.contentType) {
    errors.contentType = "Please select a content type";
  }
  
  // Validate text content if provided
  if (formData.textContent) {
    const wordCount = countWords(formData.textContent);
    if (wordCount > 500) {
      errors.textContent = `Text content must be 500 words or less (currently ${wordCount} words)`;
    }
    if (formData.textContent.trim().length === 0) {
      errors.textContent = "Text content cannot be empty";
    }
  }
  
  // Validate that either text content or media is provided
  if (!formData.textContent?.trim() && !formData.media) {
    errors.general = "Please provide either text content or upload a file";
  }
  
  // Validate media file if provided
  if (formData.media) {
    const mediaValidation = validateMediaFile(formData.media, formData.contentType);
    if (!mediaValidation.isValid) {
      errors.media = mediaValidation.error;
    }
  }
  
  // Validate delivery date
  if (!formData.deliveryDate) {
    errors.deliveryDate = "Please select a delivery date";
  } else {
    const dateValidation = validateDeliveryDate(formData.deliveryDate);
    if (!dateValidation.isValid) {
      errors.deliveryDate = dateValidation.error;
    }
  }
  
  // Validate recipients
  if (formData.recipients.length > 3) {
    errors.recipients = "Maximum 3 email addresses allowed";
  }
  
  const invalidEmails = formData.recipients.filter(email => 
    email.trim() && !isValidEmail(email)
  );
  
  if (invalidEmails.length > 0) {
    errors.recipients = `Invalid email format: ${invalidEmails.join(', ')}`;
  }

  // Validate phone recipients
  // SMS functionality commented out
  /*
  if (formData.phoneRecipients && formData.phoneRecipients.length > 3) {
    errors.phoneRecipients = "Maximum 3 phone numbers allowed";
  }
  
  if (formData.phoneRecipients) {
    const invalidPhones = formData.phoneRecipients.filter(phone => 
      phone.trim() && !isValidPhoneNumber(phone)
    );
    
    if (invalidPhones.length > 0) {
      errors.phoneRecipients = `Invalid phone number format: ${invalidPhones.join(', ')}`;
    }
  }
  */
  
  // Validate password if provided
  if (formData.password && formData.password.length < 6) {
    errors.password = "Password must be at least 6 characters long";
  }
  
  // Validate user email if provided
  if (formData.userEmail && !isValidEmail(formData.userEmail)) {
    errors.userEmail = "Please enter a valid email address";
  }

  // Validate user phone if provided
  // SMS functionality commented out
  /*
  if (formData.userPhone && !isValidPhoneNumber(formData.userPhone)) {
    errors.userPhone = "Please enter a valid phone number";
  }
  */

  // Validate paid capsule requirements
  if (formData.isPaid) {
    if (!formData.userEmail) {
      errors.userEmail = "Email is required for paid capsules";
    }
  }

  // Validate public capsule requirements
  if (formData.isPublic) {
    if (formData.contentType !== 'text') {
      errors.general = "Only text capsules can be made public";
    }
    if (!formData.textContent?.trim()) {
      errors.textContent = "Public capsules must include text content";
    }
  }
  
  return errors;
}

/**
 * Sanitize text content to prevent XSS
 * @param text - Text to sanitize
 * @returns string - Sanitized text
 */
export function sanitizeTextContent(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Generate a unique filename for uploaded media
 * @param originalName - Original filename
 * @param contentType - Type of content
 * @returns string - Unique filename
 */
export function generateUniqueFilename(originalName: string, contentType: ContentType): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop() || '';
  
  return `${contentType}_${timestamp}_${randomString}.${extension}`;
} 