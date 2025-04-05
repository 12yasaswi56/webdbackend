// const express = require("express");
// const Post = require("../models/Post");
// const User = require("../models/User");
// const multer = require("multer");
// const Notification = require("../models/Notification");
// const Conversation = require('../models/Conversation');
// const Message = require('../models/Message');

// const path = require("path");
// const fs = require("fs");
// const auth = require('../middleware/auth');
// const router = express.Router();
// const mongoose = require('mongoose');

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

// // Updated file filter to accept images and PDFs
// const fileFilter = (req, file, cb) => {
//   // Accept image files and PDF files
//   if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files and PDFs are allowed!'), false);
//   }
// };

// const upload = multer({ 
//   storage, 
//   fileFilter,
//   limits: { fileSize: 10 * 1024 * 1024 } // Increased to 10MB limit for PDFs
// });

// // Get All Posts with User Details
// router.get("/", async (req, res) => {
//   try {
//     const posts = await Post.find()
//     .populate("user", "username profilePic")
//     .populate({
//       path: "comments.user",
//       select: "username profilePic"
//     })
//     .populate({
//       path: "taggedUsers",  // Ensure taggedUsers are populated
//       select: "_id username profilePic"
//     })
//     .sort({ createdAt: -1 });
//      // Transform posts to ensure full URLs for profile pictures
//      const transformedPosts = posts.map(post => ({
//       ...post.toObject(),
//       taggedUsers: post.taggedUsers.map(user => ({
//         _id: user._id,
//         username: user.username,
//         profilePic: user.profilePic 
//           ? (user.profilePic.startsWith('http') 
//               ? user.profilePic 
//               : `http://localhost:5000${user.profilePic}`)
//           : "/default-avatar.png"
//       }))
//     }));
//     res.json(transformedPosts);
//   } catch (error) {
//     console.error("Error fetching posts:", error);
//     res.status(500).json({ error: "Error fetching posts" });
//   }
// });

// // Get posts by user ID
// router.get("/user/:userId", async (req, res) => {
//   try {
//     const userId = req.params.userId;
    
//     const posts = await Post.find({ user: userId })
//       .populate("user", "username profilePic")
//       .populate({
//         path: "comments.user",
//         select: "username profilePic"
//       })
//       .sort({ createdAt: -1 });
    
//     res.json(posts);
//   } catch (error) {
//     console.error("Error fetching user posts:", error);
//     res.status(500).json({ error: "Error fetching user posts", details: error.message });
//   }
// });

// // Updated Upload a Post to handle PDFs
// router.post("/upload", upload.single("file"), async (req, res) => {
//   const { caption, userId, title, description } = req.body;

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

//     // Determine file path
//     let filePath;
//     let fileType;
    
//     if (req.file) {
//       filePath = `/uploads/${req.file.filename}`;
//       // Determine file type (image or PDF)
//       fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'pdf';
//     } else if (req.body.image) {
//       filePath = req.body.image;
//       fileType = 'image';
//     } else {
//       return res.status(400).json({ error: "File is required" });
//     }

//     // Create and save post
//     const newPost = new Post({
//       user: userId,
//       caption: caption || "",
//       title: title || "",  // Add title field for research papers
//       description: description || "", // Add description field for research papers
//       image: filePath,
//       fileType: fileType, // Add fileType field to distinguish between images and PDFs
//       likes: []
//     });

//     const savedPost = await newPost.save();

//     res.status(201).json({
//       message: "Post uploaded successfully",
//       post: {
//         _id: savedPost._id,
//         user: savedPost.user,
//         caption: savedPost.caption,
//         title: savedPost.title,
//         description: savedPost.description,
//         image: savedPost.image,
//         fileType: savedPost.fileType,
//         likes: savedPost.likes,
//         createdAt: savedPost.createdAt,
//       }
//     });
//   } catch (error) {
//     console.error("Error uploading post:", error);
//     res.status(500).json({ error: "Error uploading post", details: error.message });
//   }
// });

// // Get saved posts
// // Updated /posts/saved route
// router.get('/saved', auth, async (req, res) => {
//   try {
//     const userId = req.user._id; // Get from authenticated user
    
//     console.log(`Fetching saved posts for user: ${userId}`);
    
//     // Find user with savedPosts populated
//     const user = await User.findById(userId)
//       .populate({
//         path: 'savedPosts',
//         populate: [
//           {
//             path: 'user',
//             select: 'username profilePic'
//           },
//           {
//             path: 'taggedUsers',
//             select: 'username profilePic'
//           }
//         ]
//       })
//       .lean(); // Convert to plain JS object

//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Transform posts with proper image URLs
//     const savedPosts = user.savedPosts.map(post => ({
//       ...post,
//       image: post.image ? `${req.protocol}://${req.get('host')}${post.image}` : null
//     }));

//     console.log(`Found ${savedPosts.length} saved posts`);
//     return res.status(200).json(savedPosts);
    
//   } catch (err) {
//     console.error('Error in /posts/saved:', {
//       message: err.message,
//       stack: err.stack,
//       user: req.user
//     });
//     return res.status(500).json({ 
//       error: 'Server error',
//       details: process.env.NODE_ENV === 'development' ? err.message : undefined
//     });
//   }
// });
// router.get("/:postId", async (req, res) => {
//   try {
//     const { postId } = req.params;

//     const post = await Post.findById(postId)
//       .populate("user", "username profilePic")
//       .populate({
//         path: "comments.user",
//         select: "username profilePic",
//       })
//       .populate("comments", "content");

//     if (!post) {
//       return res.status(404).json({ error: "Post not found" });
//     }

//     res.json(post);
//   } catch (error) {
//     console.error("Error fetching post:", error);
//     res.status(500).json({ error: "Error fetching post", details: error.message });
//   }
// });


// router.post("/:postId/like", async (req, res) => {
//   try {
//     const { userId } = req.body;
//     if (!userId) {
//       return res.status(400).json({ error: "User ID is required" });
//     }

//     const post = await Post.findById(req.params.postId).populate('user', 'username');
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

//     // Send a notification to the post owner (if the liker is not the owner)
//     if (post.user._id.toString() !== userId) {
//       const sendNotification = req.app.get("sendNotification");

//       await sendNotification(
//         post.user._id,
//         userId,
//         `${user.username} ${action} your post`,
//         user.profilePic
//       );

//       // Emit socket event for real-time notifications
//       io.to(`user:${post.user._id}`).emit('newNotification', {
//         senderId: userId,
//         receiverId: post.user._id,
//         message: `${user.username} ${action} your post`,
//         profilePic: user.profilePic,
//         timestamp: new Date()
//       });
//     }

//     res.json({ 
//       message: `Post ${action}!`,
//       likes: post.likes.length 
//     });

//   } catch (error) {
//     console.error("Error handling like:", error);
//     res.status(500).json({ error: "Error handling like", details: error.message });
//   }
// });

// // Add comment
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
// // routes/posts.js
// router.post("/:postId/share", async (req, res) => {
//   try {
//     const { userId, selectedUserIds = [] } = req.body;

//     if (!userId) {
//       return res.status(400).json({ error: "User ID is required" });
//     }

//     const post = await Post.findById(req.params.postId)
//       .populate("user")
//       .populate("taggedUsers");
      
//     if (!post) {
//       return res.status(404).json({ error: "Post not found" });
//     }

//     const newShare = {
//       user: userId,
//       createdAt: new Date()
//     };

//     post.shares.push(newShare);
//     await post.save();

//     const user = await User.findById(userId).select("username profilePic");

//     // Create complete post reference data
//     const postReference = {
//       postId: post._id,
//       imageUrl: post.image.startsWith('http') 
//         ? post.image 
//         : `${req.protocol}://${req.get('host')}${post.image}`,
//       caption: post.caption,
//       userId: post.user._id,
//       username: post.user.username,
//       userProfilePic: post.user.profilePic,
//       taggedUsers: post.taggedUsers.map(user => ({
//         _id: user._id,
//         username: user.username,
//         profilePic: user.profilePic
//       }))
//     };

//     // Process each recipient
//     for (const recipientId of selectedUserIds) {
//       // Find or create conversation
//       let conversation = await Conversation.findOne({
//         participants: { $all: [userId, recipientId] }
//       });

//       if (!conversation) {
//         conversation = new Conversation({
//           participants: [userId, recipientId]
//         });
//         await conversation.save();
//       }

//       // Create the message
//       const message = new Message({
//         conversationId: conversation._id,
//         senderId: userId,
//         content: `Shared a post: "${post.caption || 'No caption'}"`,
//         postReference
//       });

//       await message.save();

//       // Update conversation's last message
//       conversation.updatedAt = new Date();
//       conversation.latestMessage = message._id;
//       await conversation.save();

//       // Emit socket event
//       req.app.get("io").to(`user:${recipientId}`).emit("newSharedPost", {
//         postId: post._id,
//         sharedBy: { 
//           _id: user._id, 
//           username: user.username, 
//           profilePic: user.profilePic 
//         },
//         postReference
//       });
//     }

//     res.json({ 
//       message: "Post shared successfully", 
//       share: newShare,
//       postReference
//     });
//   } catch (error) {
//     console.error("Error sharing post:", error);
//     res.status(500).json({ error: "Error sharing post", details: error.message });
//   }
// });


// // New Route: Delete a Post
// router.delete("/:postId", async (req, res) => {
//   try {
//     const { userId } = req.body;
//     const postId = req.params.postId;

//     // Find the post
//     const post = await Post.findById(postId);
    
//     if (!post) {
//       return res.status(404).json({ error: "Post not found" });
//     }

//     // Check if the user deleting the post is the owner
//     if (post.user.toString() !== userId) {
//       return res.status(403).json({ error: "You are not authorized to delete this post" });
//     }

//     // Delete the physical file if it exists
//     if (post.image && post.image.startsWith('/uploads/')) {
//       const filePath = path.join(__dirname, `..${post.image}`);
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//       }
//     }

//     // Delete the post from database
//     await Post.findByIdAndDelete(postId);

//     // Emit socket event for real-time update
//     const io = req.app.get('io');
//     io.emit('postDeleted', { postId });

//     res.json({ message: "Post deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting post:", error);
//     res.status(500).json({ error: "Error deleting post", details: error.message });
//   }
// });
// // In your backend route, ensure comprehensive population
// router.get('/posts', async (req, res) => {
//   try {
//       const posts = await Post.find()
//           .populate({
//               path: 'taggedUsers',
//               select: '_id username profilePic',
//               model: 'User'
//           })
//           .populate('user', '_id username profilePic')
//           .sort({ createdAt: -1 });

//       // Transform posts to ensure full URLs
//       const transformedPosts = posts.map(post => ({
//           ...post.toObject(),
//           taggedUsers: post.taggedUsers.map(user => ({
//               _id: user._id,
//               username: user.username,
//               profilePic: user.profilePic 
//                   ? (user.profilePic.startsWith('http') 
//                       ? user.profilePic 
//                       : `http://localhost:5000${user.profilePic}`)
//                   : "/default-avatar.png"
//           }))
//       }));

//       // res.json(transformedPosts);
//   } catch (error) {
//       console.error('Detailed Population Error:', error);
//       res.status(500).json({ 
//           message: "Error fetching posts", 
//           error: error.message 
//       });
//   }
// });
// // New Route: Tag User in Post
// router.post("/:postId/tag", async (req, res) => {
//   try {
//     const { userId, taggedUserId } = req.body;
//     const postId = req.params.postId;

//     // Validate input
//     if (!userId || !taggedUserId) {
//       return res.status(400).json({ error: "User IDs are required" });
//     }

//     // Find the post
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ error: "Post not found" });
//     }

//     // Check if user is trying to tag themselves or if they own the post
//     if (post.user.toString() !== userId) {
//       return res.status(403).json({ error: "You can only tag users in your own post" });
//     }

//     // Check if user is already tagged
//     const isAlreadyTagged = post.taggedUsers.some(
//       id => id.toString() === taggedUserId
//     );

//     if (isAlreadyTagged) {
//       return res.status(400).json({ error: "User is already tagged" });
//     }

//     // Add tagged user
//     post.taggedUsers.push(taggedUserId);
//     await post.save();

//     // Get user details for notification
//     const taggingUser = await User.findById(userId).select('username profilePic');
//     const taggedUser = await User.findById(taggedUserId);

//     if (!taggingUser || !taggedUser) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Create notification
//     const notification = new Notification({
//       userId: taggedUserId,
//       senderId: userId,
//       type: 'tag',
//       message: `${taggingUser.username} tagged you in a post`,
//       postId: postId,
//       senderPic: taggingUser.profilePic
//     });

//     await notification.save();

//     // Emit socket event
//     const io = req.app.get('io');
//     io.to(`user:${taggedUserId}`).emit('newNotification', {
//       type: 'tag',
//       message: `${taggingUser.username} tagged you in a post`,
//       postId: postId,
//       sender: {
//         _id: userId,
//         username: taggingUser.username,
//         profilePic: taggingUser.profilePic
//       },
//       createdAt: new Date()
//     });

//     // Get updated post with populated taggedUsers
//     const populatedPost = await Post.findById(postId)
//       .populate({
//         path: 'taggedUsers',
//         select: '_id username profilePic'
//       });

//     return res.json({ 
//       message: "User tagged successfully", 
//       taggedUsers: populatedPost.taggedUsers 
//     });

//   } catch (error) {
//     console.error("Error in tagging route:", error);
//     return res.status(500).json({ 
//       error: "Error tagging user", 
//       details: error.message 
//     });
//   }
// });



// // This would go in your routes/posts.js file

// // Save a post
// router.post('/:postId/save', auth, async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const userId = req.user.id;

//     // Validate post exists
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ error: 'Post not found' });
//     }

//     // Check if user has already saved this post
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // If savedPosts array doesn't exist, create it
//     if (!user.savedPosts) {
//       user.savedPosts = [];
//     }

//     // Check if post is already saved
//     if (user.savedPosts.includes(postId)) {
//       return res.status(400).json({ error: 'Post already saved' });
//     }

//     // Add post to saved posts
//     user.savedPosts.push(postId);
//     await user.save();

//     return res.status(200).json({ message: 'Post saved successfully' });
//   } catch (err) {
//     console.error('Error saving post:', err);
//     return res.status(500).json({ error: 'Server error' });
//   }
// });

// // Unsave a post
// router.post('/:postId/unsave', auth, async (req, res) => {
//   try {
//     const { postId } = req.params;
//     const userId = req.user.id;

//     // Validate post exists
//     const post = await Post.findById(postId);
//     if (!post) {
//       return res.status(404).json({ error: 'Post not found' });
//     }

//     // Find user and remove post from savedPosts
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Check if savedPosts exists and contains the post
//     if (!user.savedPosts || !user.savedPosts.includes(postId)) {
//       return res.status(400).json({ error: 'Post not saved' });
//     }

//     // Remove post from saved posts
//     user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
//     await user.save();

//     return res.status(200).json({ message: 'Post removed from saved' });
//   } catch (err) {
//     console.error('Error unsaving post:', err);
//     return res.status(500).json({ error: 'Server error' });
//   }
// });


// // Handle multer errors
// router.use((err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     return res.status(400).json({ error: err.message });
//   } else if (err) {
//     return res.status(500).json({ error: err.message });
//   }
//   next();
// });

// module.exports = router;



const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const multer = require("multer");
const Notification = require("../models/Notification");
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const path = require("path");
const auth = require('../middleware/auth');
const router = express.Router();
const mongoose = require('mongoose');

// const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
// At the top of postRoutes.js
const cloudinary = require('../cloudinary');


// Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'social_app_uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf'],
    resource_type: 'auto' // Automatically detect resource type (image or raw for PDFs)
  }
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
    .populate({
      path: "taggedUsers",  // Ensure taggedUsers are populated
      select: "_id username profilePic"
    })
    .sort({ createdAt: -1 });
     // Transform posts to ensure full URLs for profile pictures
     const transformedPosts = posts.map(post => ({
      ...post.toObject(),
      taggedUsers: post.taggedUsers.map(user => ({
        _id: user._id,
        username: user.username,
        profilePic: user.profilePic 
          ? (user.profilePic.startsWith('http') 
              ? user.profilePic 
              : `http://localhost:5000${user.profilePic}`)
          : "/default-avatar.png"
      }))
    }));
    res.json(transformedPosts);
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

// Updated Upload a Post to handle Cloudinary URLs
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

    // Determine file path and type
    let filePath;
    let fileType;
    
    if (req.file) {
      // When using Cloudinary, req.file.path will contain the URL
      filePath = req.file.path; // This is the Cloudinary URL
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
      title: title || "",
      description: description || "",
      image: filePath, // This is now the Cloudinary URL
      fileType: fileType,
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

// Get saved posts
router.get('/saved', auth, async (req, res) => {
  try {
    const userId = req.user._id; // Get from authenticated user
    
    console.log(`Fetching saved posts for user: ${userId}`);
    
    // Find user with savedPosts populated
    const user = await User.findById(userId)
      .populate({
        path: 'savedPosts',
        populate: [
          {
            path: 'user',
            select: 'username profilePic'
          },
          {
            path: 'taggedUsers',
            select: 'username profilePic'
          }
        ]
      })
      .lean(); // Convert to plain JS object

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // No need to transform URLs for Cloudinary since they're already absolute URLs
    const savedPosts = user.savedPosts;

    console.log(`Found ${savedPosts.length} saved posts`);
    return res.status(200).json(savedPosts);
    
  } catch (err) {
    console.error('Error in /posts/saved:', {
      message: err.message,
      stack: err.stack,
      user: req.user
    });
    return res.status(500).json({ 
      error: 'Server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

router.get("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId)
      .populate("user", "username profilePic")
      .populate({
        path: "comments.user",
        select: "username profilePic",
      })
      .populate("comments", "content");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Error fetching post", details: error.message });
  }
});

router.post("/:postId/like", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const post = await Post.findById(req.params.postId).populate('user', 'username');
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

    // Send a notification to the post owner (if the liker is not the owner)
    if (post.user._id.toString() !== userId) {
      const sendNotification = req.app.get("sendNotification");

      await sendNotification(
        post.user._id,
        userId,
        `${user.username} ${action} your post`,
        user.profilePic
      );

      // Emit socket event for real-time notifications
      io.to(`user:${post.user._id}`).emit('newNotification', {
        senderId: userId,
        receiverId: post.user._id,
        message: `${user.username} ${action} your post`,
        profilePic: user.profilePic,
        timestamp: new Date()
      });
    }

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

router.post("/:postId/share", async (req, res) => {
  try {
    const { userId, selectedUserIds = [] } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const post = await Post.findById(req.params.postId)
      .populate("user")
      .populate("taggedUsers");
      
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const newShare = {
      user: userId,
      createdAt: new Date()
    };

    post.shares.push(newShare);
    await post.save();

    const user = await User.findById(userId).select("username profilePic");

    // Create complete post reference data - no need to modify image URL since it's already a Cloudinary URL
    const postReference = {
      postId: post._id,
      imageUrl: post.image,
      caption: post.caption,
      userId: post.user._id,
      username: post.user.username,
      userProfilePic: post.user.profilePic,
      taggedUsers: post.taggedUsers.map(user => ({
        _id: user._id,
        username: user.username,
        profilePic: user.profilePic
      }))
    };

    // Process each recipient
    for (const recipientId of selectedUserIds) {
      // Find or create conversation
      let conversation = await Conversation.findOne({
        participants: { $all: [userId, recipientId] }
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: [userId, recipientId]
        });
        await conversation.save();
      }

      // Create the message
      const message = new Message({
        conversationId: conversation._id,
        senderId: userId,
        content: `Shared a post: "${post.caption || 'No caption'}"`,
        postReference
      });

      await message.save();

      // Update conversation's last message
      conversation.updatedAt = new Date();
      conversation.latestMessage = message._id;
      await conversation.save();

      // Emit socket event
      req.app.get("io").to(`user:${recipientId}`).emit("newSharedPost", {
        postId: post._id,
        sharedBy: { 
          _id: user._id, 
          username: user.username, 
          profilePic: user.profilePic 
        },
        postReference
      });
    }

    res.json({ 
      message: "Post shared successfully", 
      share: newShare,
      postReference
    });
  } catch (error) {
    console.error("Error sharing post:", error);
    res.status(500).json({ error: "Error sharing post", details: error.message });
  }
});

// Updated Delete Post route for Cloudinary
router.delete("/:postId", async (req, res) => {
  try {
    const { userId } = req.body;
    const postId = req.params.postId;

    // Find the post
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if the user deleting the post is the owner
    if (post.user.toString() !== userId) {
      return res.status(403).json({ error: "You are not authorized to delete this post" });
    }

    // Delete the image from Cloudinary if it exists
    if (post.image && post.image.includes('cloudinary.com')) {
      // Extract public_id from Cloudinary URL
      const splitUrl = post.image.split('/');
      const filename = splitUrl[splitUrl.length - 1];
      const publicId = `social_app_uploads/${filename.split('.')[0]}`;
      
      // Delete from Cloudinary
      await cloudinary.uploader.destroy(publicId);
    }

    // Delete the post from database
    await Post.findByIdAndDelete(postId);

    // Emit socket event for real-time update
    const io = req.app.get('io');
    io.emit('postDeleted', { postId });

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Error deleting post", details: error.message });
  }
});

router.get('/posts', async (req, res) => {
  try {
      const posts = await Post.find()
          .populate({
              path: 'taggedUsers',
              select: '_id username profilePic',
              model: 'User'
          })
          .populate('user', '_id username profilePic')
          .sort({ createdAt: -1 });

      // Cloudinary URLs are already complete, no need to transform
      res.json(posts);
  } catch (error) {
      console.error('Detailed Population Error:', error);
      res.status(500).json({ 
          message: "Error fetching posts", 
          error: error.message 
      });
  }
});

// Tag User in Post
router.post("/:postId/tag", async (req, res) => {
  try {
    const { userId, taggedUserId } = req.body;
    const postId = req.params.postId;

    // Validate input
    if (!userId || !taggedUserId) {
      return res.status(400).json({ error: "User IDs are required" });
    }

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user is trying to tag themselves or if they own the post
    if (post.user.toString() !== userId) {
      return res.status(403).json({ error: "You can only tag users in your own post" });
    }

    // Check if user is already tagged
    const isAlreadyTagged = post.taggedUsers.some(
      id => id.toString() === taggedUserId
    );

    if (isAlreadyTagged) {
      return res.status(400).json({ error: "User is already tagged" });
    }

    // Add tagged user
    post.taggedUsers.push(taggedUserId);
    await post.save();

    // Get user details for notification
    const taggingUser = await User.findById(userId).select('username profilePic');
    const taggedUser = await User.findById(taggedUserId);

    if (!taggingUser || !taggedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create notification
    const notification = new Notification({
      userId: taggedUserId,
      senderId: userId,
      type: 'tag',
      message: `${taggingUser.username} tagged you in a post`,
      postId: postId,
      senderPic: taggingUser.profilePic
    });

    await notification.save();

    // Emit socket event
    const io = req.app.get('io');
    io.to(`user:${taggedUserId}`).emit('newNotification', {
      type: 'tag',
      message: `${taggingUser.username} tagged you in a post`,
      postId: postId,
      sender: {
        _id: userId,
        username: taggingUser.username,
        profilePic: taggingUser.profilePic
      },
      createdAt: new Date()
    });

    // Get updated post with populated taggedUsers
    const populatedPost = await Post.findById(postId)
      .populate({
        path: 'taggedUsers',
        select: '_id username profilePic'
      });

    return res.json({ 
      message: "User tagged successfully", 
      taggedUsers: populatedPost.taggedUsers 
    });

  } catch (error) {
    console.error("Error in tagging route:", error);
    return res.status(500).json({ 
      error: "Error tagging user", 
      details: error.message 
    });
  }
});

// Save a post
router.post('/:postId/save', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Validate post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user has already saved this post
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If savedPosts array doesn't exist, create it
    if (!user.savedPosts) {
      user.savedPosts = [];
    }

    // Check if post is already saved
    if (user.savedPosts.includes(postId)) {
      return res.status(400).json({ error: 'Post already saved' });
    }

    // Add post to saved posts
    user.savedPosts.push(postId);
    await user.save();

    return res.status(200).json({ message: 'Post saved successfully' });
  } catch (err) {
    console.error('Error saving post:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Unsave a post
router.post('/:postId/unsave', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Validate post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Find user and remove post from savedPosts
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if savedPosts exists and contains the post
    if (!user.savedPosts || !user.savedPosts.includes(postId)) {
      return res.status(400).json({ error: 'Post not saved' });
    }

    // Remove post from saved posts
    user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
    await user.save();

    return res.status(200).json({ message: 'Post removed from saved' });
  } catch (err) {
    console.error('Error unsaving post:', err);
    return res.status(500).json({ error: 'Server error' });
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