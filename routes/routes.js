const express = require("express");
const multer = require("multer");
const {
  studentRegister,
  studentTimezone,
  studentPreferences,
  changePassword,
  updateProfile,
  studentLogin,
  verifyEmail,
  getStudentProfile
} = require("../controllers/student_controller");
const {
  signUpEmailValidation,
  changePasswordValidation,
  updateProfileValidation
} = require("../validations/validation");
const validationMiddleware = require("../middlewares/validationMiddleware");
const authenticateToken = require("../middlewares/authenticateToken.js");
const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Define the folder to store the uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Define the file naming convention
  },
});
const upload = multer({ storage: storage });

// Student Routes
router.post("/register", validationMiddleware(signUpEmailValidation), studentRegister);
router.post("/verify-email", verifyEmail);
router.post("/login", studentLogin);
router.get('/:studentId/profile', authenticateToken, getStudentProfile);
router.put("/:studentId/change-password", validationMiddleware(changePasswordValidation), changePassword);
router.put("/:studentId/update-profile", upload.single("image"), updateProfile);

module.exports = router;
