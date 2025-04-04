const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, },
    content: { type: String, trim: true},
    mediaUrl: { type: String, required: true,trim: true, },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    createdAt: { type: Date, default: Date.now },
    likes: { type: mongoose.Schema.Types.ObjectId, ref:'Like' },
    comments:{ type:mongoose.Schema.Types.ObjectId, ref:'Comment'}

});

module.exports = mongoose.model('Post', postSchema);
