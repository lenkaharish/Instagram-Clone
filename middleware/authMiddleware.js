const jwt = require('jsonwebtoken');

const SECRET_KEY = "YOUR_SECRET_KEY";

const tokenBlacklist = [];

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    if (tokenBlacklist.includes(token)) {
        return res.status(401).json({ message: 'Invalid token (logged out)' });
    }


    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        console.log('Decoded User:', req.user);
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

const blacklistToken = (token) => {
    tokenBlacklist.push(token);
    console.log('Token blacklisted:', token);
};

module.exports= { authMiddleware, blacklistToken };



