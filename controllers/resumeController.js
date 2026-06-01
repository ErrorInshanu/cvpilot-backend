const Resume = require("../models/Resume");

// ─── POST /api/resumes ────────────────────────────────────────────────────────
// Create a new resume
const createResume = async (req, res) => {
  try {
    const resume = new Resume({
      userId: req.user._id,
      title: req.body.title || "My Resume",
      templateId: req.body.templateId || "modern",
      themeColor: req.body.themeColor || "#4ADE80",
    });

    await resume.save();

    return res.status(201).json(resume);
  } catch (error) {
    console.error("Create resume error:", error.message);
    return res.status(500).json({ message: "Server error creating resume" });
  }
};

// ─── GET /api/resumes ─────────────────────────────────────────────────────────
// Get all resumes for the logged in user
const getResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .sort({ updatedAt: -1 }) // most recently updated first
      .select("_id title templateId themeColor personal.fullName personal.jobTitle atsScore createdAt updatedAt");

    return res.status(200).json(resumes);
  } catch (error) {
    console.error("Get resumes error:", error.message);
    return res.status(500).json({ message: "Server error fetching resumes" });
  }
};

// ─── GET /api/resumes/:id ─────────────────────────────────────────────────────
// Get a single resume by ID
const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Make sure the resume belongs to the logged in user
    if (resume.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to access this resume" });
    }

    return res.status(200).json(resume);
  } catch (error) {
    console.error("Get resume error:", error.message);
    return res.status(500).json({ message: "Server error fetching resume" });
  }
};

// ─── PUT /api/resumes/:id ─────────────────────────────────────────────────────
// Update a resume
const updateResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Make sure the resume belongs to the logged in user
    if (resume.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this resume" });
    }

    // Update all fields sent from the app
    const { _id, __v, userId, createdAt, updatedAt, ...safeBody } = req.body;

const updatedResume = await Resume.findByIdAndUpdate(
  req.params.id,
  { $set: safeBody },
  { returnDocument: "after", runValidators: true }
);

    return res.status(200).json(updatedResume);
  } catch (error) {
    console.error("Update resume error:", error.message);
    return res.status(500).json({ message: "Server error updating resume" });
  }
};

// ─── DELETE /api/resumes/:id ──────────────────────────────────────────────────
// Delete a resume
const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Make sure the resume belongs to the logged in user
    if (resume.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this resume" });
    }

    await Resume.findByIdAndDelete(req.params.id);

    return res.status(200).json({ message: "Resume deleted successfully" });
  } catch (error) {
    console.error("Delete resume error:", error.message);
    return res.status(500).json({ message: "Server error deleting resume" });
  }
};

module.exports = {
  createResume,
  getResumes,
  getResumeById,
  updateResume,
  deleteResume,
};