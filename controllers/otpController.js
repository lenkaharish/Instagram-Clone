const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'lenkaharish6@gmail.com',
        pass: 'gvfb syyc xovc ksrq'
    }
});


const generateOtp = () => Math.floor(100000 + Math.random() * 900000);


const forgotPassword = async (req, res) => {
    // #swagger.tags= ['Users']
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = generateOtp();
        const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        user.isOtpVerified = false;
        await user.save();

        const mailOptions = {
            from: 'lenkaharish6@gmail.com',
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP code is ${otp}. It is valid for 10 minutes.`
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'OTP sent to your email' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const verifyOtp = async (req, res) => {
    // #swagger.tags= ['OTP']
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }
        

        const user = await User.findOne({ email }).select('+otp +otpExpiry');
        if (!user || !user.otp || !user.otpExpiry) {
            return res.status(400).json({ message: 'No OTP found or OTP expired' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        user.isOtpVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        console.log('OTP Verified and user updated:', user);

        return res.json({ message: 'OTP verified successfully' });
    } catch (error) {
        return res.status(500).json({message:"Internal server error",error: error.message });
    }
};

const confirmPassword = async (req, res) => {
    // #swagger.tags= ['Users']
    try {
        const { email, newPassword, confirmPassword } = req.body;

        if (!email || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const user = await User.findOne({ email }).select('+isOtpVerified +password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('User isOtpVerified Status:', user.isOtpVerified);


        if (!user.isOtpVerified) {
            return res.status(400).json({ message: 'Please verify OTP before resetting the password' });
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ message: 'New password cannot be the same as the old password' });
        }

        user.password = newPassword;
        user.isOtpVerified = false; 
        await user.save();

        console.log('User password updated in DB:', user.password);

        return res.json({ message: 'Password updated successfully' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

module.exports = {
    forgotPassword,
    verifyOtp,
    confirmPassword
};



