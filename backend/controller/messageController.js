const CommunityModel = require('../schema/communitySchema');
const MessageModel = require('../schema/messageSchema');
const mongoose = require('mongoose');

exports.createMessage = async (req, res) => {
    try {
        const { text, replyTo } = req.body;
        const userId = req.user.id;

        const community = await CommunityModel.findById(req.params.communityId);
        const member = community.members.find(m => m.user.toString() === userId);
        if (!member) return res.status(403).json({ message: "Not a community member" });

        const newMessage = await MessageModel.create({
            community: community._id,
            sender: userId,
            role: member.role,
            text,
            replyTo: replyTo || null
        });
        res.status(200).json(newMessage);
    } catch (error) {
        console.error("Error creating message:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

exports.getMessagesByCommunity = async (req, res) => {
    try {
        const communityId = req.params.communityId;
        if (!mongoose.Types.ObjectId.isValid(communityId)) {
            return res.status(400).json({ message: "Invalid community ID" });
        }

        const community = await CommunityModel.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }
        const messages = await MessageModel.find({ community: communityId })
            .populate('sender', 'name profilePicture')
            .populate('replyTo', 'text sender')
            .sort({ createdAt: -1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
