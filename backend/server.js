import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import Logger from './utils/logger.js';
import validateEnv from './config/validation.js'; // Import environment validation

// Import routes
import userRoutes from './routes/userRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import nutritionRoutes from './routes/nutritionRoutes.js';
import mentalHealthRoutes from './routes/mentalHealthRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import syncRoutes from './routes/syncRoutes.js';

// Load environment variables from .env file
dotenv.config();

// Validate environment variables before starting the server
if (!validateEnv()) {
  Logger.error('❌ Environment validation failed. Server cannot start.');
  process.exit(1);
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - required for express-rate-limit to work correctly behind Render's proxy
app.set('trust proxy', 1);

// Rate limiting: 100 requests per 15 minutes per user/IP
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP/user to 100 requests per windowMs
  message: {
    message: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use user ID if available, otherwise fall back to IP
  keyGenerator: (req) => {
    return req.user?._id?.toString() || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
  handler: (req, res, next, options) => {
    Logger.warn(`Rate limit exceeded for ${req.ip}`, {
      path: req.path,
      userId: req.user?._id
    });
    res.status(options.statusCode).json(options.message);
  }
});

// Apply rate limiting to all API routes
app.use('/api/', rateLimiter);

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5000',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  },
  transports: ['websocket', 'polling']
});

// ✅ Allow JSON requests and parse cookies
app.use(express.json());
app.use(cookieParser());

// Enable gzip compression for responses
// Optimized: Lower threshold to 512 bytes for better compression of small JSON responses
app.use(compression({
  level: 6, // Balance between compression ratio and CPU usage
  threshold: 512, // Compress responses > 512 bytes (reduced from 1KB for small JSON payloads)
  filter: (req, res) => {
    // Skip compression for small responses or already compressed content
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Middleware to enable Cross-Origin Resource Sharing (CORS)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://fitness-app-dusky-six.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

// Debug: Log allowed origins on startup
Logger.info('🌐 Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      Logger.error('❌ CORS rejected - Origin not in allowed list:', origin);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// ETag middleware for client-side caching
const etagMiddleware = (req, res, next) => {
  // Skip ETag for non-GET requests and non-JSON responses
  if (req.method !== 'GET') {
    return next();
  }

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to add ETag
  res.json = (data) => {
    // Only generate ETag for successful responses with data
    if (res.statusCode >= 200 && res.statusCode < 300 && data) {
      const etag = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');

      // Check if client has matching ETag
      const clientEtag = req.headers['if-none-match'];
      if (clientEtag === etag) {
        return res.status(304).end(); // Not Modified
      }

      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'private, must-revalidate'); // Allow client caching with validation
    }

    return originalJson(data);
  };

  next();
};

// Apply ETag middleware before routes
app.use(etagMiddleware);

// Initialize routes
app.use('/api/users', userRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/mentalhealth', mentalHealthRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/sync', syncRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  Logger.info('New client connected:', socket.id);
  
  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      // You can reuse your existing auth middleware logic here
      // For now, we'll just store the token
      socket.token = token;
      socket.emit('authenticated', { success: true });
      
      // Extract user ID from token
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          const userId = payload.userId;
          Logger.info('Authenticated User:', userId, `(${payload.email})`);
          
          // Join user to their personal room
          socket.join(`user_${userId}`);
          
        } catch (e) {
          Logger.error('Error parsing token:', e);
        }
      }
    } catch (error) {
      socket.emit('authenticated', { success: false, error: error.message });
    }
  });

  // Join user to their personal room
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    Logger.info(`User ${userId} joined their personal room`);
  });

  socket.on('disconnect', () => {
    Logger.info('Client disconnected:', socket.id);
  });
});

// Make io accessible to our routes
app.set('io', io);

// Function to start the server
const startServer = async () => {
  try {
    // Connect to the database
    await connectDB();
    // Start the server
    server.listen(PORT, () => {
      Logger.info(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    Logger.error('❌ Server error:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Add error handling middleware
app.use((err, req, res, next) => {
  Logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  Logger.error('❌ Uncaught Exception:', error);
  // Gracefully shutdown the server
  server.close(() => {
    Logger.info('Server closed due to uncaught exception');
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Optionally shutdown the server
  server.close(() => {
    Logger.info('Server closed due to unhandled rejection');
    process.exit(1);
  });
});