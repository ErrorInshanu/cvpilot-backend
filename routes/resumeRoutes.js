const express = require("express");
const router = express.Router();
const {
  createResume,
  getResumes,
  getResumeById,
  updateResume,
  deleteResume,
} = require("../controllers/resumeController");
const { protect } = require("../middleware/authMiddleware");

// All resume routes are protected — user must be logged in
router.post("/", protect, createResume);
router.get("/", protect, getResumes);
router.get("/:id", protect, getResumeById);
router.put("/:id", protect, updateResume);
router.delete("/:id", protect, deleteResume);

module.exports = router;