/**
 * Production-ready logging utility
 * Replaces console.log statements with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as any : undefined,
    };
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    const logEntry = this.formatMessage(level, message, context, error);

    if (this.isDevelopment) {
      // Development: Use console with colors and formatting
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];

      console.log(`${emoji} ${message}`, context ? context : '');
      if (error) console.error(error);
    } else if (this.isProduction) {
      // Production: Structured JSON logging
      console.log(JSON.stringify(logEntry));
      
      // TODO: Send to external logging service (e.g., Sentry, LogRocket)
      // this.sendToExternalService(logEntry);
    }
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log('error', message, context, error);
  }

  // Specific logging methods for common use cases
  capsuleCreated(capsuleId: string, userEmail?: string) {
    this.info('Capsule created successfully', { 
      capsuleId, 
      userEmail: userEmail ? this.maskEmail(userEmail) : undefined 
    });
  }

  emailSent(recipientEmail: string, type: string) {
    this.info('Email sent successfully', { 
      recipientEmail: this.maskEmail(recipientEmail), 
      type 
    });
  }

  paymentProcessed(sessionId: string, amount?: number) {
    this.info('Payment processed successfully', { 
      sessionId, 
      amount 
    });
  }

  apiRequest(method: string, path: string, ip?: string) {
    this.debug('API request received', { 
      method, 
      path, 
      ip: ip ? this.maskIP(ip) : undefined 
    });
  }

  // Utility methods
  private maskEmail(email: string): string {
    if (!email) return '';
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
  }

  private maskIP(ip: string): string {
    if (!ip) return '';
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.***.***.`;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export for backward compatibility
export default logger; 