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




// routes/messages.js
router.post('/', async (req, res) => {
  try {
    const { conversationId, senderId, content,media, postReference } = req.body;
    
    console.log('Received message data:', {
      conversationId,
      senderId,
      content,
      postReference: postReference || 'none'
    });

    if (!conversationId || !senderId) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    if (!content && (!media || media.length === 0) && !postReference) {
      return res.status(400).json({ error: 'Message must have content, media, or post reference' });
    }

    // Create message object with all fields
    // const messageData = {
    //   conversationId,
    //   senderId,
    //   content: content || '',
    //   media: media || []
    // };
    const messageData = {
      conversationId,
      senderId,
      content: content || '',
      media: (media || []).map(file => ({
        url: file.url,
        type: file.type,
        filename: file.filename || file.url.split('/').pop(),
        duration: file.duration // Add duration if available
      }))
    };
 // Ensure media array has proper structure
 if (messageData.media && messageData.media.length > 0) {
  messageData.media = messageData.media.map(file => ({
    url: file.url,
    type: file.type,
    filename: file.filename || path.basename(file.url)
  }));
}

    // Add postReference if provided
    if (postReference && postReference.postId) {
      messageData.postReference = {
        postId: postReference.postId,
        imageUrl: postReference.imageUrl,
        caption: postReference.caption || 'No caption',
        userId: postReference.userId,
        username: postReference.username
      };
    }

    const newMessage = new Message(messageData);
    const savedMessage = await newMessage.save();

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

    // Emit socket event with full message data
    req.app.get('io').to(conversationId).emit('newMessage', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Add these routes to your messages.js file

// Delete message (soft delete)
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body; // The user requesting deletion

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender or has admin rights
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this message' });
    }

    // Soft delete - mark as deleted but keep in database
    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();

    // Update conversation's latest message if needed
    const conversation = await Conversation.findById(message.conversationId)
      .populate('latestMessage');
    
    if (conversation.latestMessage?._id.toString() === messageId) {
      // Find the most recent non-deleted message
      const prevMessage = await Message.findOne({
        conversationId: message.conversationId,
        deleted: { $ne: true },
        _id: { $ne: messageId }
      }).sort({ createdAt: -1 });
      
      await Conversation.findByIdAndUpdate(message.conversationId, {
        latestMessage: prevMessage?._id || null
      });
    }

    // Emit socket event to notify clients
    req.app.get('io').to(message.conversationId.toString()).emit('messageDeleted', {
      messageId,
      conversationId: message.conversationId,
      newLatestMessage: conversation.latestMessage
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unsend message (hard delete within time window)
router.delete('/unsend/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;
    const UNSEND_WINDOW = 5 * 60 * 1000; // 5 minutes in milliseconds

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized to unsend this message' });
    }

    // Check if within unsend window
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    if (messageAge > UNSEND_WINDOW) {
      return res.status(400).json({ 
        error: 'Message can only be unsent within 5 minutes of sending' 
      });
    }

    // Hard delete the message
    await Message.deleteOne({ _id: messageId });

    // Update conversation's latest message if needed
    const conversation = await Conversation.findById(message.conversationId)
      .populate('latestMessage');
    
    if (conversation.latestMessage?._id.toString() === messageId) {
      // Find the most recent message
      const prevMessage = await Message.findOne({
        conversationId: message.conversationId,
        _id: { $ne: messageId }
      }).sort({ createdAt: -1 });
      
      await Conversation.findByIdAndUpdate(message.conversationId, {
        latestMessage: prevMessage?._id || null
      });
    }

    // Emit socket event to notify clients
    req.app.get('io').to(message.conversationId.toString()).emit('messageDeleted', {
      messageId,
      conversationId: message.conversationId,
      newLatestMessage: conversation.latestMessage
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error unsending message:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;