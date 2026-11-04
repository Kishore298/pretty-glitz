const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allows admin & customer frontend origins
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // Authentication handshake middleware
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      (socket.handshake.headers?.authorization &&
        socket.handshake.headers.authorization.split(' ')[1]);

    if (!token) {
      // Unauthenticated socket (e.g. public storefront client)
      socket.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      return next();
    } catch (err) {
      console.warn('[Socket.IO] Auth verification warning:', err.message);
      socket.user = null;
      return next(); // Still allow connection, but without elevated room privileges
    }
  });

  io.on('connection', (socket) => {
    // Join authenticated admin to admin room
    if (socket.user && socket.user.role === 'admin') {
      socket.join('room:admin');
      console.log(`[Socket.IO] Admin connected: ${socket.id} (User: ${socket.user.userId || socket.user.id})`);
    } else if (socket.user && socket.user.userId) {
      socket.join(`room:user_${socket.user.userId}`);
      console.log(`[Socket.IO] Customer connected: ${socket.id} (User: ${socket.user.userId})`);
    } else {
      socket.join('room:public');
      console.log(`[Socket.IO] Guest connected: ${socket.id}`);
    }

    socket.on('disconnect', (reason) => {
      // Clean disconnect
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet. Call initSocket first.');
  }
  return io;
};

// Safe helper to emit to all active admin panels
const emitToAdmin = (event, data) => {
  if (!io) {
    console.warn(`[Socket.IO] Cannot emit '${event}' - io is not initialized.`);
    return false;
  }
  io.to('room:admin').emit(event, data);
  return true;
};

// Safe helper to emit to a specific user
const emitToUser = (userId, event, data) => {
  if (!io || !userId) return false;
  io.to(`room:user_${userId}`).emit(event, data);
  return true;
};

module.exports = {
  initSocket,
  getIO,
  emitToAdmin,
  emitToUser,
};

