const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// Get all messages for a conversation
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const messages = await Message.find({ 
      conversationId 
    })
    .sort({ createdAt: 1 })
    .populate({
      path: 'senderId',
      select: 'username profilePic'
    });
    
    console.log('Messages with post references:', 
      messages.map(m => ({
        id: m._id,
        hasPostRef: !!m.postReference?.postId,
        postRef: m.postReference?.postId ? JSON.stringify(m.postReference) : 'null'
      }))
    );
    
    res.status(200).json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a new message
router.post('/', async (req, res) => {
  try {
    const { conversationId, senderId, content } = req.body;
    
    if (!conversationId || !senderId || !content) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Create the new message
    const newMessage = new Message({
      conversationId,
      senderId,
      content
    });
    
    const savedMessage = await newMessage.save();
    
    // Populate sender info
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate({
        path: 'senderId',
        select: 'username profilePic'
      });
    
    // Update conversation's updatedAt time
    await Conversation.findByIdAndUpdate(conversationId, {
      updatedAt: Date.now()
    });
    
    // Emit socket event for real-time updates
    req.app.get('io').to(conversationId).emit('newMessage', populatedMessage);
    
    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Server error' });
  }
});






router.post("/", async (req, res) => {
  try {
      const { conversationId, senderId, content } = req.body;

      const newMessage = new Message({ conversationId, senderId, content });
      const savedMessage = await newMessage.save();

      const populatedMessage = await Message.findById(savedMessage._id)
          .populate("senderId", "username profilePic");

      const receiverId = await Conversation.findById(conversationId).select("members");
      const otherUserId = receiverId.members.find(id => id !== senderId);

      sendNotification(otherUserId, senderId, "sent you a message", "userProfilePicURL");

      res.status(201).json(populatedMessage);
  } catch (error) {
      res.status(500).json({ error: "Error sending message" });
  }
});







// In your backend's message routes file (e.g., routes/messages.js)

// Update your message POST route
router.post('/', async (req, res) => {
  try {
    const { conversationId, senderId, content, postReference } = req.body;
    
    console.log('Received post reference:', JSON.stringify(postReference));
    
    if (!conversationId || !senderId || !content) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Create the new message with explicit structure
    const newMessage = new Message({
      conversationId,
      senderId,
      content
    });
    
    // Add postReference explicitly with each field
    if (postReference && postReference.postId) {
      newMessage.postReference = {
        postId: postReference.postId,
        imageUrl: postReference.imageUrl,
        caption: postReference.caption
      };
      
      console.log('Added post reference to message:', JSON.stringify(newMessage.postReference));
    }
    
    const savedMessage = await newMessage.save();
    console.log('Saved message with post reference:', JSON.stringify(savedMessage));
    
    // Populate sender info
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate({
        path: 'senderId',
        select: 'username profilePic'
      });
    
    // Update conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      updatedAt: Date.now(),
      latestMessage: savedMessage._id
    });
    
    // Emit socket event for real-time updates
    req.app.get('io').to(conversationId).emit('newMessage', populatedMessage);
    
    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports = router;