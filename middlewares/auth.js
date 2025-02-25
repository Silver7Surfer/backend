import jwt from 'jsonwebtoken';
import 'dotenv/config';
const SECRET_KEY = process.env.MONITOR_SECRET_KEY;

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication token is required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

export const authenticateMonitor = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token || token !== `Bearer ${SECRET_KEY}`) {
        return res.status(403).json({ success: false, message: "Forbidden: Unauthorized source" });
    }
    next();
};