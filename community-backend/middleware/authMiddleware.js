const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verifying the user's authentication
const protect = (req, res, next) => {
    const authHeader = req.header('Authorization'); 
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Checking if the token contains the society context
        if (!decoded.societyId) {
            return res.status(403).json({
                message: 'Invalid token context. Society ID missing. Please log in again.'
            });
        }
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({
            message: 'Token is not valid'
        });
    }
};

// Allowing only admins to access the route
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            message: 'Access denied. Admins only.'
        });
    }
    next();
};

module.exports = {
    protect,
    adminOnly
};