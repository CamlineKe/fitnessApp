import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Logger from './utils/logger.js';

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

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5000',
      process.env.FRONTEND_URL,
      'https://fitness-3doakdbyh-camlinekes-projects.vercel.app'
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    transports: ['websocket', 'polling']
  }
});

// ✅ Allow JSON requests
app.use(express.json());

// Middleware to enable Cross-Origin Resource Sharing (CORS)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL,
  'https://fitness-app-dusky-six.vercel.app/' // Explicitly add your Vercel URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
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
      Logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    Logger.error('Server error:', error);
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
  Logger.error('Server error:', error);
  // ... existing code ...
});