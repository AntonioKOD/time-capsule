/* eslint-disable @typescript-eslint/no-unused-vars */
import twilio from 'twilio';

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export interface SMSData {
  phoneNumber: string;
  message: string;
  capsuleId?: string;
  uniqueLink?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS notification for capsule delivery
 */
export async function sendCapsuleDeliverySMS(data: SMSData): Promise<SMSResult> {
  try {
    if (!twilioClient) {
      console.error('❌ Twilio client not configured. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
      return {
        success: false,
        error: 'SMS service not configured'
      };
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      console.error('❌ TWILIO_PHONE_NUMBER not configured');
      return {
        success: false,
        error: 'SMS phone number not configured'
      };
    }

    // Format phone number (ensure it starts with +)
    const formattedPhone = formatPhoneNumber(data.phoneNumber);
    if (!formattedPhone) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    // Create the SMS message
    const smsMessage = createCapsuleDeliveryMessage(data);

    console.log(`📱 Sending SMS to: ${formattedPhone}`);
    console.log(`📱 Message: ${smsMessage}`);

    const message = await twilioClient.messages.create({
      body: smsMessage,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log(`✅ SMS sent successfully. Message ID: ${message.sid}`);
    
    return {
      success: true,
      messageId: message.sid
    };

  } catch (error) {
    console.error('❌ Failed to send SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SMS error'
    };
  }
}

/**
 * Send SMS notification when capsule is created
 */
export async function sendCapsuleCreationSMS(
  phoneNumber: string,
  deliveryDate: string,
  contentType: string,
  uniqueLink: string
): Promise<SMSResult> {
  try {
    if (!twilioClient) {
      return {
        success: false,
        error: 'SMS service not configured'
      };
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    const deliveryDateFormatted = new Date(deliveryDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const message = `🎭 Your Memory Capsule Created!

Your ${contentType} memory has been safely stored and will be delivered on ${deliveryDateFormatted}.

You'll receive another text when it's ready to open.

Memory Capsule Creator`;

    console.log(`📱 Sending creation SMS to: ${formattedPhone}`);

    const smsMessage = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log(`✅ Creation SMS sent successfully. Message ID: ${smsMessage.sid}`);
    
    return {
      success: true,
      messageId: smsMessage.sid
    };

  } catch (error) {
    console.error('❌ Failed to send creation SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SMS error'
    };
  }
}

/**
 * Send SMS to recipient when they're added to a capsule
 */
export async function sendCapsuleRecipientSMS(
  phoneNumber: string,
  deliveryDate: string,
  contentType: string,
  hasPassword: boolean = false
): Promise<SMSResult> {
  try {
    if (!twilioClient) {
      return {
        success: false,
        error: 'SMS service not configured'
      };
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    const deliveryDateFormatted = new Date(deliveryDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const passwordNote = hasPassword ? '\n🔒 Note: This capsule is password protected.' : '';

    const message = `📮 You've been added to a Memory Capsule!

Someone has included you in their ${contentType} memory capsule that will be delivered on ${deliveryDateFormatted}.${passwordNote}

You'll receive the capsule link when it's ready to open.

Memory Capsule Creator`;

    console.log(`📱 Sending recipient SMS to: ${formattedPhone}`);

    const smsMessage = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    console.log(`✅ Recipient SMS sent successfully. Message ID: ${smsMessage.sid}`);
    
    return {
      success: true,
      messageId: smsMessage.sid
    };

  } catch (error) {
    console.error('❌ Failed to send recipient SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SMS error'
    };
  }
}

/**
 * Format phone number to international format
 */
function formatPhoneNumber(phoneNumber: string): string | null {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // If it starts with 1 and has 11 digits, it's likely US/Canada
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `+${digitsOnly}`;
  }
  
  // If it has 10 digits, assume US/Canada and add +1
  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }
  
  // If it already starts with +, return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  // For other international numbers, assume they need + prefix
  if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
    return `+${digitsOnly}`;
  }
  
  return null;
}

/**
 * Create the SMS message for capsule delivery
 */
function createCapsuleDeliveryMessage(data: SMSData): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://memorycapsule.app';
  const capsuleUrl = data.uniqueLink ? `${baseUrl}/capsule/${data.uniqueLink}` : '';
  
  return `🎁 Your Memory Capsule is Ready!

The moment you've been waiting for has arrived. Your memory capsule is now ready to open.

${capsuleUrl ? `Open it here: ${capsuleUrl}` : 'Check your email for the link to open it.'}

Memory Capsule Creator`;
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  const formatted = formatPhoneNumber(phoneNumber);
  return formatted !== null;
}

/**
 * Test SMS configuration
 */
export async function testSMSConfiguration(): Promise<SMSResult> {
  try {
    if (!twilioClient) {
      return {
        success: false,
        error: 'Twilio client not configured'
      };
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      return {
        success: false,
        error: 'TWILIO_PHONE_NUMBER not configured'
      };
    }
    // Test by getting account info
    const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
    
    return {
      success: true,
      messageId: `Configuration test passed. Account: ${account.friendlyName}`
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Configuration test failed'
    };
  }
} 