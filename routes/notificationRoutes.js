const express = require("express");
const Notification = require("../models/Notification");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

// Get user notifications with additional filtering and population
router.get("/", authMiddleware, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user.id })
            .populate({
                path: "senderId",
                select: "username profilePic"
            })
            .populate({
                path: "postId",
                select: "image caption"
            })
            .sort({ createdAt: -1 })
            .limit(50);  // Limit to last 50 notifications

        res.json(notifications);
    } catch (error) {
        console.error("Notification fetch error:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// Mark notifications as read
router.put("/read", authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ message: "Notifications marked as read" });
    } catch (error) {
        console.error("Mark notifications read error:", error);
        res.status(500).json({ error: "Failed to mark notifications" });
    }
});

// Get unread notification count
router.get("/unread-count", authMiddleware, async (req, res) => {
    try {
        const unreadCount = await Notification.countDocuments({ 
            userId: req.user.id, 
            isRead: false 
        });
        res.json({ unreadCount });
    } catch (error) {
        console.error("Unread count error:", error);
        res.status(500).json({ error: "Failed to get unread count" });
    }
});

module.exports = router;