// middleware/authenticateToken.js
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.status(401).json({ message: 'No token provided. Please log in to access this resource.' });
    }
    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token. Please log in again.' });
        }
        req.user = user;
        // Call the next middleware or route handler
        next();
    });
};

module.exports = authenticateToken;
