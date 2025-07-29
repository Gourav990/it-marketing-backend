const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "User not logged in or token expired" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user; // Attach full user to request
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ message: "User not logged in or token expired" });
  }
};

module.exports = { authenticateUser };
