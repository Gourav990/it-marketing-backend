const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User.js");
const router = express.Router();
const sendEmail=require("../utils/sendEmail.js");
const bcrypt = require("bcryptjs");
const {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile
} = require("../controllers/authController.js");



// Auth routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/me", getUserProfile);


// ✅ Forgot Password - Send Reset Link
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // ✅ Save token and expiry in DB
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();

    // ✅ Generate reset link with correct variable name
    const resetLink = `${process.env.FRONTEND_URL|| ""}/reset-password/${token}`;

    const html = `
      <p>Hello ${user.name || "User"},</p>
      <p>You requested to reset your password.</p>
      <p>
        Click <a href="${resetLink}" target="_blank">here</a> to reset your password.
        This link will expire in 15 minutes.
      </p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    await sendEmail(user.email, "Reset your password", html);

    res.json({ message: "Password reset link sent to your email" });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Reset Password - Update the password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      _id: decoded.id,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // ✅ Clear the reset token
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(400).json({ message: "Invalid or expired token" });
  }
});


module.exports = router;
