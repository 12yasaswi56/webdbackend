const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

const multer = require("multer");




const { CloudinaryStorage } = require('multer-storage-cloudinary');

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
const upload = multer({ storage });
// Get all conversations for a user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Find all conversations that include this user
    const conversations = await Conversation.find({
      participants: userId
    }).populate({
      path: 'participants',
      select: 'username profilePic'
    });
    
    // Get the latest message for each conversation
    const conversationsWithLatestMessage = await Promise.all(
      conversations.map(async (conversation) => {
        const latestMessage = await Message.findOne({ 
          conversationId: conversation._id 
        })
        .sort({ createdAt: -1 })
        .populate({
          path: 'senderId',
          select: 'username'
        });
        
        return {
          ...conversation.toObject(),
          latestMessage
        };
      })
    );
    
    res.status(200).json(conversationsWithLatestMessage);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new conversation
// router.post('/', async (req, res) => {
//   try {
//     const { participants } = req.body;
    
//     if (!participants || participants.length < 2) {
//       return res.status(400).json({ error: 'At least 2 participants are required' });
//     }
    
//     // Check if conversation already exists between these users
//     const existingConversation = await Conversation.findOne({
//       participants: { $all: participants, $size: participants.length }
//     }).populate({
//       path: 'participants',
//       select: 'username profilePic'
//     });
    
//     if (existingConversation) {
//       return res.status(200).json(existingConversation);
//     }
    
//     // Create a new conversation
//     const newConversation = new Conversation({
//       participants
//     });
    
//     await newConversation.save();
    
//     // Populate participants info
//     const populatedConversation = await Conversation.findById(newConversation._id)
//       .populate({
//         path: 'participants',
//         select: 'username profilePic'
//       });
    
//     res.status(201).json(populatedConversation);
//   } catch (err) {
//     console.error('Error creating conversation:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// Create a new conversation (updated to handle groups)
router.post('/', async (req, res) => {
  console.log('Creating conversation:', {
    body: req.body,
    isGroup: req.body.isGroup,
    participantsCount: req.body.participants?.length
  });
  try {
    const { participants, isGroup, groupName, groupAdmin } = req.body;
    
    // Validation for both direct and group chats
    if (!participants || participants.length < 2) {
      return res.status(400).json({ error: 'At least 2 participants are required' });
    }

    // For group chats, additional validation
    if (isGroup) {
      if (!groupName || groupName.trim() === '') {
        return res.status(400).json({ error: 'Group name is required' });
      }
      if (!groupAdmin || !participants.includes(groupAdmin)) {
        return res.status(400).json({ error: 'Group admin must be a participant' });
      }
    } else {
      // For direct chats, check if conversation already exists
      const existingConversation = await Conversation.findOne({
        participants: { $all: participants, $size: participants.length },
        isGroup: false
      }).populate({
        path: 'participants',
        select: 'username profilePic'
      });
      
      if (existingConversation) {
        return res.status(200).json(existingConversation);
      }
    }

    // Create a new conversation
    const newConversation = new Conversation({
      participants,
      isGroup: isGroup || false,
      ...(isGroup && { 
        groupName,
        groupAdmin 
      })
    });

    await newConversation.save();
    
    // Populate participants info
    const populatedConversation = await Conversation.findById(newConversation._id)
      .populate({
        path: 'participants',
        select: 'username profilePic'
      })
      .populate({
        path: 'groupAdmin',
        select: 'username profilePic'
      });

    res.status(201).json(populatedConversation);
  } catch (err) {
    console.error('Error creating conversation:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new route to get user's followers for group creation
router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('followers', 'username profilePic');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json(user.followers);
  } catch (err) {
    console.error('Error fetching followers:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add this new route to get full conversation details
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findById(conversationId)
      .populate({
        path: 'participants',
        select: 'username profilePic'
      })
      .populate({
        path: 'groupAdmin',
        select: 'username profilePic'
      })
      .populate({
        path: 'latestMessage',
        populate: {
          path: 'senderId',
          select: 'username profilePic'
        }
      });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.status(200).json(conversation);
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// routes/conversations.js
router.post('/:conversationId/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // The file info is now in req.file, not req.files.image
    // And with Cloudinary storage, the upload already happened
    const imageUrl = req.file.path; // Or req.file.secure_url depending on how your Cloudinary setup works
    
    // Update conversation with Cloudinary URL
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.conversationId,
      { groupImage: imageUrl },
      { new: true }
    ).populate('participants', 'username profilePic');

    res.status(200).json(conversation);
  } catch (err) {
    console.error('Error uploading group image:', err);
    res.status(500).json({ 
      error: 'Failed to upload image',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// routes/conversations.js

// Update group info
router.put('/:conversationId', async (req, res) => {
  try {
    const { groupName, groupDescription, groupTheme } = req.body;
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.conversationId,
      { groupName, groupDescription, groupTheme },
      { new: true }
    ).populate('participants groupAdmin');
    
    res.status(200).json(conversation);
  } catch (err) {
    console.error('Error updating group:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add member to group
router.post('/:conversationId/members', async (req, res) => {
  try {
    const { userId } = req.body;
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.conversationId,
      { $addToSet: { participants: userId } },
      { new: true }
    ).populate('participants');
    
    res.status(200).json(conversation);
  } catch (err) {
    console.error('Error adding member:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove member from group
router.delete('/:conversationId/members/:userId', async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.conversationId,
      { $pull: { participants: req.params.userId } },
      { new: true }
    ).populate('participants');
    
    res.status(200).json(conversation);
  } catch (err) {
    console.error('Error removing member:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change group admin
router.patch('/:conversationId/admin', async (req, res) => {
  try {
    const { newAdminId } = req.body;
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.conversationId,
      { groupAdmin: newAdminId },
      { new: true }
    ).populate('participants groupAdmin');
    
    res.status(200).json(conversation);
  } catch (err) {
    console.error('Error changing admin:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add this route to conversations.js (before module.exports)
router.delete('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body; // User who is deleting the conversation

    // Find the conversation first
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // For groups, only admin can delete
    if (conversation.isGroup) {
      if (conversation.groupAdmin.toString() !== userId) {
        return res.status(403).json({ error: 'Only group admin can delete the group' });
      }
    } else {
      // For direct chats, check if user is participant
      if (!conversation.participants.includes(userId)) {
        return res.status(403).json({ error: 'Not a participant of this conversation' });
      }
    }

    // Delete all messages in this conversation first
    await Message.deleteMany({ conversationId });

    // Then delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (err) {
    console.error('Error deleting conversation:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports = router;