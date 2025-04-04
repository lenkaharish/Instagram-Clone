const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required:true, unique: true ,trim:true},
    email: { 
        type: String, 
        required: true, 
        unique: true,
        match: /^[a-zA-Z0-9]+@[a-zA-Z]+\.[a-zA-Z]+$/,
        trim:true
    },
    password: { type: String, required: true, select: false },
    fullName: { type: String, trim:true },
    phoneNumber: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    dateOfBirth: { type: Date },
    bio: { type: String }, 
    otp: { type: String, select:false},
    otpExpiry: { type: Date, select:false },
    isOtpVerified: { type: Boolean, default: false, select: true },
    imageUrl: { type: String }
    },
{
    timestamps:true
});


userSchema.pre('save', async function (next) {
    try {

        if (!this.isModified('password')) return next();
        console.log('Original Password Before Hashing:', this.password);
        this.password = await bcrypt.hash(this.password, 10);
        console.log('Password hashed successfully:', this.password);
        next();
    } catch (err) {
        console.error('Error hashing password:', err);
        next(err);
    }
});
module.exports = mongoose.model('User', userSchema);
