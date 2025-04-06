const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const getCurrentLogLevel = () => {
  const env = process.env.NODE_ENV || 'development';
  // In production, only show ERROR and WARN
  // In development, show all logs
  return env === 'production' ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
};

const sanitizeData = (data) => {
  if (!data) return data;
  
  // Deep clone the data to avoid modifying the original
  let clonedData;
  try {
    clonedData = JSON.parse(JSON.stringify(data));
  } catch (e) {
    // If data can't be stringified (e.g., contains circular references)
    // return a basic representation
    return String(data);
  }
  
  // List of sensitive fields to remove
  const sensitiveFields = [
    'password',
    'token',
    'email',
    'authToken',
    '_id',
    'userId',
    'socketId',
    'authorization',
    'Authorization',
    'refreshToken',
    'accessToken'
  ];
  
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    Object.keys(obj).forEach(key => {
      if (sensitiveFields.includes(key)) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    });
    
    return obj;
  };
  
  return sanitizeObject(clonedData);
};

const Logger = {
  error(message, ...args) {
    if (getCurrentLogLevel() >= LOG_LEVELS.ERROR) {
      console.error('❌ ERROR:', message, ...args.map(arg => sanitizeData(arg)));
    }
  },

  warn(message, ...args) {
    if (getCurrentLogLevel() >= LOG_LEVELS.WARN) {
      console.warn('⚠️ WARN:', message, ...args.map(arg => sanitizeData(arg)));
    }
  },

  info(message, ...args) {
    if (getCurrentLogLevel() >= LOG_LEVELS.INFO) {
      console.info('✅ INFO:', message, ...args.map(arg => sanitizeData(arg)));
    }
  },

  debug(message, ...args) {
    if (getCurrentLogLevel() >= LOG_LEVELS.DEBUG) {
      console.debug('🔹 DEBUG:', message, ...args.map(arg => sanitizeData(arg)));
    }
  },

  // For development only - will not log in production
  dev(message, ...args) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🛠️ DEV:', message, ...args.map(arg => sanitizeData(arg)));
    }
  }
};

export default Logger; 