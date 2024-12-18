const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const Message = require('../models/message');
const Profile = require('../models/profile');

const setupSocketIO = (io) => {
  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) throw new Error('No cookies found');
      
      const cookies = cookie.parse(cookieHeader);
      const token = cookies.accessToken;
      if (!token) throw new Error('No token found');
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId);

    socket.on('user:identify', ({ userId }) => {
      // Join user-specific room
      socket.join(`user:${userId}`);
    });

    // Room management - keep existing
    socket.on('room:join', ({ roomId }) => {
      socket.join(roomId);
      console.log(`User ${socket.userId} joined room ${roomId}`);
    });

    socket.on('room:leave', ({ roomId }) => {
      socket.leave(roomId);
      console.log(`User ${socket.userId} left room ${roomId}`);
    });

    // Enhanced message handling
    socket.on('message:send', async ({ roomId, content, senderId, clientId }) => {
      try {
        // Check for existing message with clientId first
        const existingMessage = await Message.findOne({ clientId });
        if (existingMessage) {
          return socket.emit('message:receive', {
            roomId,
            message: existingMessage.toJSON()
          });
        }
        // Create new message
        const message = await Message.create({
          roomId,
          senderId,
          content,
          clientId,
          status: 'sent'
        });

        // Broadcast to room
        io.to(roomId).emit('message:receive', {
          roomId,
          message: message.toJSON()
        });

        // If recipient is online, mark as delivered immediately
        const recipientSocket = Object.values(io.sockets.sockets).find(s => 
          s.userId !== senderId && s.rooms.has(roomId)
        );

        if (recipientSocket) {
          message.status = 'delivered';
          message.deliveredAt = new Date();
          await message.save();

          // Emit delivery confirmation
          io.to(roomId).emit('message:delivered', {
            roomId,
            messageId: message._id,
            deliveredAt: message.deliveredAt
          });
        }

      } catch (error) {
        console.error('Message save error:', error);
        socket.emit('message:error', { 
          error: 'Failed to send message',
          clientId 
        });
      }
    });

    // Handle message delivery confirmation
    socket.on('message:delivery_confirm', async ({ roomId, messageId }) => {
      try {
        const message = await Message.findById(messageId);
        if (message && message.status === 'sent') {
          message.status = 'delivered';
          message.deliveredAt = new Date();
          await message.save();

          io.to(roomId).emit('message:delivered', {
            roomId,
            messageId: message._id,
            deliveredAt: message.deliveredAt
          });
        }
      } catch (error) {
        console.error('Delivery confirmation error:', error);
      }
    });

    // Handle read status
    socket.on('message:read', async ({ roomId, messageIds }) => {
      try {
        const messages = await Message.updateMany(
          {
            _id: { $in: messageIds },
            roomId,
            status: { $ne: 'read' }
          },
          {
            $set: { 
              status: 'read',
              readAt: new Date()
            }
          }
        );

        if (messages.modifiedCount > 0) {
          io.to(roomId).emit('message:read_status', {
            roomId,
            messageIds,
            readAt: new Date()
          });
        }
      } catch (error) {
        console.error('Read status update error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userId);
    });
  });

  return (req, res, next) => {
    req.io = io;
    next();
  };
};

module.exports = setupSocketIO;
