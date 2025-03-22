const express = require("express");
const Notification = require("../models/Notification");
const router = express.Router();

router.get("/:userId", async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.params.userId })
            .populate("senderId", "username profilePic") // Populate sender details
            .sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

module.exports = router;
