// // models/Message.js
// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const MessageSchema = new Schema({
//   conversationId: {
//     type: Schema.Types.ObjectId,
//     ref: 'Conversation',
//     required: true
//   },
//   senderId: {
//     type: Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   content: {
//     type: String,
//     required: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model('Message', MessageSchema);



// In your models/Message.js file

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'document','audio'], // 'image', 'video', 'document'
      required: true
    },
    url: {
      type: String,
      required: true
    },
    thumbnail: String, // For videos
    duration: Number,
    filename: String, // Original filename
    size: Number // File size in bytes
  }],
  // Add post reference for shared posts
  postReference: {
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    imageUrl: String,
    caption: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    userProfilePic: String
  },
  read: {
    type: Boolean,
    default: false
  },
  reactions: {
    type: Map,
    of: String,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);