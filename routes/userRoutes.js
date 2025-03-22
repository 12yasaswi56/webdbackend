const express = require("express");
const User = require("../models/User");

const router = express.Router();


// Follow a User
router.post("/:userId/follow", async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentUserId } = req.body;
    const user = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!user.followers.includes(currentUserId)) {
      user.followers.push(currentUserId);
      currentUser.following.push(userId);
      await user.save();
      await currentUser.save();
      res.json({ message: "Followed successfully!" });
    } else {
      res.json({ message: "Already following" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error following user" });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    }).select('username profilePic');
    
    res.status(200).json(users);
  } catch (err) {
    console.error('Error searching users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});




module.exports = router;
