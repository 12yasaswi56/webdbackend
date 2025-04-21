const express = require('express');
const router = express.Router();
const Reel = require('../models/Reel');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('../cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage for videos
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'social_app_reels',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv'],
    format: 'mp4',
    transformation: [{ quality: 'auto' }]
  }
});

const upload = multer({ storage });

// Upload a new reel
router.post('/', auth, upload.single('video'), async (req, res) => {
  try {
    const { caption, tags, musicTitle, musicArtist, duration } = req.body;
    
    // Generate thumbnail URL (Cloudinary can generate this from the video)
    const thumbnailUrl = req.file.path.replace(/\.[^/.]+$/, '.jpg');
    
    const reel = new Reel({
      user: req.user._id,
      videoUrl: req.file.path,
      thumbnailUrl,
      caption,
      tags: JSON.parse(tags || '[]'),
      music: {
        title: musicTitle,
        artist: musicArtist
      },
      duration: parseFloat(duration)
    });

    await reel.save();
    res.status(201).json(reel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all reels
router.get('/', auth, async (req, res) => {
  try {
    // Get reels from users the current user follows
    const user = await User.findById(req.user._id).populate('following');
    const followingIds = user.following.map(u => u._id);
    
    const reels = await Reel.find({
      $or: [
        { user: { $in: followingIds } },
        { user: req.user._id }
      ]
    })
    .populate('user', 'username profilePic')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json(reels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single reel
router.get('/:id', auth, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id)
      .populate('user', 'username profilePic')
      .populate('comments.user', 'username profilePic');

    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    // Add view if user hasn't viewed it yet
    if (!reel.views.includes(req.user._id)) {
      reel.views.push(req.user._id);
      await reel.save();
    }

    res.json(reel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like a reel
router.post('/:id/like', auth, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    // Check if already liked
    if (reel.likes.includes(req.user._id)) {
      return res.status(400).json({ error: 'Reel already liked' });
    }

    reel.likes.push(req.user._id);
    await reel.save();

    // Emit socket event for real-time update
    req.app.get('socketio').emit('reelLikeUpdate', {
      reelId: reel._id,
      likes: reel.likes
    });

    res.json(reel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unlike a reel
router.post('/:id/unlike', auth, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    // Check if not liked
    if (!reel.likes.includes(req.user._id)) {
      return res.status(400).json({ error: 'Reel not liked' });
    }

    reel.likes = reel.likes.filter(id => id.toString() !== req.user._id.toString());
    await reel.save();

    // Emit socket event for real-time update
    req.app.get('socketio').emit('reelLikeUpdate', {
      reelId: reel._id,
      likes: reel.likes
    });

    res.json(reel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment to reel
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    const comment = {
      user: req.user._id,
      text
    };

    reel.comments.push(comment);
    await reel.save();

    // Populate user info for the new comment
    const populatedComment = {
      ...comment.toObject ? comment.toObject() : comment,
      user: {
        _id: req.user._id,
        username: req.user.username,
        profilePic: req.user.profilePic
      }
    };

    // Emit socket event for real-time update
    req.app.get('socketio').emit('newReelComment', {
      reelId: reel._id,
      comment: populatedComment
    });

    res.json(populatedComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Share a reel
router.post('/:id/share', auth, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.id);
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    // Check if already shared
    if (reel.shares.includes(req.user._id)) {
      return res.status(400).json({ error: 'Reel already shared' });
    }

    reel.shares.push(req.user._id);
    await reel.save();

    res.json(reel);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a reel
router.delete('/:id', auth, async (req, res) => {
  try {
    const reel = await Reel.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!reel) {
      return res.status(404).json({ error: 'Reel not found or unauthorized' });
    }

    // Delete from Cloudinary
    const publicId = reel.videoUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`social_app_reels/${publicId}`, { resource_type: 'video' });
    await cloudinary.uploader.destroy(`social_app_reels/${publicId}`, { resource_type: 'image' });

    res.json({ message: 'Reel deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;