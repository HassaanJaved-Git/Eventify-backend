const jwt = require("jsonwebtoken");

const UserModel = require("../schema/userSchema");
const client = require("../configuration/googleAuth");

const userSecretKEY = process.env.JWTuserSecretKEY;

exports.googleLogin = async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { sub, name, email, picture } = ticket.getPayload();

        let user = await UserModel.findOne({ email });

        if (!user) {
            const userName = email.split('@')[0];
            user = await UserModel.create({
                name,
                email,
                profileImage: { imageURL: picture },
                provider: "google",
                googleId: sub,
                userName
            });
        }

        let jwtToken  = jwt.sign(
            { 
                id: user._id,
            }, 
            userSecretKEY
        );

        res.json({ 
            message: 'Login successful',
            token: jwtToken, 
            user 
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};