const express = require("express");
const router = express.Router();
const {
  signup,
  login,
  getMe,
  updateProfile,
  changePassword,
  deleteAccount,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/signup", signup);
router.post("/login",  login);

// Protected routes
router.get("/me",          protect, getMe);
router.put("/update",      protect, updateProfile);
router.put("/password",    protect, changePassword);
router.delete("/delete",   protect, deleteAccount);

module.exports = router;