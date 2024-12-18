const Profile = require('../models/profile');

exports.getMatches = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const userProfile = await Profile.findOne({ user: req.user.id })
      .populate({
        path: 'matches.matchedProfile',
        select: 'name photos music.analysis music.sourceType age bio'
      })
      .select('matches');

    if (!userProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Get paginated matches
    const matches = userProfile.matches
      .sort((a, b) => b.matchedAt - a.matchedAt)
      .slice(skip, skip + limit);

    const totalMatches = userProfile.matches.length;
    const hasMore = skip + limit < totalMatches;

    res.json({
      matches,
      page,
      totalMatches,
      hasMore
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'Failed to fetch matches' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userProfile = await Profile.findOne({ user: req.user.id });
    
    if (!userProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    const unreadCount = userProfile.matches.filter(match => !match.isRead).length;
    
    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
};

exports.markMatchesAsRead = async (req, res) => {
  try {
    const { matchIds } = req.body;
    
    const userProfile = await Profile.findOne({ user: req.user.id });
    if (!userProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Update isRead status for specified matches
    matchIds.forEach(matchId => {
      const match = userProfile.matches.id(matchId);
      if (match) {
        match.isRead = true;
      }
    });

    await userProfile.save();

    const unreadCount = userProfile.matches.filter(match => !match.isRead).length;

    // // socket event for read status update
    // req.io.to(req.user.id).emit('match:read', { 
    //   matchIds,
    //   unreadCount 
    // });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark matches as read error:', error);
    res.status(500).json({ message: 'Failed to mark matches as read' });
  }
};

exports.unmatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const userProfile = await Profile.findOne({ user: req.user.id });
    if (!userProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Find and remove the match
    const match = userProfile.matches.id(matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Also remove the match from the other user's profile
    await Profile.updateOne(
      { _id: match.matchedProfile },
      { $pull: { matches: { matchedProfile: userProfile._id } } }
    );

    // Remove match from current user's profile
    userProfile.matches.pull(matchId);
    await userProfile.save();

    // Emit socket event for unmatch
    req.io.to(match.matchedProfile.toString()).emit('match:unmatch', {
      matchId,
      profileId: userProfile._id
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Unmatch error:', error);
    res.status(500).json({ message: 'Failed to unmatch' });
  }
};