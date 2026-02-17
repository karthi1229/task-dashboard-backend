const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

/* =========================
   REGISTER
========================= */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1,$2,$3)",
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
{ expiresIn: "1h" }

const authMiddleware = require("../middleware/auth");

/* =========================
   GET PROFILE
========================= */
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id=$1",
      [req.userId]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
/* =========================
   UPDATE PROFILE
========================= */
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name required" });
    }

    const result = await pool.query(
      "UPDATE users SET name=$1 WHERE id=$2 RETURNING id, name, email",
      [name, req.userId]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
