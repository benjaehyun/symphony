const jwt = require('jsonwebtoken');

exports.requireAuth = async (req, res, next) => {
  // console.log('=== requireAuth Middleware Start ===');
  // console.log('Headers:', req.headers);
  // console.log('Cookies:', req.cookies);
  
  try {
    const token = req.cookies.accessToken;
    // console.log('Access Token from cookies:', token ? 'Present' : 'Missing');
    
    if (!token) {
      console.log('No access token found in cookies');
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    try {
      // console.log('Attempting to verify token...');
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      // console.log('Token decoded successfully:', {
      //   userId: decoded.userId,
      //   iat: decoded.iat,
      //   exp: decoded.exp,
      //   timeLeft: decoded.exp ? `${(decoded.exp * 1000 - Date.now()) / 1000} seconds` : 'N/A'
      // });

      req.user = { id: decoded.userId };
      // console.log('User attached to request:', req.user);
      // console.log('=== requireAuth Middleware Success ===');
      next();
    } catch (jwtError) {
      console.error('JWT Verification Error:', {
        name: jwtError.name,
        message: jwtError.message,
        expiredAt: jwtError.expiredAt
      });

      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
          expiredAt: jwtError.expiredAt
        });
      }
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
        error: jwtError.message
      });
    }
  } catch (error) {
    console.error('General Auth Middleware Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return res.status(500).json({ 
      message: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};

// Optional auth middleware - doesn't require auth but will attach user if token exists
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = { id: decoded.userId };
    }
    next();
  } catch (error) {
    // Continue without setting user
    next();
  }
};