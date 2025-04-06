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
    origin: ['http://localhost:3000', 'http://localhost:5000', '*'],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["my-custom-header"],
    transports: ['websocket', 'polling']
  }
});

// ✅ Allow JSON requests
app.use(express.json());

// Middleware to enable Cross-Origin Resource Sharing (CORS)
// Allow frontend to access backend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'], // Allow requests from both ports
  credentials: true // Allow cookies/auth headers if needed
}));

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

// Error handling
process.on('uncaughtException', (error) => {
  Logger.error('Server error:', error);
  // ... existing code ...
});