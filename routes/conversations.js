const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

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
router.post('/', async (req, res) => {
  try {
    const { participants } = req.body;
    
    if (!participants || participants.length < 2) {
      return res.status(400).json({ error: 'At least 2 participants are required' });
    }
    
    // Check if conversation already exists between these users
    const existingConversation = await Conversation.findOne({
      participants: { $all: participants, $size: participants.length }
    }).populate({
      path: 'participants',
      select: 'username profilePic'
    });
    
    if (existingConversation) {
      return res.status(200).json(existingConversation);
    }
    
    // Create a new conversation
    const newConversation = new Conversation({
      participants
    });
    
    await newConversation.save();
    
    // Populate participants info
    const populatedConversation = await Conversation.findById(newConversation._id)
      .populate({
        path: 'participants',
        select: 'username profilePic'
      });
    
    res.status(201).json(populatedConversation);
  } catch (err) {
    console.error('Error creating conversation:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;