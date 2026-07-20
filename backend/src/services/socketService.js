const jwt = require('jsonwebtoken');
const User = require('../models/User');

function getAuthenticatedSocket(userId) {
  return global.io?.sockets?.adapter?.rooms?.get(userId);
}

function initSocket(server) {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  global.io = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'garment_jwt_secret_key_2024');
      const user = await User.findById(decoded.id).select('-password -refreshToken');
      if (!user || !user.active) {
        return next(new Error('User not found or inactive'));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.email} (${socket.id})`);

    socket.join(socket.user._id.toString());

    if (['admin', 'manager'].includes(socket.user.role)) {
      socket.join('management');
    }

    if (socket.user.role === 'admin') {
      socket.join('admin');
    }

    if (socket.user.assignedLine) {
      socket.join(`line:${socket.user.assignedLine}`);
    }

    socket.on('join-line', (lineId) => {
      if (['admin', 'manager'].includes(socket.user.role)) {
        socket.join(`line:${lineId}`);
      }
    });

    socket.on('leave-line', (lineId) => {
      socket.leave(`line:${lineId}`);
    });

    socket.on('employee_action', (data) => {
      const { action, employeeId, details } = data;
      io.to('management').emit('employee_activity', {
        action,
        employeeId: employeeId || socket.user._id,
        time: new Date().toISOString(),
        details: details || {},
        employeeName: socket.user.profile?.firstName || 'Employee',
        employeeEmail: socket.user.email,
      });
      io.to('admin').emit('employee_activity', {
        action,
        employeeId: employeeId || socket.user._id,
        time: new Date().toISOString(),
        details: details || {},
        employeeName: socket.user.profile?.firstName || 'Employee',
        employeeEmail: socket.user.email,
      });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.email}`);
    });
  });

  return io;
}

function emitToUser(userId, event, data) {
  if (global.io) {
    global.io.to(userId.toString()).emit(event, data);
  }
}

function emitToRoom(room, event, data) {
  if (global.io) {
    global.io.to(room).emit(event, data);
  }
}

function emitToAll(event, data) {
  if (global.io) {
    global.io.emit(event, data);
  }
}

module.exports = { initSocket, emitToUser, emitToRoom, emitToAll };
