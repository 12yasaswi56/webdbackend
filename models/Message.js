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
  // Add post reference for shared posts
  postReference: {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post'
    },
    imageUrl: String,
    caption: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);