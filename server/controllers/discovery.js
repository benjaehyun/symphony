const Profile = require('../models/profile');
const { calculateCompatibilityScore } = require('../utils/matchingAlgorithm');
const { generateRoomId } = require('../utils/roomID');

exports.getDiscoveryProfiles = async (req, res) => {
    try {
        const userProfile = await Profile.findOne({ user: req.user.id });
        
        if (!userProfile) {
            return res.status(404).json({ message: 'Profile not found' });
        }
    
        // Get profiles based on preferences, excluding:
        // - Own profile
        // - Already liked profiles
        // - Already disliked profiles
        // - Already matched profiles
        const excludedProfiles = [
            userProfile._id,
            ...userProfile.likes,
            ...userProfile.dislikes,
            ...userProfile.matches
        ];
    
        const query = {
            _id: { $nin: excludedProfiles },
            status: 'COMPLETED',
            age: { 
            $gte: userProfile.preferences.ageRange.min,
            $lte: userProfile.preferences.ageRange.max
            },
            gender: { $in: userProfile.preferences.genderPreference }
        };
    
        // Add cursor-based pagination w lastId, if necessary
        if (req.query.lastId) {
          query._id = { 
              ...query._id,
              $lt: mongoose.Types.ObjectId(req.query.lastId)  // Convert to ObjectId
          };
        }
    
        // Get batch of potential matches
        const batchSize = 10;
        let profiles = await Profile.find(query)
            .select('-music.tracks') // Exclude full track data for efficiency
            .sort({ _id: -1 }) // Ensure consistent ordering for pagination
            .limit(batchSize + 1);

        const hasMore = profiles.length > batchSize;
        if (hasMore) {
            profiles = profiles.slice(0, batchSize); // Remove the extra profile
        }
    
        // If no profiles found, return 
        if (!profiles.length) {
            return res.json({
            profiles: [],
            hasMore: false,
            status: 'NO_PROFILES',
            message: 'No more profiles available'
            });
        }
    
        // Calculate compatibility scores
        const scoredProfiles = await Promise.all(
          profiles.map(async (profile) => {
            // console.log('prescored profile', profile.music.analysis.genreDistribution);
            const compatibilityScore = await calculateCompatibilityScore(userProfile, profile);
            const profileObj = profile.toObject();
            
            // Convert Map to plain object if it exists
            if (profileObj.music?.analysis?.genreDistribution instanceof Map) {
              profileObj.music.analysis.genreDistribution = Object.fromEntries(
                profileObj.music.analysis.genreDistribution
              );
            }
            
            return {
              ...profileObj,
              compatibilityScore
            };
          })
        );
    
        // Sort by compatibility score
        scoredProfiles.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
        res.json({
            profiles: scoredProfiles,
            hasMore,
            lastId: profiles[profiles.length - 1]?._id,
            status: 'SUCCESS'
        });
  
    } catch (error) {
        console.error('Discovery profiles error:', error);
        res.status(500).json({ 
            status: 'ERROR',
            message: 'Failed to fetch discovery profiles',
            error: error.message 
        });
    }
};

exports.likeProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const userProfile = await Profile.findOne({ user: req.user.id });

    if (!userProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Check if already liked
    if (userProfile.likes.includes(profileId)) {
      return res.json({ match: false, alreadyLiked: true });
    }

    // Add to likes
    userProfile.likes.push(profileId);

    // Check for mutual like (match)
    const otherProfile = await Profile.findById(profileId);
    if (otherProfile.likes.includes(userProfile._id)) {
      // Create match objects for both users
      const currentUserMatch = {
        matchedProfile: profileId,
        matchedAt: new Date(),
        isRead: false,
        status: 'active'
      };

      const otherUserMatch = {
        matchedProfile: userProfile._id,
        matchedAt: new Date(),
        isRead: false,
        status: 'active'
      };
      

      userProfile.matches.push(currentUserMatch);
      otherProfile.matches.push(otherUserMatch);

      await Promise.all([userProfile.save(), otherProfile.save()]);

      const savedCurrentUserMatch = userProfile.matches[userProfile.matches.length - 1];
      console.log('currentusermatch', savedCurrentUserMatch._id)
      const savedOtherUserMatch = otherProfile.matches[otherProfile.matches.length - 1];
      console.log('otherusermatch', savedOtherUserMatch._id)

      const userUnreadCount = userProfile.matches.filter(m => !m.isRead).length;
      const otherUnreadCount = otherProfile.matches.filter(m => !m.isRead).length;

      const roomId = generateRoomId(userProfile._id, otherProfile._id);
      // Emit socket events for both users
      // req.io.to(userProfile.user.toString()).emit('match:new', {
      //   matchId: currentUserMatch._id,
      //   match: {
      //     _id: otherProfile._id,
      //     name: otherProfile.name,
      //     photos: otherProfile.photos,
      //     music: {
      //       analysis: otherProfile.music.analysis,
      //       sourceType: otherProfile.music.sourceType
      //     }
      //   },
      //   unreadCount: userUnreadCount
      // });

      // req.io.to(otherProfile.user.toString()).emit('match:new', {
      //   matchId: otherUserMatch._id,
      //   match: {
      //     _id: userProfile._id,
      //     name: userProfile.name,
      //     photos: userProfile.photos,
      //     music: {
      //       analysis: userProfile.music.analysis,
      //       sourceType: userProfile.music.sourceType
      //     }
      //   },
      //   unreadCount: otherUnreadCount
      // });

      // req.io.to(`user:${userProfile._id}`).emit('match:new', {
      //   // match: currentUserMatch,
      //   match: userProfile,
      //   roomId,
      //   unreadCount: userUnreadCount
      // });

      // req.io.to(`user:${otherProfile._id}`).emit('match:new', {
      //   // match: otherUserMatch,
      //   match: otherProfile,
      //   roomId,
      //   unreadCount: otherUnreadCount
      // });
      req.io.to(`user:${userProfile._id}`).emit('match:new', {
        matchId: savedCurrentUserMatch._id, 
        match: {
          _id: otherProfile._id,
          name: otherProfile.name,
          photos: otherProfile.photos,
          music: {
            analysis: otherProfile.music.analysis,
            sourceType: otherProfile.music.sourceType
          },
          age: otherProfile.age,
          bio: otherProfile.bio
        },
        roomId,
        unreadCount: userUnreadCount
      });

      req.io.to(`user:${otherProfile._id}`).emit('match:new', {
        matchId: savedOtherUserMatch._id, 
        match: {
          _id: userProfile._id,
          name: userProfile.name,
          photos: userProfile.photos,
          music: {
            analysis: userProfile.music.analysis,
            sourceType: userProfile.music.sourceType
          },
          age: userProfile.age,
          bio: userProfile.bio
        },
        roomId,
        unreadCount: otherUnreadCount
      });
      
      // Return match data
      return res.json({ 
        match: true, 
        matchId: savedCurrentUserMatch._id,
        matchedProfile: {
          _id: otherProfile._id,
          name: otherProfile.name,
          photos: otherProfile.photos,
          music: {
            analysis: otherProfile.music.analysis,
            sourceType: otherProfile.music.sourceType
          }
        }
      });
    }

    await userProfile.save();
    res.json({ match: false });
  } catch (error) {
    console.error('Like profile error:', error);
    res.status(500).json({ message: 'Failed to like profile' });
  }
};

exports.dislikeProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const userProfile = await Profile.findOne({ user: req.user.id });

    if (!userProfile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Check if already disliked
    if (userProfile.dislikes.includes(profileId)) {
      return res.json({ alreadyDisliked: true });
    }

    // Add to dislikes
    userProfile.dislikes.push(profileId);
    await userProfile.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Dislike profile error:', error);
    res.status(500).json({ message: 'Failed to dislike profile' });
  }
};