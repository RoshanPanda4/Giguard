const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

exports.signup = async (req, res) => {
    try {
        const { name, phone, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = "user_" + Date.now();

        await db.collection('users').doc(userId).set({
            name,
            phone,
            password: hashedPassword
        });

        res.json({ success: true });

    } catch {
        res.status(500).json({ error: "Signup failed" });
    }
};

exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        const snapshot = await db.collection('users')
            .where('phone', '==', phone).get();

        if (snapshot.empty) {
            return res.status(401).json({ error: "User not found" });
        }

        let userDoc;
        snapshot.forEach(doc => userDoc = doc);

        const user = userDoc.data();

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: "Wrong password" });
        }

        const token = jwt.sign(
            { userId: userDoc.id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            token,
            userId: userDoc.id,
            name: user.name
        });

    } catch {
        res.status(500).json({ error: "Login failed" });
    }
};