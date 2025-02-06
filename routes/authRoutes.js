const express = require("express");
const User = require("../models/User");
const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
    const { username, firstname, lastname, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Username already exists." });
        }
        const newUser = new User({ username, firstname, lastname, password });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        res.status(400).json({ error: "Username already exists." });
    }
});

// Login
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) {
        res.status(200).json({ message: "Login successful!" });
    } else {
        res.status(401).json({ error: "User name or password wrong." });
    }
});

module.exports = router;
