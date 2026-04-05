import Logger from '../utils/logger.js';

// Define required environment variables by environment
const requiredEnvVars = {
  development: [
    'MONGO_URI',
    'JWT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'FITBIT_CLIENT_ID',
    'FITBIT_CLIENT_SECRET',
    'FITBIT_REDIRECT_URI'
  ],
  production: [
    'MONGO_URI',
    'JWT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'FITBIT_CLIENT_ID',
    'FITBIT_CLIENT_SECRET',
    'FITBIT_REDIRECT_URI'
  ],
  test: [
    'MONGO_URI',
    'JWT_SECRET'
  ]
};

// Optional environment variables with default values
const optionalEnvVars = {
  PORT: '5000',
  NODE_ENV: 'development',
  FLASK_URL: 'http://localhost:5001'
};

export const validateEnv = () => {
  const environment = process.env.NODE_ENV || 'development';
  const required = requiredEnvVars[environment] || requiredEnvVars.development;
  
  const missingVars = [];
  const invalidVars = [];

  // Check required variables
  required.forEach(envVar => {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    } else if (process.env[envVar].includes('your_') || process.env[envVar].includes('example')) {
      // Check for placeholder values
      invalidVars.push(envVar);
    }
  });

  // Set defaults for optional variables
  Object.entries(optionalEnvVars).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      Logger.debug(`Set default value for ${key}: ${defaultValue}`);
    }
  });

  // Log warnings for missing/invalid variables
  if (missingVars.length > 0) {
    Logger.error('❌ Missing required environment variables:', missingVars.join(', '));
    return false;
  }

  if (invalidVars.length > 0) {
    Logger.warn('⚠️ Found placeholder values in environment variables:', invalidVars.join(', '));
    Logger.warn('Please update these with actual values in your .env file');
    // Don't return false for placeholders in development
    if (environment === 'production') {
      return false;
    }
  }

  // Validate specific formats
  const validations = [
    {
      var: 'PORT',
      test: (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
      message: 'PORT must be a positive number'
    },
    {
      var: 'JWT_SECRET',
      test: (val) => val.length >= 32,
      message: 'JWT_SECRET should be at least 32 characters long for security'
    },
    {
      var: 'NODE_ENV',
      test: (val) => ['development', 'production', 'test'].includes(val),
      message: 'NODE_ENV must be one of: development, production, test'
    }
  ];

  const validationErrors = [];
  validations.forEach(({ var: envVar, test, message }) => {
    if (process.env[envVar] && !test(process.env[envVar])) {
      validationErrors.push(`${envVar}: ${message}`);
    }
  });

  if (validationErrors.length > 0) {
    Logger.error('❌ Environment variable validation errors:');
    validationErrors.forEach(err => Logger.error(`  - ${err}`));
    return false;
  }

  // Log success in development
  if (environment !== 'production') {
    Logger.info('✅ Environment variables validated successfully');
  }

  return true;
};

// Export for use in other files
export const getRequiredEnvVars = () => {
  return [...requiredEnvVars[process.env.NODE_ENV || 'development']];
};

export default validateEnv;