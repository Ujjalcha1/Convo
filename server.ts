import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import dbConnect from './src/db/connect';
import User from './src/db/models/User';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize the Next.js app compiler
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  // Establish database connection immediately on startup
  try {
    await dbConnect();
    console.log('Database connected successfully on custom server startup');
  } catch (err) {
    console.error('Failed to connect to database during startup:', err);
  }

  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || '', true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Attach Socket.io to the Node server
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Allow all origins for robust local testing
      methods: ['GET', 'POST'],
    },
  });

  // Mapping directories for session associations
  const userSocketMap = new Map<string, string>(); // userId -> socketId
  const socketUserMap = new Map<string, string>(); // socketId -> userId

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register active user session
    socket.on('user:register', async ({ userId }: { userId: string }) => {
      if (!userId) return;
      console.log(`Registering user socket: ${userId} -> ${socket.id}`);
      userSocketMap.set(userId, socket.id);
      socketUserMap.set(socket.id, userId);

      try {
        // Mark user as online in DB
        await User.findByIdAndUpdate(userId, { isOnline: true, lastActive: new Date() });
        // Broadcast status change globally
        io.emit('user:status', { userId, isOnline: true });
        console.log(`User ${userId} is now online`);
      } catch (err) {
        console.error(`Error registering user ${userId} presence:`, err);
      }
    });

    // Join room
    socket.on('join:conversation', ({ conversationId }: { conversationId: string }) => {
      if (!conversationId) return;
      console.log(`Socket ${socket.id} joining room: ${conversationId}`);
      socket.join(conversationId);
    });

    // Leave room
    socket.on('leave:conversation', ({ conversationId }: { conversationId: string }) => {
      if (!conversationId) return;
      console.log(`Socket ${socket.id} leaving room: ${conversationId}`);
      socket.leave(conversationId);
    });

    // Typing start
    socket.on('typing:start', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      socket.to(conversationId).emit('typing:start', { conversationId, userId });
    });

    // Typing stop
    socket.on('typing:stop', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      socket.to(conversationId).emit('typing:stop', { conversationId, userId });
    });

    // Read receipt
    socket.on('message:read', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      socket.to(conversationId).emit('message:read', { conversationId, userId });
    });

    // Direct Message router
    socket.on('message:send', (message) => {
      const { conversationId, senderId } = message;
      if (!conversationId) return;
      console.log(`Distributing message from ${senderId} to active participants`);
      
      // Emit 'message:received' directly to all online participants (excluding the sender's current socket connection)
      if (message.participants) {
        message.participants.forEach((participantId: string) => {
          const recipientSocketId = userSocketMap.get(participantId);
          if (recipientSocketId && recipientSocketId !== socket.id) {
            console.log(`Piping message to online participant socket: ${participantId} -> ${recipientSocketId}`);
            io.to(recipientSocketId).emit('message:received', message);
          }
        });
      }
    });

    // Disconnect cleanup
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const userId = socketUserMap.get(socket.id);
      if (userId) {
        userSocketMap.delete(userId);
        socketUserMap.delete(socket.id);

        try {
          const lastActive = new Date();
          // Mark user as offline
          await User.findByIdAndUpdate(userId, { isOnline: false, lastActive });
          // Broadcast status change globally
          io.emit('user:status', { userId, isOnline: false, lastActive });
          console.log(`User ${userId} is now offline`);
        } catch (err) {
          console.error(`Error setting user ${userId} offline:`, err);
        }
      }
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
