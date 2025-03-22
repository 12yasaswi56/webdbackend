// const express = require("express");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");
// const axios = require("axios");

// const router = express.Router();

// // Login
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     console.log("🔍 Login attempt for email:", email);
    
//     // Find user by email (case-insensitive search)
//     // const user = await User.findOne({ email: { $regex: new RegExp('^' + email + '$', 'i') } });
//     const user = await User.findOne({ email: email.toLowerCase() });
//     console.log("User found in database:", user);
//     if (!user) {
//       console.log("❌ User not found for email:", email);
//       return res.status(400).json({ message: "Invalid credentials" });
//     }
    
//     console.log("✅ User found:", user.username);
    
//     // Compare passwords
//     const isMatch = await bcrypt.compare(password, user.password);
//     console.log("🔐 Password match result:", isMatch);
    
//     if (!isMatch) {
//       console.log("❌ Password mismatch for user:", user.username);
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     // Generate JWT token
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
//     console.log("🎟️ JWT token generated successfully");

//     // Send response
//     res.json({ 
//       token, 
//       user: { 
//         _id: user._id, 
//         username: user.username, 
//         email: user.email, 
//         cometchatUID: user.cometchatUID 
//       } 
//     });
    
//     console.log("✅ Login successful for:", user.username);
//   } catch (error) {
//     console.error("⚠️ Server error during login:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Signup
// router.post("/signup", async (req, res) => {
//   const { username, email, password } = req.body;

//   try {
//     console.log("🔍 Signup attempt for email:", email);
    
//     // Check if user exists (case-insensitive search)
//     const existingUser = await User.findOne({ email: { $regex: new RegExp('^' + email + '$', 'i') } });
//     if (existingUser) {
//       console.log("❌ Email already exists:", email);
//       return res.status(400).json({ error: "Email already exists. Please use a different email." });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);
//     console.log("🔒 Password hashed successfully");

//     // Generate CometChat UID (using username)
//     const cometchatUID = username.toLowerCase();

//     // Create new user
//     const newUser = new User({ 
//       username, 
//       email: email.toLowerCase(), // Store email in lowercase for consistency
//       password: hashedPassword, 
//       cometchatUID 
//     });

//     await newUser.save();
//     console.log("✅ New user created:", newUser.username);

//     res.status(201).json({ message: "User registered successfully" });
//   } catch (error) {
//     console.error("❌ Signup Error:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;




const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Login router
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    console.log("🔍 Login attempt for email:", email);
    console.log("🔑 Login received password:", password);
    
    // Find user by email (lowercase)
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log("❌ User not found for email:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    console.log("✅ User found:", user.username);
    console.log("🔒 Stored password hash:", user.password);
    
    // Try comparing with a fresh hash to verify bcrypt is working properly
    const salt = await bcrypt.genSalt(10);
    const freshHash = await bcrypt.hash(password, salt);
    console.log("🔄 Fresh hash of same password:", freshHash);
    const testMatch = await bcrypt.compare(password, freshHash);
    console.log("🧪 Test match with fresh hash:", testMatch);
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔐 Password match result:", isMatch);
    
    if (!isMatch) {
      console.log("❌ Password mismatch for user:", user.username);
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    console.log("🎟️ JWT token generated successfully");
    
    // Send response
    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        cometchatUID: user.cometchatUID
      }
    });
    
    console.log("✅ Login successful for:", user.username);
  } catch (error) {
    console.error("⚠️ Server error during login:", error);
    res.status(500).json({ error: error.message });
  }
});

// Signup router with direct password handling and explicit logging
router.post("/signup", async (req, res) => {
  let { username, email, password } = req.body;
  
  try {
    console.log("🔍 Signup attempt for email:", email);
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log("❌ Email already exists:", email);
      return res.status(400).json({ message: "Email already exists. Please use a different email." });
    }
    
    // Create new user with plain password (will be hashed by middleware)
    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password: password, // Don't hash here, let the middleware do it
      cometchatUID: username.toLowerCase()
    });
    
    // Save the user
    const savedUser = await newUser.save();
    console.log("✅ New user created:", savedUser.username);
    
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("❌ Signup Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Test route to verify bcrypt functionality independently
router.post("/test-bcrypt", async (req, res) => {
  const { password } = req.body;
  
  try {
    console.log("🧪 Testing bcrypt with password:", password);
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log("🔒 Generated hash:", hash);
    
    // Compare the password
    const isMatch = await bcrypt.compare(password, hash);
    console.log("🔐 Match result:", isMatch);
    
    // Try with different salt to confirm randomness
    const salt2 = await bcrypt.genSalt(10);
    const hash2 = await bcrypt.hash(password, salt2);
    console.log("🔄 Second hash with different salt:", hash2);
    
    // Cross-compare to make sure both hashes work
    const crossMatch1 = await bcrypt.compare(password, hash2);
    const crossMatch2 = await bcrypt.compare(password, hash);
    
    res.json({
      originalPassword: password,
      hash: hash, 
      secondHash: hash2,
      mainMatchResult: isMatch,
      crossMatch1: crossMatch1,
      crossMatch2: crossMatch2
    });
  } catch (error) {
    console.error("❌ Bcrypt Test Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// A debug route to test a specific user's password
router.post("/debug-user-password", async (req, res) => {
  const { email, testPassword } = req.body;
  
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log("🔍 Debug: Testing password for user:", user.username);
    console.log("🔒 Stored hash:", user.password);
    
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log("🔐 Password match result:", isMatch);
    
    // Create a new hash for comparison
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(testPassword, salt);
    
    res.json({
      username: user.username,
      storedHash: user.password,
      testPassword: testPassword,
      matchResult: isMatch,
      newHashForComparison: newHash
    });
  } catch (error) {
    console.error("❌ Debug Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;





















