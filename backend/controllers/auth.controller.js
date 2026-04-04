const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

// ============================
// SIGNUP
// ============================
exports.signup = async (req, res) => {
    try {
        const { name, phone, password, platform, zone, income } = req.body;

        if (!name || !phone || !password) {
            return res.status(400).json({ error: "All fields required" });
        }

        const cleanPhone = phone.trim();

        // Check if user already exists
        const existing = await db.collection('users')
            .where('phone', '==', cleanPhone)
            .limit(1)
            .get();

        if (!existing.empty) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const userId = "user_" + Date.now();

        await db.collection('users').doc(userId).set({
            name,
            phone: cleanPhone,
            password: hashedPassword,
            platform: platform || "Blinkit",
            zone: zone || "Patia",
            income: parseFloat(income) || 1200,
            createdAt: new Date()
        });

        res.json({
            success: true,
            message: "User created"
        });

    } catch (err) {
        console.error("SIGNUP ERROR:", err);
        res.status(500).json({ error: "Signup failed" });
    }
};

// ============================
// LOGIN
// ============================
exports.login = async (req, res) => {
    try {
        const phone = req.body.phone?.trim();
        const password = req.body.password;

        if (!phone || !password) {
            return res.status(400).json({ error: "Phone and password required" });
        }

        console.log("Login attempt:", phone);

        const snapshot = await db.collection('users')
            .where('phone', '==', phone)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(401).json({ error: "User not found" });
        }

        const userDoc = snapshot.docs[0];
        const user = userDoc.data();

        console.log("User found:", user.name);

        // Compare password
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ error: "Wrong password" });
        }

        // Create JWT token
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

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        res.status(500).json({ error: "Login failed" });
    }
};