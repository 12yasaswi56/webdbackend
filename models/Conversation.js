// models/Conversation.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConversationSchema = new Schema({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    default: ''
  },
  groupAdmin: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  groupImage: {
    type: String,
    default: ''
  },
  groupTheme: {
    type: String,
    default: '#1976d2' // Default blue color
  },
  latestMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
},
  {
    timestamps: true,
    strictPopulate: false // Add this to prevent the strict populate error
});

module.exports = mongoose.model('Conversation', ConversationSchema);

