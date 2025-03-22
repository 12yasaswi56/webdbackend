// const express = require("express");
// const Post = require("../models/Post");
// const User = require("../models/User"); // Ensure you have a User model
// const multer = require("multer");
// const Notification = require("../models/Notification");
// const path = require("path");
// const fs = require("fs");

// const router = express.Router();



// // Create uploads directory if it doesn't exist
// const uploadDir = path.join(__dirname, "../uploads");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Set up storage with the correct path
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);  // Use the absolute path defined earlier
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });

// // File filter to only accept images
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image/')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed!'), false);
//   }
// };

// const upload = multer({ 
//   storage, 
//   fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
// });

// // ✅ **Get All Posts with User Details**
// router.get("/", async (req, res) => {
//   try {
//     const posts = await Post.find()
//     .populate("user", "username profilePic") // Populate the post creator
//     .populate({
//       path: "comments.user", // Populate the user field inside comments
//       select: "username profilePic" // Select only these fields
//     })
//     .sort({ createdAt: -1 });

//     res.json(posts);
//   } catch (error) {
//     console.error("Error fetching posts:", error);
//     res.status(500).json({ error: "Error fetching posts" });
//   }
// });


// // Add this to your posts.js router file

// // Get posts by user ID
// router.get("/user/:userId", async (req, res) => {
//   try {
//     const userId = req.params.userId;
    
//     // Find posts by this user, sort by newest first
//     const posts = await Post.find({ user: userId })
//       .populate("user", "username profilePic") // Populate the post creator
//       .populate({
//         path: "comments.user", // Populate the user field inside comments
//         select: "username profilePic" // Select only these fields
//       })
//       .sort({ createdAt: -1 });
    
//     res.json(posts);
//   } catch (error) {
//     console.error("Error fetching user posts:", error);
//     res.status(500).json({ error: "Error fetching user posts", details: error.message });
//   }
// });

// // ✅ **Upload a Post**
// router.post("/upload", upload.single("file"), async (req, res) => {
//   const { caption, userId } = req.body;

//   if (!userId) {
//     return res.status(400).json({ error: "User ID is required" });
//   }

//   try {
//     // Check if the user exists
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Log request data for debugging
//     console.log("Upload request body:", req.body);
//     console.log("Upload file:", req.file);

//     // Determine image path
//     let imagePath;
//     if (req.file) {
//       imagePath = `/uploads/${req.file.filename}`;
//     } else if (req.body.image) {
//       imagePath = req.body.image;
//     } else {
//       return res.status(400).json({ error: "Image is required" });
//     }

//     // Create and save post - use the same field names as in your schema
//     const newPost = new Post({
//       user: userId,
//       caption: caption || "",  // Match schema field names
//       image: imagePath,        // Match schema field names
//       likes: []
//     });

//     const savedPost = await newPost.save();

//     res.status(201).json({
//       message: "Post uploaded successfully",
//       post: {
//         _id: savedPost._id,
//         user: savedPost.user,
//         caption: savedPost.caption,
//         image: savedPost.image,
//         likes: savedPost.likes,
//         createdAt: savedPost.createdAt,
//       }
//     });
//   } catch (error) {
//     console.error("Error uploading post:", error);
//     res.status(500).json({ error: "Error uploading post", details: error.message });
//   }
// });

// // ✅ **Like / Unlike a Post**
// // Add to your POST routes for likes:
// router.post("/:postId/like", async (req, res) => {
//   try {
//     const { userId } = req.body;
//     if (!userId) {
//       return res.status(400).json({ error: "User ID is required" });
//     }

//     const post = await Post.findById(req.params.postId);
//     if (!post) {
//       return res.status(404).json({ error: "Post not found" });
//     }

//     // Toggle like behavior
//     const index = post.likes.indexOf(userId);
//     let action;
//     if (index === -1) {
//       post.likes.push(userId);
//       action = 'liked';
//     } else {
//       post.likes.splice(index, 1);
//       action = 'unliked';
//     }

//     await post.save();
    
//     // Get user info for real-time update
//     const user = await User.findById(userId).select('username profilePic');
    
//     // Emit socket event for real-time updates
//     const io = req.app.get('io');
//     io.to(`post:${post._id}`).emit('postLikeUpdate', {
//       postId: post._id,
//       likes: post.likes,
//       latestActivity: {
//         user: {
//           _id: userId,
//           username: user.username,
//           profilePic: user.profilePic
//         },
//         action: action,
//         timestamp: new Date()
//       }
//     });

//     res.json({ 
//       message: `Post ${action}!`,
//       likes: post.likes.length 
//     });
//   } catch (error) {
//     console.error("Error handling like:", error);
//     res.status(500).json({ error: "Error handling like", details: error.message });
//   }
// });





// //commen
// router.post("/:postId/comment", async (req, res) => {
//   try {
//     const { userId, content } = req.body;
    
//     if (!userId || !content) {
//       return res.status(400).json({ error: "User ID and comment content are required" });
//     }
    
//     const post = await Post.findById(req.params.postId);
//     if (!post) {
//       return res.status(404).json({ error: "Post not found" });
//     }
    
//     // Get user info first
//     const user = await User.findById(userId).select('username profilePic');
//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }
    
//     // Create and add the comment to the post
//     const newComment = {
//       user: userId,
//       content,
//       createdAt: new Date()
//     };
    
//     // Push the comment to the array
//     post.comments.push(newComment);
    
//     // Save the updated post
//     await post.save();
    
//     const io = req.app.get('io');
//     io.to(`post:${post._id}`).emit('newComment', {
//       postId: post._id,
//       comment: {
//         ...newComment,
//         user: {
//           _id: user._id,
//           username: user.username,
//           profilePic: user.profilePic
//         }
//       }
//     });
    
//     res.status(201).json({
//       message: "Comment added successfully",
//       comment: {
//         ...newComment,
//         user: {
//           _id: user._id, 
//           username: user.username,
//           profilePic: user.profilePic
//         }
//       }
//     });
//   } catch (error) {
//     console.error("Error adding comment:", error);
//     res.status(500).json({ error: "Error adding comment", details: error.message });
//   }
// });

// // Add share functionality
// router.post("/:postId/share", async (req, res) => {
//   try {
//       const { userId, shareType = 'internal' } = req.body;

//       if (!userId) {
//           return res.status(400).json({ error: "User ID is required" });
//       }

//       const post = await Post.findById(req.params.postId).populate('user'); // populate the user who created the original post
//       if (!post) {
//           return res.status(404).json({ error: "Post not found" });
//       }

//       const newShare = {
//           user: userId,
//           shareType,
//           createdAt: new Date()
//       };

//       post.shares.push(newShare);
//       await post.save();

//       const user = await User.findById(userId).select('username profilePic followers'); //get the user who shared the post, and that user followers.

//       const io = req.app.get('io');
//       io.to(`post:${post._id}`).emit('postShared', {
//           postId: post._id,
//           shareInfo: {
//               user: {
//                   _id: user._id,
//                   username: user.username,
//                   profilePic: user.profilePic
//               },
//               shareType,
//               timestamp: new Date()
//           }
//       });

//       io.to(`user:${userId}`).emit('userPostShared', {
//           postId: post._id,
//           user: {
//               _id: user._id,
//               username: user.username,
//               profilePic: user.profilePic
//           }
//       });

//       // Broadcast to followers of the user who shared the post.
//       if (user.followers && user.followers.length > 0) {
//           user.followers.forEach(followerId => {
//               io.to(`user:${followerId}`).emit('newSharedPost', {
//                   postId: post._id,
//                   sharedBy: {
//                       _id: user._id,
//                       username: user.username,
//                       profilePic: user.profilePic
//                   },
//                   originalPoster:{
//                       _id: post.user._id,
//                       username: post.user.username,
//                       profilePic: post.user.userPic
//                   }
//               });
//           });
//       }

//       res.json({
//           message: "Post shared successfully",
//           share: newShare
//       });
//   } catch (error) {
//       console.error("Error sharing post:", error);
//       res.status(500).json({ error: "Error sharing post", details: error.message });
//   }
// });

// // ✅ **Delete a Post**
// router.delete("/:postId", async (req, res) => {
//   try {
//     const { userId } = req.body;
//     if (!userId) {
//       return res.status(400).json({ error: "User ID is required" });
//     }

//     const post = await Post.findById(req.params.postId);
//     if (!post) {
//       return res.status(404).json({ error: "Post not found" });
//     }

//     if (post.user.toString() !== userId) {
//       return res.status(403).json({ error: "Unauthorized: You can only delete your own posts" });
//     }

//     await Post.findByIdAndDelete(req.params.postId);
//     res.json({ message: "Post deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting post:", error);
//     res.status(500).json({ error: "Error deleting post", details: error.message });
//   }
// });

// // ✅ **Handle multer errors**
// router.use((err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     return res.status(400).json({ error: err.message });
//   } else if (err) {
//     return res.status(500).json({ error: err.message });
//   }
//   next();
// });





// router.get("/:postId", async (req, res) => {
//   try {
//     const { postId } = req.params;

//     const post = await Post.findById(postId)
//       .populate("user", "username profilePic") // Populate post owner
//       .populate({
//         path: "comments.user", // Populate user details inside comments
//         select: "username profilePic",
//       })
//       .populate("comments", "content"); // ✅ Populate comment text too

//     if (!post) {
//       return res.status(404).json({ error: "Post not found" });
//     }

//     res.json(post);
//   } catch (error) {
//     console.error("Error fetching post:", error);
//     res.status(500).json({ error: "Error fetching post", details: error.message });
//   }
// });



// // ✅ Like a Post with Real-time Notification
// router.post("/:postId/like", async (req, res) => {
//   try {
//       const { userId } = req.body;
//       if (!userId) return res.status(400).json({ error: "User ID is required" });

//       const post = await Post.findById(req.params.postId).populate("user");
//       if (!post) return res.status(404).json({ error: "Post not found" });

//       const index = post.likes.indexOf(userId);
//       let action;
//       if (index === -1) {
//           post.likes.push(userId);
//           action = "liked";
//       } else {
//           post.likes.splice(index, 1);
//           action = "unliked";
//       }

//       await post.save();

//       // ✅ Get `sendNotification` inside the route
//       const io = req.app.get("io");
//       const sendNotification = req.app.get("sendNotification");

//       // ✅ Only send notification if the action is "liked"
//       if (action === "liked") {
//           // Get the sender's info including profile pic
//           const sender = await User.findById(userId).select("username profilePic");
          
//           // Before creating a new notification, check if a similar one exists recently
//           const existingNotification = await Notification.findOne({
//               userId: post.user._id,
//               senderId: userId,
//               message: "liked your post",
//               createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) } // Within last 5 minutes
//           });

//           if (!existingNotification) {
//               const notification = new Notification({
//                   userId: post.user._id,
//                   senderId: userId,
//                   message: "liked your post",
//                   senderPic: sender.profilePic
//               });
//               await notification.save();
              
//               sendNotification(post.user._id, userId, "liked your post", sender.profilePic);
//           }
//       }

//       res.json({ message: `Post ${action}!`, likes: post.likes.length });
//   } catch (error) {
//       console.error("Error handling like:", error);
//       res.status(500).json({ error: "Error handling like", details: error.message });
//   }
// });

// // ✅ Comment on a Post with Notification
// router.post("/:postId/comment", async (req, res) => {
//   try {
//       const { userId, content } = req.body;
//       if (!userId || !content) return res.status(400).json({ error: "User ID and comment content are required" });

//       const post = await Post.findById(req.params.postId).populate("user");
//       if (!post) return res.status(404).json({ error: "Post not found" });

//       const user = await User.findById(userId).select("username profilePic");
//       if (!user) return res.status(404).json({ error: "User not found" });

//       const newComment = { user: userId, content, createdAt: new Date() };
//       post.comments.push(newComment);
//       await post.save();

//       // ✅ Get `sendNotification` inside the route
//       const io = req.app.get("io");
//       const sendNotification = req.app.get("sendNotification");

//       // Before creating a new notification, check if a similar one exists recently
//       const existingNotification = await Notification.findOne({
//           userId: post.user._id,
//           senderId: userId,
//           message: "commented on your post",
//           createdAt: { $gt: new Date(Date.now() - 5 * 60 * 1000) } // Within last 5 minutes
//       });

//       if (!existingNotification) {
//           const notification = new Notification({
//               userId: post.user._id,
//               senderId: userId,
//               message: "commented on your post",
//               senderPic: user.profilePic
//           });
//           await notification.save();
          
//           sendNotification(post.user._id, userId, "commented on your post", user.profilePic);
//       }

//       res.status(201).json({ 
//           message: "Comment added successfully", 
//           comment: {
//               ...newComment,
//               user: {
//                   _id: user._id,
//                   username: user.username,
//                   profilePic: user.profilePic
//               }
//           } 
//       });
//   } catch (error) {
//       console.error("Error adding comment:", error);
//       res.status(500).json({ error: "Error adding comment", details: error.message });
//   }
// });

// module.exports = router;



const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const multer = require("multer");
const Notification = require("../models/Notification");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage with the correct path
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);  // Use the absolute path defined earlier
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Updated file filter to accept images and PDFs
const fileFilter = (req, file, cb) => {
  // Accept image files and PDF files
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only image files and PDFs are allowed!'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Increased to 10MB limit for PDFs
});

// Get All Posts with User Details
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
    .populate("user", "username profilePic")
    .populate({
      path: "comments.user",
      select: "username profilePic"
    })
    .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Error fetching posts" });
  }
});

// Get posts by user ID
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const posts = await Post.find({ user: userId })
      .populate("user", "username profilePic")
      .populate({
        path: "comments.user",
        select: "username profilePic"
      })
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Error fetching user posts", details: error.message });
  }
});

// Updated Upload a Post to handle PDFs
router.post("/upload", upload.single("file"), async (req, res) => {
  const { caption, userId, title, description } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Log request data for debugging
    console.log("Upload request body:", req.body);
    console.log("Upload file:", req.file);

    // Determine file path
    let filePath;
    let fileType;
    
    if (req.file) {
      filePath = `/uploads/${req.file.filename}`;
      // Determine file type (image or PDF)
      fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'pdf';
    } else if (req.body.image) {
      filePath = req.body.image;
      fileType = 'image';
    } else {
      return res.status(400).json({ error: "File is required" });
    }

    // Create and save post
    const newPost = new Post({
      user: userId,
      caption: caption || "",
      title: title || "",  // Add title field for research papers
      description: description || "", // Add description field for research papers
      image: filePath,
      fileType: fileType, // Add fileType field to distinguish between images and PDFs
      likes: []
    });

    const savedPost = await newPost.save();

    res.status(201).json({
      message: "Post uploaded successfully",
      post: {
        _id: savedPost._id,
        user: savedPost.user,
        caption: savedPost.caption,
        title: savedPost.title,
        description: savedPost.description,
        image: savedPost.image,
        fileType: savedPost.fileType,
        likes: savedPost.likes,
        createdAt: savedPost.createdAt,
      }
    });
  } catch (error) {
    console.error("Error uploading post:", error);
    res.status(500).json({ error: "Error uploading post", details: error.message });
  }
});

// Rest of your routes remain the same
// Like / Unlike a Post
router.post("/:postId/like", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Toggle like behavior
    const index = post.likes.indexOf(userId);
    let action;
    if (index === -1) {
      post.likes.push(userId);
      action = 'liked';
    } else {
      post.likes.splice(index, 1);
      action = 'unliked';
    }

    await post.save();
    
    // Get user info for real-time update
    const user = await User.findById(userId).select('username profilePic');
    
    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.to(`post:${post._id}`).emit('postLikeUpdate', {
      postId: post._id,
      likes: post.likes,
      latestActivity: {
        user: {
          _id: userId,
          username: user.username,
          profilePic: user.profilePic
        },
        action: action,
        timestamp: new Date()
      }
    });

    res.json({ 
      message: `Post ${action}!`,
      likes: post.likes.length 
    });
  } catch (error) {
    console.error("Error handling like:", error);
    res.status(500).json({ error: "Error handling like", details: error.message });
  }
});

// Add comment
router.post("/:postId/comment", async (req, res) => {
  try {
    const { userId, content } = req.body;
    
    if (!userId || !content) {
      return res.status(400).json({ error: "User ID and comment content are required" });
    }
    
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    // Get user info first
    const user = await User.findById(userId).select('username profilePic');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Create and add the comment to the post
    const newComment = {
      user: userId,
      content,
      createdAt: new Date()
    };
    
    // Push the comment to the array
    post.comments.push(newComment);
    
    // Save the updated post
    await post.save();
    
    const io = req.app.get('io');
    io.to(`post:${post._id}`).emit('newComment', {
      postId: post._id,
      comment: {
        ...newComment,
        user: {
          _id: user._id,
          username: user.username,
          profilePic: user.profilePic
        }
      }
    });
    
    res.status(201).json({
      message: "Comment added successfully",
      comment: {
        ...newComment,
        user: {
          _id: user._id, 
          username: user.username,
          profilePic: user.profilePic
        }
      }
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Error adding comment", details: error.message });
  }
});

// Handle multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(500).json({ error: err.message });
  }
  next();
});

module.exports = router;