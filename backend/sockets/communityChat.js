const jwt = require('jsonwebtoken');
const CommunityModel = require('../schema/communitySchema');
const MessageModel = require('../schema/messageSchema');


module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log('✅ New client connected');

    // Authenticate user
    socket.on('join_community', async ({ token, communityId }) => {
      try {
        const decoded = jwt.verify(token, process.env.JWTuserSecretKEY);
        const userId = decoded.id;

        const community = await CommunityModel.findById(communityId);
        const isMember = community.members.some(m => m.user.toString() === userId);
        if (!isMember) return socket.emit('error', 'Not a member of the community');

        // Join Socket.IO room
        socket.join(communityId);
        socket.data = { userId, communityId };

        console.log(`User ${userId} joined community ${communityId}`);
        socket.emit('joined_community', { communityId });
      } catch (err) {
        socket.emit('error', 'Unauthorized');
      }
    });

    // Handle new messages
    socket.on('send_message', async ({ text, replyTo = null }) => {
      const { userId, communityId } = socket.data || {};
      if (!userId || !communityId) return;

      const community = await CommunityModel.findById(communityId);
      const member = community.members.find(m => m.user.toString() === userId);
      if (!member) return;

      const message = await MessageModel.create({
        community: communityId,
        sender: userId,
        role: member.role,
        text,
        replyTo
      });

      io.to(communityId).emit('new_message', {
        _id: message._id,
        text: message.text,
        sender: userId,
        role: member.role,
        replyTo,
        createdAt: message.createdAt
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ Client disconnected');
    });
  });
};

