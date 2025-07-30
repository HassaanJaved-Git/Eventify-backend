// const mongoose = require("mongoose");

// const communitySchema = new mongoose.Schema({
//   event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
//   members: [{
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     role: { type: String, enum: ['attendee', 'organizer'], default: 'attendee' }
//   }]
// }, { timestamps: true });


// const CommunityModel = mongoose.model("Community", communitySchema);
// module.exports = CommunityModel;

const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  members: {
    type: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['attendee', 'organizer'], default: 'attendee' }
    }],
    default: [] // ✅ This is the fix!
  }
}, { timestamps: true });

const CommunityModel = mongoose.model("Community", communitySchema);
module.exports = CommunityModel;
