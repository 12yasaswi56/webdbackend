// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const Story = require('../models/Story');
// const User = require('../models/User');
// const auth = require('../middleware/auth');

// // Configure multer for story media uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const dir = './uploads/stories';
//     if (!fs.existsSync(dir)) {
//       fs.mkdirSync(dir, { recursive: true });
//     }
//     cb(null, dir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });

// const upload = multer({ 
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
//   fileFilter: (req, file, cb) => {
//     // Accept images and videos only
//     if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only image and video files are allowed'), false);
//     }
//   }
// });

// ///GET all stories (with pagination)
// router.get('/', async (req, res) => {
//   try {
//     // Get current date/time
//     const now = new Date();
    
//     // Find non-expired stories
//     const stories = await Story.find({ 
//       expiresAt: { $gt: now } 
//     })
//     .sort({ createdAt: -1 })
//     .populate('user', 'username profilePic')
//     .limit(50);
    
//     res.status(200).json(stories);
//   } catch (error) {
//     console.error('Error fetching stories:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });
// // Add this to your stories.js routes file

// // GET stories from specific user
// router.get('/:userId', async (req, res) => {
//   try {
//     const userId = req.params.userId;
    
//     // Get current date/time
//     const now = new Date();
    
//     // Find non-expired stories from the specified user
//     const stories = await Story.find({
//       user: userId,
//       expiresAt: { $gt: now }
//     })
//     .sort({ createdAt: -1 })
//     .populate('user', 'username profilePic');
    
//     res.status(200).json(stories);
//   } catch (error) {
//     console.error('Error fetching user stories:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // // GET stories from current user + users they follow
// // router.get('/feed', auth, async (req, res) => {
// //   try {
// //     const currentUserId = req.user.id;
    
// //     // Find the current user to get their following list
// //     const currentUser = await User.findById(currentUserId);
// //     if (!currentUser) {
// //       return res.status(404).json({ error: 'User not found' });
// //     }
    
// //     // Get current date/time minus 24 hours
// //     const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
// //     // Find non-expired stories from current user AND users they follow
// //     const stories = await Story.find({
// //       $or: [
// //         { user: currentUserId },
// //         { user: { $in: currentUser.following } }
// //       ],
// //       createdAt: { $gte: oneDayAgo }
// //     })
// //     .sort({ createdAt: -1 })
// //     .populate('user', 'username profilePic');
    
// //     // Group stories by user and only return the most recent stories per user
// //     const userStoryMap = new Map();
    
// //     for (const story of stories) {
// //       const userId = story.user._id.toString();
// //       // Always keep current user's stories at the beginning
// //       if (userId === currentUserId) {
// //         if (!userStoryMap.has('currentUser')) {
// //           userStoryMap.set('currentUser', []);
// //         }
// //         userStoryMap.get('currentUser').push(story);
// //       } else {
// //         if (!userStoryMap.has(userId)) {
// //           userStoryMap.set(userId, []);
// //         }
// //         userStoryMap.get(userId).push(story);
// //       }
// //     }
    
// //     // Convert map to array with current user stories first
// //     let result = [];
// //     if (userStoryMap.has('currentUser')) {
// //       result = [...userStoryMap.get('currentUser')];
// //     }
    
// //     // Add stories from following users
// //     for (const [userId, userStories] of userStoryMap.entries()) {
// //       if (userId !== 'currentUser') {
// //         result = [...result, ...userStories];
// //       }
// //     }
    
// //     res.status(200).json(result);
// //   } catch (error) {
// //     console.error('Error fetching story feed:', error);
// //     res.status(500).json({ error: 'Server error' });
// //   }
// // });


// router.get('/feed', auth, async (req, res) => {
//   try {
//     const currentUserId = req.user.id;
    
//     // Find the current user to get their following list
//     const currentUser = await User.findById(currentUserId);
//     if (!currentUser) {
//       return res.status(404).json({ error: 'User not found' });
//     }
    
//     // Get current date/time minus 24 hours
//     const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
//     // Find non-expired stories from current user AND users they follow
//     const stories = await Story.find({
//       $or: [
//         { user: currentUserId },
//         { user: { $in: currentUser.following } }
//       ],
//       createdAt: { $gte: oneDayAgo }
//     })
//     .sort({ createdAt: -1 })
//     .populate('user', 'username profilePic');
    
//     // Group stories by user properly
//     const userStories = {};
    
//     // First add current user's stories
//     const currentUserStories = stories.filter(story => 
//       story.user._id.toString() === currentUserId
//     );
    
//     // Then add following users' stories
//     const followingStories = stories.filter(story => 
//       story.user._id.toString() !== currentUserId
//     );
    
//     // Create the final array with current user first, then following
//     const result = [...currentUserStories, ...followingStories];
    
//     res.status(200).json(result);
//   } catch (error) {
//     console.error('Error fetching story feed:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });



// // GET stories from users the current user follows
// router.get('/following', auth, async (req, res) => {
//   try {
//     // Find the current user to get their following list
//     const currentUser = await User.findById(req.user.id);
//     if (!currentUser) {
//       return res.status(404).json({ error: 'User not found' });
//     }
    
//     // Get current date/time
//     const now = new Date();
    
//     // Find non-expired stories from users the current user follows
//     const stories = await Story.find({
//       user: { $in: currentUser.following },
//       expiresAt: { $gt: now }
//     })
//     .sort({ createdAt: -1 })
//     .populate('user', 'username profilePic');
    
//     res.status(200).json(stories);
//   } catch (error) {
//     console.error('Error fetching stories:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // POST create a new story
// router.post('/', auth, upload.single('file'), async (req, res) => {
//   try {

//     console.log('Auth user ID:', req.user.id);
//     console.log('Body user ID:', req.body.userId);
//     if (!req.file) {
//       return res.status(400).json({ error: 'No media file provided' });
//     }
    
//     // Get user ID from the request body or auth middleware
//     const userId = req.body.userId || req.user.id;
    
//     // Make sure the user exists
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
    
//     // Create the story
//     const story = new Story({
//       user: userId,
//       media: `/uploads/stories/${req.file.filename}`,
//       caption: req.body.caption || ''
//     });
    
//     // Save the story to the database
//     await story.save();
    
//     // Populate the user field for the response
//     await story.populate('user', 'username profilePic');
    
//     // Emit a new story event via Socket.io
//     const io = req.app.get('io');
//     io.emit('newStory', story);
    
//     res.status(201).json(story);
//   } catch (error) {
//     console.error('Error creating story:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // POST mark a story as viewed
// router.post('/:id/view', auth, async (req, res) => {
//   try {
//     const storyId = req.params.id;
//     const userId = req.user.id;
    
//     // Find the story
//     const story = await Story.findById(storyId);
//     if (!story) {
//       return res.status(404).json({ error: 'Story not found' });
//     }
    
//     // Check if user has already viewed the story
//     if (!story.viewers.includes(userId)) {
//       // Add user to viewers
//       story.viewers.push(userId);
//       await story.save();
//     }
    
//     res.status(200).json({ success: true });
//   } catch (error) {
//     console.error('Error marking story as viewed:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // DELETE a story
// // DELETE a story
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     const storyId = req.params.id;
    
//     // Find the story
//     const story = await Story.findById(storyId);
//     if (!story) {
//       return res.status(404).json({ error: 'Story not found' });
//     }
    
//     // Check if the user is the owner of the story
//     if (story.user.toString() !== req.user.id) {
//       return res.status(403).json({ error: 'Not authorized to delete this story' });
//     }
    
//     // Delete the media file
//     if (story.media && story.media.startsWith('/uploads/')) {
//       const mediaPath = path.join(__dirname, '..', story.media);
//       if (fs.existsSync(mediaPath)) {
//         fs.unlinkSync(mediaPath);
//       }
//     }
    
//     // Delete the story from the database
//     await Story.findByIdAndDelete(storyId);
    
//     res.status(200).json({ success: true });
//   } catch (error) {
//     console.error('Error deleting story:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const multer = require('multer');
// const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Story = require('../models/Story');
const User = require('../models/User');
const auth = require('../middleware/auth');




// At the top of postRoutes.js
const cloudinary = require('../cloudinary');


// Configure Cloudinary storage for multer
// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    return {
      folder: 'stories',
      allowed_formats: ['jpg', 'jpeg', 'png', 'mp4', 'mov'],
      resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
      transformation: [{ quality: 'auto' }],
      public_id: `${req.user.id}-${Date.now()}` // Unique filename
    };
  }
});

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 1 // Only allow single file upload
  },
  fileFilter: (req, file, cb) => {
    // Accept images and videos only
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

// GET all stories (with pagination)
router.get('/', async (req, res) => {
  try {
    // Get current date/time
    const now = new Date();
    
    // Find non-expired stories
    const stories = await Story.find({ 
      expiresAt: { $gt: now } 
    })
    .sort({ createdAt: -1 })
    .populate('user', 'username profilePic')
    .limit(50);
    
    res.status(200).json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET stories from specific user
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get current date/time
    const now = new Date();
    
    // Find non-expired stories from the specified user
    const stories = await Story.find({
      user: userId,
      expiresAt: { $gt: now }
    })
    .sort({ createdAt: -1 })
    .populate('user', 'username profilePic');
    
    res.status(200).json(stories);
  } catch (error) {
    console.error('Error fetching user stories:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/feed', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // Find the current user to get their following list
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get current date/time minus 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Find non-expired stories from current user AND users they follow
    const stories = await Story.find({
      $or: [
        { user: currentUserId },
        { user: { $in: currentUser.following } }
      ],
      createdAt: { $gte: oneDayAgo }
    })
    .sort({ createdAt: -1 })
    .populate('user', 'username profilePic');
    
    // Group stories by user properly
    const userStories = {};
    
    // First add current user's stories
    const currentUserStories = stories.filter(story => 
      story.user._id.toString() === currentUserId
    );
    
    // Then add following users' stories
    const followingStories = stories.filter(story => 
      story.user._id.toString() !== currentUserId
    );
    
    // Create the final array with current user first, then following
    const result = [...currentUserStories, ...followingStories];
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching story feed:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET stories from users the current user follows
router.get('/following', auth, async (req, res) => {
  try {
    // Find the current user to get their following list
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get current date/time
    const now = new Date();
    
    // Find non-expired stories from users the current user follows
    const stories = await Story.find({
      user: { $in: currentUser.following },
      expiresAt: { $gt: now }
    })
    .sort({ createdAt: -1 })
    .populate('user', 'username profilePic');
    
    res.status(200).json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create a new story
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    console.log('Auth user ID:', req.user.id);
    console.log('Body user ID:', req.body.userId);
    
    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided' });
    }
    
    // Get user ID from the request body or auth middleware
    const userId = req.body.userId || req.user.id;
    
    // Make sure the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create the story with Cloudinary URL
    const story = new Story({
      user: userId,
      media: req.file.path, // Cloudinary returns a URL in req.file.path
      caption: req.body.caption || ''
    });
    
    // Save the story to the database
    await story.save();
    
    // Populate the user field for the response
    await story.populate('user', 'username profilePic');
    
    // Emit a new story event via Socket.io
    const io = req.app.get('io');
    io.emit('newStory', story);
    
    res.status(201).json(story);
  } catch (error) {
    console.error('Detailed story creation error:', {
      message: error.message,
      stack: error.stack
    });
    
    // Clean up failed Cloudinary upload if possible
    if (req.file?.path) {
      try {
        const publicId = req.file.path.split('/').slice(-1)[0].split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (cleanupError) {
        console.error('Failed to cleanup Cloudinary upload:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to create story',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST mark a story as viewed
router.post('/:id/view', auth, async (req, res) => {
  try {
    const storyId = req.params.id;
    const userId = req.user.id;
    
    // Find the story
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    // Check if user has already viewed the story
    if (!story.viewers.includes(userId)) {
      // Add user to viewers
      story.viewers.push(userId);
      await story.save();
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking story as viewed:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE a story
router.delete('/:id', auth, async (req, res) => {
  try {
    const storyId = req.params.id;
    
    // Find the story
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    // Check if the user is the owner of the story
    if (story.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this story' });
    }
    
    // Delete the media from Cloudinary
    // Extract the public ID from the Cloudinary URL
    if (story.media) {
      const publicId = story.media.split('/').slice(-1)[0].split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }
    
    // Delete the story from the database
    await Story.findByIdAndDelete(storyId);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



// GET viewers of a specific story
router.get('/:id/viewers', auth, async (req, res) => {
  try {
    const storyId = req.params.id;
    
    // Find the story
    const story = await Story.findById(storyId)
      .populate('viewers', 'username profilePic')
      .select('viewers user');
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    // Check if the user is the owner of the story
    if (story.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this information' });
    }
    
    // Filter out duplicates based on _id and exclude the story owner
    const uniqueViewers = [];
    const viewerIds = new Set();
    
    story.viewers.forEach(viewer => {
      const viewerId = viewer._id.toString();
      // Only add if not already in the set and not the story owner
      if (!viewerIds.has(viewerId) && viewerId !== req.user.id) {
        viewerIds.add(viewerId);
        uniqueViewers.push(viewer);
      }
    });
    
    res.status(200).json({
      count: uniqueViewers.length,
      viewers: uniqueViewers
    });
  } catch (error) {
    console.error('Error fetching story viewers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



// POST mark a story as viewed
router.post('/:id/view', auth, async (req, res) => {
  try {
    const storyId = req.params.id;
    const userId = req.user.id;
    
    // Find the story
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    // Don't add the story owner to viewers list
    if (story.user.toString() === userId) {
      return res.status(200).json({ success: true });
    }
    
    // Check if user has already viewed the story
    if (!story.viewers.includes(userId)) {
      // Add user to viewers
      story.viewers.push(userId);
      await story.save();
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking story as viewed:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports = router;