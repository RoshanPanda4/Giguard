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

// ============================
// FORGOT PASSWORD
// ============================
exports.forgotPassword = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: "Phone required" });

        const userSnap = await db.collection('users').where('phone', '==', phone.trim()).limit(1).get();
        if (userSnap.empty) return res.status(404).json({ error: "User not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await db.collection('otp').doc(phone.trim()).set({
            otp,
            expiresAt,
            createdAt: new Date()
        });

        // In production, send via SMS. For now, return in response as requested.
        res.json({ success: true, message: "OTP sent", otp });

    } catch (err) {
        console.error("FORGOT PW ERROR:", err);
        res.status(500).json({ error: "Failed to process forgot password" });
    }
};

// ============================
// RESET PASSWORD
// ============================
exports.resetPassword = async (req, res) => {
    try {
        const { phone, otp, newPassword } = req.body;
        if (!phone || !otp || !newPassword) return res.status(400).json({ error: "All fields required" });

        const otpDoc = await db.collection('otp').doc(phone.trim()).get();
        if (!otpDoc.exists) return res.status(400).json({ error: "Invalid OTP session" });

        const otpData = otpDoc.data();
        if (otpData.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
        if (newPassword.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
        if (otpData.expiresAt.toDate() < new Date()) {
            return res.status(400).json({ error: "OTP expired" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const userSnap = await db.collection('users').where('phone', '==', phone.trim()).limit(1).get();
        
        if (userSnap.empty) return res.status(404).json({ error: "User not found" });

        await db.collection('users').doc(userSnap.docs[0].id).update({
            password: hashedPassword
        });

        // Delete OTP
        await db.collection('otp').doc(phone.trim()).delete();

        res.json({ success: true, message: "Password updated successfully" });

    } catch (err) {
        console.error("RESET PW ERROR:", err);
        res.status(500).json({ error: "Failed to reset password" });
    }
};