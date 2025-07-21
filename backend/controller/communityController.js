const CommunityModel = require('../schema/communitySchema');

exports.getCommunities = async (req, res) => {
    const userId = req.user.id;
    try {
        const communities = await CommunityModel.find({
            members: { $elemMatch: { user: userId } }
        }).populate('event', 'title image').populate('members.user'); 

        res.status(200).json({ message: "Communities fetched successfully", communities });
    } catch (error) {
        console.error("Get Communities Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}