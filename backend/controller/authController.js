const jwt = require("jsonwebtoken");
const UserModel = require("../schema/userSchema");
const client = require("../configuration/googleAuth");


const userSecretKEY = process.env.JWTuserSecretKEY

exports.googleLogin = async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, picture } = ticket.getPayload();

        let user = await UserModel.findOne({ email });

        if (!user) {
            user = await UserModel.create({
                name,
                email,
                profileImage: { imageURL: picture },
                provider: "google",
            });
        }

        const jwtToken  = jwt.sign(
            { 
                id: user._id,
                name: user.name,
                email: user.email
            }, 
            userSecretKEY
        );

        res.json({ 
            message: 'Login successful',
            token: jwtToken, 
            user 
        });

    } catch (error) {
        console.error("Login Error:", error)
        res.status(500).json({ message: 'Server error during login', error: error.message })
    }
};