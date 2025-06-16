const jwt = require('jsonwebtoken');

const userSecretKEY = process.env.JWTuserSecretKEY;

const authenticateUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided or malformed' });
    }

    const token = authHeader.split(' ')[1];

    if (!token || token === 'undefined') {
        return res.status(401).json({ error: 'Invalid token' });
    }

    try {
        const decoded = jwt.verify(token, userSecretKEY);
        req.user = decoded; 
        next();
    } catch (err) {
        console.error("JWT Verification Error:", err);
        return res.status(403).json({ error: 'Token verification failed' });
    }
}
module.exports = authenticateUser;