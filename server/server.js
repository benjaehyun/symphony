const express = require('express');
const setupSocketIO = require('./middleware/socket');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { errorHandler } = require('./middleware/error');
const cookieParser = require('cookie-parser');
const logger = require('morgan');


// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger('dev'));


// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));



// Production setup
if (process.env.SERVER_NODE_ENV === 'production') {
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../client/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}


const PORT = process.env.SERVER_PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Socket.IO setup
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Routes (to be added)
app.use(setupSocketIO(io));

app.use(cookieParser());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profiles', require('./routes/profile'));
app.use('/api/discovery', require('./routes/discovery'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/messages', require('./routes/messages'));
app.use(errorHandler);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  errorHandler(err, req, res, next);
});

// Socket connection handling
// io.on('connection', (socket) => {
//   console.log('A user connected');
  
//   socket.on('disconnect', () => {
//     console.log('User disconnected');
//   });
  
//   // Socket event handlers will be added here
// });
// io.on('connection', (socket) => {
//   // Authenticate socket connection
//   socket.on('authenticate', (userId) => {
//     socket.join(userId); // Join user's room
//   });

//   // Socket config for messaging
//   socket.on('join:match', (matchId) => {
//     socket.join(matchId);
//   });
  
//   socket.on('leave:match', (matchId) => {
//     socket.leave(matchId);
//   });
  
//   // Handle disconnection
//   socket.on('disconnect', () => {
//     // Cleanup if needed
//   });
// });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // In production, you might want to crash the server to let your process manager restart it
  if (process.env.SERVER_NODE_ENV === 'production') {
    server.close(() => process.exit(1));
  }
});

module.exports = { app, server, io }; // Export for testing purposes