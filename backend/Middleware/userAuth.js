const jwt = require('jsonwebtoken');

const UserModel = require("../schema/userSchema");

const userSecretKEY = process.env.JWTuserSecretKEY;

const authenticateUser = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log("authHeader:", authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided or malformed' });

    const token = authHeader.split(' ')[1];

    if (!token || token === 'undefined') return res.status(401).json({ error: 'Invalid token' });

    try {
        const decoded = jwt.verify(token, userSecretKEY);

        const user = UserModel.findById(decoded.id).select("-password");
        if (!user) return res.status(404).json({ error: 'Login User not registered.' });
        req.user = decoded; 
        next();
    } catch (err) {
        console.error("JWT Verification Error:", err);
        return res.status(403).json({ error: 'Token verification failed' });
    }
}
module.exports = authenticateUser;