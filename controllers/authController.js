const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User.js");



// GET USER PROFILE (for Navbar)
const getUserProfile = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("name email company");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // console.log("getUserProfile");
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error in getUserProfile:", error.message);
    res.status(401).json({ message: "Unauthorized" });
  }
};


// REGISTER
const registerUser = async (req, res) => {
  try {
    console.log("register method called");
    const { name, company, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, company, email, password: hashedPassword });
    console.log("user data",newUser);

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error in registerUser:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // 🔥 Fix for local development cookies
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
       httpOnly: true,
       secure: true, // Always true on Render (HTTPS)
       sameSite: "None", // Must be "None" for cross-origin cookies
       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.status(200).json({ message: "Logged out successfully" });
    console.log("logged in",user);
    res.status(200).json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
        company: user.company, 
      },
      token
    });
  } catch (error) {
    console.error("Error in loginUser:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};



// LOGOUT
const logoutUser = (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logoutUser:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// EXPORT
module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
};
