const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

/* =========================
   GET ALL TASKS
========================= */
router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE user_id=$1 ORDER BY created_at DESC",
      [req.userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   CREATE TASK
========================= */
router.post("/", auth, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title required" });
    }

    const result = await pool.query(
      "INSERT INTO tasks (user_id, title) VALUES ($1,$2) RETURNING *",
      [req.userId, title]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   UPDATE TASK
========================= */
router.put("/:id", auth, async (req, res) => {
  try {
    const { title } = req.body;

    const result = await pool.query(
      "UPDATE tasks SET title=$1 WHERE id=$2 AND user_id=$3 RETURNING *",
      [title, req.params.id, req.userId]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   DELETE TASK
========================= */
router.delete("/:id", auth, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM tasks WHERE id=$1 AND user_id=$2",
      [req.params.id, req.userId]
    );

    res.json({ message: "Task deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
