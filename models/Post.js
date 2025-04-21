// const mongoose = require("mongoose");

// const CommentSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   content: String,
//   createdAt: { type: Date, default: Date.now }
// });

// const PostSchema = new mongoose.Schema({
//   user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//   caption: String,
//   image: String,
//   likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//   comments: [CommentSchema], // Add this field
//   shares: [{ 
//     user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//     shareType: String,
//     createdAt: { type: Date, default: Date.now }
//   }], // Optional: track shares
//   createdAt: { type: Date, default: Date.now }
// });

// // Your existing pre-save middleware
// PostSchema.pre("save", function(next) {
//   if (this.userId && !this.user) {
//     this.user = this.userId;
//   }
//   next();
// });

// module.exports = mongoose.model("Post", PostSchema);





const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: String,
  createdAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  caption: String,
  title: String,  // Added for research paper title
  description: String, 
   // Added for research paper description
   image: String,
  images: [{ type: String }], // Array of image URLs // This will store the path to the file (image or PDF)
  fileType: { type: String, enum: ['image', 'pdf'], default: 'image' }, // To distinguish between images and PDFs
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [CommentSchema],
  taggedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // This allows population
    // populate: {
    //   select: 'username profilePic' // Specify which user fields to include
    // }
  }],
  shares: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    shareType: String,
    createdAt: { type: Date, default: Date.now }
  }],
  location: {
    name: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  media: [{
    url: String,
    type: { type: String, enum: ['image', 'pdf'] }
  }],
  createdAt: { type: Date, default: Date.now }
});

// Your existing pre-save middleware
PostSchema.pre("save", function(next) {
  if (this.userId && !this.user) {
    this.user = this.userId;
  }
  next();
});

module.exports = mongoose.model("Post", PostSchema);







