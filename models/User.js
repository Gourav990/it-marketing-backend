// models/userModel.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    

    name: { type: String, required: true },
    company: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
     resetToken: String,
    resetTokenExpiry: Date,
   
   
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
