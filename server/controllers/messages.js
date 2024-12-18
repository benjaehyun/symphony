const Message = require('../models/message');
const Profile = require('../models/profile');

exports.getMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { lastId, limit = 50 } = req.query;
        
        // Build query
        const query = { roomId };
        if (lastId) {
            query._id = { $lt: lastId };
        }

        // Get messages with pagination
        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        // Check if there are more messages
        const hasMore = messages.length === parseInt(limit);

        res.json({
            messages: messages.reverse(), // Return in chronological order
            hasMore,
            lastId: messages[0]?._id // First message ID for backward pagination
        });

    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch messages',
            error: error.message 
        });
    }
};

exports.getConversationPreviews = async (req, res) => {
    try {
        const userProfile = await Profile.findOne({ user: req.user.id });
        if (!userProfile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Get all active match room IDs
        const roomIds = userProfile.matches
            .filter(match => match.status === 'active')
            .map(match => {
                const participants = [userProfile._id, match.matchedProfile].sort();
                return participants.join('_');
            });

        // Get last message for each room
        const lastMessages = await Message.aggregate([
            // Match messages from user's rooms
            { $match: { roomId: { $in: roomIds } } },
            // Group by roomId and get last message
            { 
                $group: {
                    _id: '$roomId',
                    lastMessage: { $last: '$$ROOT' }
                }
            }
        ]);

        res.json({ conversations: lastMessages });

    } catch (error) {
        console.error('Get conversation previews error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch conversation previews',
            error: error.message 
        });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { content, clientId } = req.body;

        const userProfile = await Profile.findOne({ user: req.user.id });
        if (!userProfile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Create message
        const message = await Message.create({
            roomId,
            senderId: userProfile._id,
            content,
            clientId,
            status: 'sent'
        });

        // Emit socket event if available
        if (req.io) {
            req.io.to(roomId).emit('message:receive', {
                roomId,
                message: message.toJSON()
            });
        }

        res.status(201).json({ message });

    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ 
            message: 'Failed to send message',
            error: error.message 
        });
    }
};

exports.markMessagesAsRead = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { messageIds } = req.body;

        const result = await Message.updateMany(
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

        // Emit socket event for read status
        if (req.io && result.modifiedCount > 0) {
            req.io.to(roomId).emit('message:read_status', {
                roomId,
                messageIds,
                readAt: new Date()
            });
        }

        res.json({ 
            success: true,
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Mark messages read error:', error);
        res.status(500).json({ 
            message: 'Failed to mark messages as read',
            error: error.message 
        });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const userProfile = await Profile.findOne({ user: req.user.id });
        if (!userProfile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        const roomIds = userProfile.matches
            .filter(match => match.status === 'active')
            .map(match => {
                const participants = [userProfile._id, match.matchedProfile].sort();
                return participants.join('_');
            });

        // Count distinct rooms with unread messages
        const unreadConversations = await Message.aggregate([
            {
                $match: {
                    roomId: { $in: roomIds },
                    senderId: { $ne: userProfile._id },
                    status: { $ne: 'read' }
                }
            },
            {
                $group: {
                    _id: '$roomId'
                }
            }
        ]);

        res.json({ unreadCount: unreadConversations.length });

    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch unread count',
            error: error.message 
        });
    }
};