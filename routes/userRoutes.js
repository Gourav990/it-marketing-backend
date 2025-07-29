const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { authenticateUser } = require("../middleware/authMiddleware");

// ✅ Update user profile (name, password, company)
// ✅ Update user profile (name, company, password - with validation)
router.put("/users/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, password, oldPassword, company } = req.body;

    // 🔒 Check if user is authorized
    if (req.user._id.toString() !== id) {
      return res.status(403).json({ message: "Unauthorized to update this profile" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updates = {};

    if (name) updates.name = name;
    if (company !== undefined) updates.company = company;

    // 🔐 Secure password change with old password verification
    if (password && password.trim() !== "") {
      if (!oldPassword || oldPassword.trim() === "") {
        return res.status(400).json({ message: "Current password is required to change password" });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).select("-password");

    res.status(200).json({ message: "Profile updated", user: updatedUser });
  } catch (err) {
    console.error("Update error:", err.message);
    res.status(500).json({ error: "Failed to update profile" });
  }
});


// ✅ Delete user account
router.delete("/users/:id", authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() !== id) {
      return res.status(403).json({ message: "Unauthorized to delete this account" });
    }

    await User.findByIdAndDelete(id);
    res.clearCookie("token");
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// ✅ Get logged-in user details
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (err) {
    console.error("Get /me error:", err.message);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
});


module.exports = router;
