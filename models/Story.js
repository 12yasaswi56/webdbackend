const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  media: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    default: ''
  },
  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Stories automatically expire after 24 hours
  expiresAt: {
    type: Date,
    default: function() {
      const date = new Date();
      date.setHours(date.getHours() + 24);
      return date;
    }
  }
}, {
  timestamps: true
});

// Index to automatically remove expired stories
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', StorySchema);