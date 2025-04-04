const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
        user: {type: mongoose.Schema.Types.ObjectId,ref: "User", required: true},
        mediaUrl: {type: String, required: true},
        type: {type: String,
            enum: ["image", "video"], required: true },
        views: [{
                user: {type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                viewedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        createdAt: {type: Date, default: Date.now,
        },
    },
);

storySchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model("Story", storySchema);
