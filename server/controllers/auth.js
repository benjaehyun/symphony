const jwt = require('jsonwebtoken');
const User = require('../models/user');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
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

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create new user
    const user = new User({ email, password, name });
    await user.save();

    // Generate tokens
    const tokens = generateTokens(user._id);

    // Set cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
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
    res.status(500).json({ message: 'Error creating user' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const tokens = generateTokens(user._id);

    // Set cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isProfileComplete: user.isProfileComplete
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const tokens = generateTokens(decoded.userId);

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

exports.storeSpotifyTokens = async (req, res) => {
  try {
    const { 
      spotifyId,
      accessToken,
      refreshToken,
      expiresIn,
      scope
    } = req.body;
    
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

    await User.findByIdAndUpdate(req.user.id, {
      'spotify.id': spotifyId,
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