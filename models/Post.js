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
  description: String,  // Added for research paper description
  image: String,  // This will store the path to the file (image or PDF)
  fileType: { type: String, enum: ['image', 'pdf'], default: 'image' }, // To distinguish between images and PDFs
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [CommentSchema],
  shares: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    shareType: String,
    createdAt: { type: Date, default: Date.now }
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







