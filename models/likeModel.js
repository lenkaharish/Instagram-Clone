const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: false, default: null},
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: false, default: null},
    story: {type: mongoose.Schema.Types.ObjectId, ref: 'Story', required: false, default: null},
}, {
    timestamps: true
});

// Add separate unique indexes for each case:
likeSchema.index({ user: 1, post: 1 }, { unique: true , partialFilterExpression: {post:{ $type: 'objectId'}} });
likeSchema.index({ user: 1, story: 1 }, {unique: true, partialFilterExpression:{story:{ $type: 'objectId'}} });
likeSchema.index({ user: 1, comment: 1}, { unique: true, partialFilterExpression:{comment:{ $type: 'objectId'}}});

module.exports = mongoose.model('Like', likeSchema);
