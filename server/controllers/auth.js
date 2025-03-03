const jwt = require('jsonwebtoken');
const User = require('../models/user');
const AUTH_ERROR_CODES = require('../config/authErrorCodes');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '4hr' }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'An account with this email already exists',
        code: AUTH_ERROR_CODES.EMAIL_EXISTS 
      });
    }

    // create the user
    const user = new User({ email, password, name });
    await user.save();

    // generate jwt 
    const tokens = generateTokens(user._id);

    // Set cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
      sameSite: 'lax',
      maxAge: 4* 60 * 60 * 1000 // 4hr
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isProfileComplete: user.isProfileComplete
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error creating account',
      code: AUTH_ERROR_CODES.SERVER_ERROR
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        message: 'No account found with this email',
        code: AUTH_ERROR_CODES.EMAIL_NOT_FOUND 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Invalid email or password',
        code: AUTH_ERROR_CODES.INVALID_CREDENTIALS 
      });
    }

    // Generate tokens
    const tokens = generateTokens(user._id);

    // Set cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
      sameSite: 'lax',
      maxAge: 4* 60 * 60 * 1000
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isProfileComplete: user.isProfileComplete,
        // spotify: user.spotify
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Internal server error',
      code: AUTH_ERROR_CODES.SERVER_ERROR
    });
  }
};

exports.logout = (req, res) => {
  // Clear access token being, being sure to use same settings  as when we set it 
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });

  // Clear refresh token with same options
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });

  res.json({ message: 'Logged out successfully' });
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ 
        message: 'No refresh token provided',
        code: AUTH_ERROR_CODES.NO_TOKEN 
      });
    }
    
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const tokens = generateTokens(decoded.userId);
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        // sameSite: 'strict',
        sameSite: 'lax',
        maxAge: 4* 60 * 60 * 1000
      });
      res.json({ message: 'Token refreshed successfully' });
    } catch (jwtError) {
      return res.status(401).json({ 
        message: 'Invalid or expired refresh token',
        code: AUTH_ERROR_CODES.REFRESH_TOKEN_EXPIRED
      });
    }

  } catch (error) {
    res.status(500).json({ 
      message: 'Error refreshing token',
      code: AUTH_ERROR_CODES.SERVER_ERROR
    });
  }
};

exports.checkStatus = async (req, res) => {
  try {
    // Since requireAuth middleware already verified the token,
    // we can fetch the full user data
    const user = await User.findById(req.user.id)
      .select('-password'); // exclude password

    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND'  
      });
    }

    // return with spotify connection status
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isProfileComplete: user.isProfileComplete,
        spotifyConnected: user.spotify?.isConnected || false,
      },
      tokens: {
        needsRefresh: false
      },
      spotify: user.spotify
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      message: 'Error checking auth status',
      code: 'STATUS_CHECK_ERROR'
    });  
  }
};

exports.storeSpotifyTokens = async (req, res) => {
  try {
    const { 
      // spotifyId,
      accessToken,
      refreshToken,
      expiresIn,
      scope
    } = req.body;
    
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

    await User.findByIdAndUpdate(req.user.id, {
      // 'spotify.id': spotifyId,
      'spotify.accessToken': accessToken,
      'spotify.refreshToken': refreshToken,
      'spotify.tokenExpiry': tokenExpiry,
      'spotify.lastRefreshed': new Date(),
      'spotify.scope': scope,
      'spotify.isConnected': true,
      'spotify.connectionError': null
    });

    res.json({ 
      message: 'Spotify tokens stored successfully',
      expires: tokenExpiry
    });
  } catch (error) {
    await User.findByIdAndUpdate(req.user.id, {
      'spotify.isConnected': false,
      'spotify.connectionError': error.message
    });
    res.status(500).json({ message: 'Failed to store Spotify tokens' });
  }
};

exports.updateSpotifyTokens = async (req, res) => {
  try {
    const { accessToken, expiresIn } = req.body;
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

    await User.findByIdAndUpdate(req.user.id, {
      'spotify.accessToken': accessToken,
      'spotify.tokenExpiry': tokenExpiry,
      'spotify.lastRefreshed': new Date(),
      'spotify.isConnected': true,
      'spotify.connectionError': null
    });

    res.json({ 
      message: 'Spotify tokens updated successfully',
      expires: tokenExpiry
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update Spotify tokens' });
  }
};

exports.getSpotifyTokens = async (req, res) => {
  try {
    // specifically select spotify fields with accessToken which is normally excluded
    const user = await User.findById(req.user.id)
      .select('+spotify.accessToken spotify.refreshToken spotify.tokenExpiry spotify.isConnected');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.spotify?.isConnected) {
      return res.status(404).json({ message: 'Spotify not connected' });
    }

    // Check if tokens exist
    if (!user.spotify.accessToken || !user.spotify.refreshToken) {
      return res.status(404).json({ message: 'Spotify tokens not found' });
    }

    return res.json({
      accessToken: user.spotify.accessToken,
      refreshToken: user.spotify.refreshToken,
      expiresAt: user.spotify.tokenExpiry.getTime(),
      isConnected: user.spotify.isConnected
    });
  } catch (error) {
    console.error('Get Spotify tokens error:', error);
    res.status(500).json({ message: 'Failed to get Spotify tokens' });
  }
};