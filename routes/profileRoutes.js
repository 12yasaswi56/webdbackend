// const express = require('express');
// const router = express.Router();
// const auth = require('../middleware/auth');
// const User = require('../models/User');
// const Post = require('../models/Post'); // Assuming you have a Post model
// const mongoose = require('mongoose');
// const multer = require('multer');


// // Setup multer for profile picture uploads
// const storage = multer.diskStorage({
//     destination: './uploads/',
//     filename: (req, file, cb) => {
//       cb(null, `${Date.now()}-${file.originalname}`);
//     },
//   });
//   const upload = multer({ storage });
// // Get user profile by ID
// router.get('/:id', async (req, res) => {
//   try {
//     const userId = req.params.id;


//     // Check if ID is valid MongoDB ObjectId
//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({ error: 'Invalid user ID' });
//     }

//     // Find the user by ID
//     const user = await User.findById(userId)
//       .select('-password -__v')
//       .lean();

//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Get count of posts, followers, and following
//     const postsCount = await Post.countDocuments({ user: userId });
    
//     // Format the response
//     const profileData = {
//       ...user,
//       postsCount,
//       followersCount: user.followers.length,
//       followingCount: user.following.length
//     };

//     res.json(profileData);
//   } catch (error) {
//     console.error('Error fetching profile:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Follow a user
// router.post('/:id/follow', auth, async (req, res) => {
//     try {
//         if (req.params.id === req.user.id) {
//             return res.status(400).json({ error: 'You cannot follow yourself' });
//         }

//         const userToFollow = await User.findById(req.params.id);
//         const currentUser = await User.findById(req.user.id);

//         if (!userToFollow || !currentUser) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         if (currentUser.following.includes(req.params.id)) {
//             return res.status(400).json({ error: 'You are already following this user' });
//         }

//         await User.findByIdAndUpdate(req.user.id, {
//             $push: { following: req.params.id }
//         });

//         await User.findByIdAndUpdate(req.params.id, {
//             $push: { followers: req.user.id }
//         });

//         // Emit Socket.IO event for follow
//         const io = req.app.get('io');
//         io.to(`user:${req.params.id}`).emit('followerUpdate', {
//             userId: req.user.id,
//             action: 'follow'
//         });
//         io.to(`user:${req.user.id}`).emit('followingUpdate', {
//             userId: req.params.id,
//             action: 'follow'
//         });

//         res.json({ success: true });
//     } catch (error) {
//         console.error('Error following user:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// });

// // Unfollow a user
// router.post('/:id/unfollow', auth, async (req, res) => {
//     try {
//         if (req.params.id === req.user.id) {
//             return res.status(400).json({ error: 'You cannot unfollow yourself' });
//         }

//         await User.findByIdAndUpdate(req.user.id, {
//             $pull: { following: req.params.id }
//         });

//         await User.findByIdAndUpdate(req.params.id, {
//             $pull: { followers: req.user.id }
//         });

//         // Emit Socket.IO event for unfollow
//         const io = req.app.get('io');
//         io.to(`user:${req.params.id}`).emit('followerUpdate', {
//             userId: req.user.id,
//             action: 'unfollow'
//         });
//         io.to(`user:${req.user.id}`).emit('followingUpdate', {
//             userId: req.params.id,
//             action: 'unfollow'
//         });

//         res.json({ success: true });
//     } catch (error) {
//         console.error('Error unfollowing user:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// });



// router.post("/:id/follow", async (req, res) => {
//   try {
//       const { currentUserId } = req.body;
//       const user = await User.findById(req.params.userId);
//       const currentUser = await User.findById(currentUserId);

//       if (!user.followers.includes(currentUserId)) {
//           user.followers.push(currentUserId);
//           currentUser.following.push(user._id);
//           await user.save();
//           await currentUser.save();

//           sendNotification(user._id, currentUserId, "started following you", "userProfilePicURL");

//           res.json({ message: "Followed successfully!" });
//       } else {
//           res.json({ message: "Already following" });
//       }
//   } catch (error) {
//       res.status(500).json({ error: "Error following user" });
//   }
// });


// // Update user profile
// // Update user profile
// router.put('/', auth, async (req, res) => {
//     try {
//       const { fullName, bio, isPrivate } = req.body;
//       const updateData = {};
//       if (fullName) updateData.fullName = fullName;
//       if (bio !== undefined) updateData.bio = bio;
//       if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
  
//       const updatedUser = await User.findByIdAndUpdate(
//         req.user.id,
//         { $set: updateData },
//         { new: true }
//       ).select('-password');
  
//       res.json(updatedUser);
//     } catch (error) {
//       console.error('Error updating profile:', error);
//       res.status(500).json({ error: 'Server error' });
//     }
//   });
  
//   // Upload Profile Picture
// // Upload Profile Picture
// router.post('/upload', auth, upload.single('profilePic'), async (req, res) => {
//     try {
//       const userId = req.user.id;
//       const profilePicUrl = `/uploads/${req.file.filename}`;
  
//       await User.findByIdAndUpdate(userId, { profilePic: profilePicUrl });
//       res.json({ profilePic: profilePicUrl });
//     } catch (error) {
//       console.error('Error uploading profile picture:', error);
//       res.status(500).json({ error: 'Server error' });
//     }
//   });
  
//  // Update User Profile (Alternate)
// router.put('/:userId/update', auth,async (req, res) => {
//     try {
//       const { username, bio, profilePic } = req.body;
//       const updateData = {};
      
//       if (username) updateData.username = username;
//       if (bio !== undefined) updateData.bio = bio;
//       if (profilePic) updateData.profilePic = profilePic;
      
//       const updatedProfile = await User.findByIdAndUpdate(
//         req.params.userId,
//         updateData,
//         { new: true }
//       );
      
//       res.json(updatedProfile);
//     } catch (error) {
//       console.error('Error updating profile:', error);
//       res.status(500).json({ error: 'Server error' });
//     }
//   });


// // Search users

// router.get('/search/:query', auth, async (req, res) => {
//     try {
//         const query = req.params.query;
//         const userId = req.user._id; // Get the current user's ID from the token

//         const users = await User.find({
//             username: { $regex: query, $options: 'i' }
//         }).select('_id username profilePic followers');

//         const usersWithFollowing = users.map(user => ({
//             ...user.toObject(), // Convert Mongoose document to plain object
//             isFollowing: user.followers.includes(userId)
//         }));

//         res.json(usersWithFollowing);
//     } catch (error) {
//         console.error('Error searching users:', error);
//         res.status(500).json({ error: 'Server error' });
//     }
// });









// // Add these routes to your profile.js router file

// // Get user followers
// router.get('/:id/followers', auth, async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const currentUserId = req.user.id;

//     // Find the user to get their followers
//     const user = await User.findById(userId).select('followers').lean();
    
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Get follower details with isFollowing status
//     const followerIds = user.followers;
//     const followers = await User.find({
//       _id: { $in: followerIds }
//     }).select('_id username fullName profilePic followers').lean();

//     // Add isFollowing field to each follower
//     const followersWithStatus = followers.map(follower => ({
//       ...follower,
//       isFollowing: follower.followers.includes(currentUserId)
//     }));

//     res.json(followersWithStatus);
//   } catch (error) {
//     console.error('Error fetching followers:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// // Get users that the given user follows
// router.get('/:id/following', auth, async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const currentUserId = req.user.id;

//     // Find the user to get their following list
//     const user = await User.findById(userId).select('following').lean();
    
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Get following details with isFollowing status
//     const followingIds = user.following;
//     const following = await User.find({
//       _id: { $in: followingIds }
//     }).select('_id username fullName profilePic followers').lean();

//     // Add isFollowing field to each user
//     const followingWithStatus = following.map(followedUser => ({
//       ...followedUser,
//       isFollowing: followedUser.followers.includes(currentUserId)
//     }));

//     res.json(followingWithStatus);
//   } catch (error) {
//     console.error('Error fetching following users:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });


// module.exports = router;



const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');
const mongoose = require('mongoose');
const multer = require('multer');

// Multer config for profile picture uploads
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Get user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(userId)
      .select('-password -__v')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const postsCount = await Post.countDocuments({ user: userId });

    const profileData = {
      ...user,
      postsCount,
      followersCount: user.followers.length,
      followingCount: user.following.length,
    };

    res.json(profileData);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Follow a user
router.post('/:id/follow', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.following.includes(req.params.id)) {
      return res.status(400).json({ error: 'You are already following this user' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $push: { following: req.params.id }
    });

    await User.findByIdAndUpdate(req.params.id, {
      $push: { followers: req.user.id }
    });

    const io = req.app.get('io');
    io.to(`user:${req.params.id}`).emit('followerUpdate', {
      userId: req.user.id,
      action: 'follow'
    });
    io.to(`user:${req.user.id}`).emit('followingUpdate', {
      userId: req.params.id,
      action: 'follow'
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unfollow a user
router.post('/:id/unfollow', auth, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'You cannot unfollow yourself' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { following: req.params.id }
    });

    await User.findByIdAndUpdate(req.params.id, {
      $pull: { followers: req.user.id }
    });

    const io = req.app.get('io');
    io.to(`user:${req.params.id}`).emit('followerUpdate', {
      userId: req.user.id,
      action: 'unfollow'
    });
    io.to(`user:${req.user.id}`).emit('followingUpdate', {
      userId: req.params.id,
      action: 'unfollow'
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/', auth, async (req, res) => {
  try {
    const { fullName, bio, isPrivate } = req.body;
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Alternate update profile (by userId)
router.put('/:userId/update', auth, async (req, res) => {
  try {
    const { username, bio, profilePic } = req.body;
    const updateData = {};
    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePic) updateData.profilePic = profilePic;

    const updatedProfile = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true }
    );

    res.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload Profile Picture
router.post('/upload', auth, upload.single('profilePic'), async (req, res) => {
  try {
    const userId = req.user.id;
    const profilePicUrl = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(userId, { profilePic: profilePicUrl });

    res.json({ profilePic: profilePicUrl });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users
router.get('/search/:query', auth, async (req, res) => {
  try {
    const query = req.params.query;
    const userId = req.user._id;

    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    }).select('_id username profilePic followers');

    const usersWithFollowing = users.map(user => ({
      ...user.toObject(),
      isFollowing: user.followers.includes(userId)
    }));

    res.json(usersWithFollowing);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get followers
router.get('/:id/followers', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('followers').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const followers = await User.find({ _id: { $in: user.followers } })
      .select('_id username fullName profilePic followers')
      .lean();

    const result = followers.map(f => ({
      ...f,
      isFollowing: f.followers.includes(req.user.id)
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get following
router.get('/:id/following', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('following').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const following = await User.find({ _id: { $in: user.following } })
      .select('_id username fullName profilePic followers')
      .lean();

    const result = following.map(f => ({
      ...f,
      isFollowing: f.followers.includes(req.user.id)
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
