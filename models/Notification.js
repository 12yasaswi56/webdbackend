// const mongoose = require("mongoose");

// const notificationSchema = new mongoose.Schema({
//     recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     type: { type: String, required: true },
//     content: { type: String, required: true },
//     postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
//     read: { type: Boolean, default: false }
//   });

// module.exports = mongoose.model("Notification", notificationSchema);



const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    senderId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    type: { 
        type: String, 
        enum: [
            'like', 
            'comment', 
            'follow', 
            'message', 
            'mention', 
            'tag', 
            'story_like', 
            'post_comment',
            'save'
        ], 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    postId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Post' 
    },
    commentId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Comment' 
    },
    isRead: { 
        type: Boolean, 
        default: false 
    },
    senderPic: { 
        type: String 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);