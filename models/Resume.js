const mongoose = require("mongoose");

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const ExperienceSchema = new mongoose.Schema({
  company: { type: String, default: "" },
  role: { type: String, default: "" },
  location: { type: String, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  isCurrent: { type: Boolean, default: false },
  bullets: [{ type: String }],
});

const EducationSchema = new mongoose.Schema({
  institution: { type: String, default: "" },
  degree: { type: String, default: "" },
  field: { type: String, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  grade: { type: String, default: "" },
  achievements: { type: String, default: "" },
});

const SkillSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  level: {
    type: String,
    enum: ["beginner", "intermediate", "expert"],
    default: "intermediate",
  },
});

const ProjectSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  description: { type: String, default: "" },
  link: { type: String, default: "" },
  bullets: [{ type: String }],
});

const CertificationSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  issuer: { type: String, default: "" },
  date: { type: String, default: "" },
  link: { type: String, default: "" },
});

const LanguageSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  proficiency: {
    type: String,
    enum: ["basic", "conversational", "fluent", "native"],
    default: "fluent",
  },
});

// For MBA/BBA — internships separate from full-time experience
const InternshipSchema = new mongoose.Schema({
  company: { type: String, default: "" },
  role: { type: String, default: "" },
  location: { type: String, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  isCurrent: { type: Boolean, default: false },
  bullets: [{ type: String }],
});

// Achievements and awards — all fields
const AchievementSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  issuer: { type: String, default: "" },
  date: { type: String, default: "" },
  description: { type: String, default: "" },
});

// Volunteer work — all fields
const VolunteerSchema = new mongoose.Schema({
  organization: { type: String, default: "" },
  role: { type: String, default: "" },
  startDate: { type: String, default: "" },
  endDate: { type: String, default: "" },
  isCurrent: { type: Boolean, default: false },
  description: { type: String, default: "" },
});

// Publications / Research — arts, science, MBA
const PublicationSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  publisher: { type: String, default: "" },
  date: { type: String, default: "" },
  link: { type: String, default: "" },
  description: { type: String, default: "" },
});

// Extracurricular activities — all students
const ExtracurricularSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  organization: { type: String, default: "" },
  role: { type: String, default: "" },
  date: { type: String, default: "" },
  description: { type: String, default: "" },
});

// Training and workshops
const TrainingSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  provider: { type: String, default: "" },
  date: { type: String, default: "" },
  duration: { type: String, default: "" },
  description: { type: String, default: "" },
});

// Custom sections — fully flexible for any field
// e.g. "Exhibitions", "Case Competitions", "Research Papers"
const CustomSectionItemSchema = new mongoose.Schema({
  id: { type: String, default: "" },
  content: { type: String, default: "" },
});

const CustomSectionSchema = new mongoose.Schema({
  id: { type: String, default: "" },
  title: { type: String, default: "" },
  items: [CustomSectionItemSchema],
});

// ─── Main Resume Schema ───────────────────────────────────────────────────────

const ResumeSchema = new mongoose.Schema(
  {
    // Owner
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    // Meta
    title: {
      type: String,
      required: [true, "Resume title is required"],
      trim: true,
      default: "My Resume",
    },
    templateId: {
      type: String,
      default: "modern",
    },
    themeColor: {
      type: String,
      default: "#4ADE80",
    },

    // Personal Info
    personal: {
      fullName: { type: String, default: "" },
      jobTitle: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      location: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      website: { type: String, default: "" },
      portfolio: { type: String, default: "" },  // for designers, artists
      github: { type: String, default: "" },      // for developers
      summary: { type: String, default: "" },
    },

    // Core sections — all fields
    experience: [ExperienceSchema],
    education: [EducationSchema],
    skills: [SkillSchema],
    projects: [ProjectSchema],
    certifications: [CertificationSchema],
    languages: [LanguageSchema],

    // Extended sections — MBA, BBA, Arts, all students
    internships: [InternshipSchema],
    achievements: [AchievementSchema],
    volunteer: [VolunteerSchema],
    publications: [PublicationSchema],
    extracurricular: [ExtracurricularSchema],
    training: [TrainingSchema],

    // Interests and hobbies — simple string array
    interests: [{ type: String }],

    // Fully flexible custom sections
    // Any student can add "Exhibitions", "Case Competitions" etc.
    customSections: [CustomSectionSchema],

    // AI Analysis
    atsScore: {
      type: Number,
      default: null,
    },
    lastAnalyzed: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Resume", ResumeSchema);