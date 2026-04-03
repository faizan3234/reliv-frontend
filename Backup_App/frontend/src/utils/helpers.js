export const logger = {
  info: (...args) => {
    if (import.meta.env.DEV) {
      console.log('[INFO]', new Date().toISOString(), ...args);
    }
  },
  error: (...args) => {
    console.error('[ERROR]', new Date().toISOString(), ...args);
  },
  warn: (...args) => {
    if (import.meta.env.DEV) {
      console.warn('[WARN]', new Date().toISOString(), ...args);
    }
  },
  debug: (...args) => {
    if (import.meta.env.DEV) {
      console.log('[DEBUG]', new Date().toISOString(), ...args);
    }
  }
};

export const handleApiError = (error, context = '') => {
  const message = error?.message || 'Unknown error';
  logger.error(`API Error in ${context}:`, message);
  return {
    success: false,
    error: message,
    context
  };
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};
