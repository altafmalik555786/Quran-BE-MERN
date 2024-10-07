const express = require("express");
const multer = require("multer");
// student controllers 
const {
  studentRegister,
  studentTimezone,
  studentPreferences,
  changePassword,
  updateProfile,
  studentLogin,
  verifyEmail,
  getStudentProfile,
  getAllStudents
} = require("../controllers/student_controller");
const {
  signUpEmailValidation,
  changePasswordValidation,
  updateProfileValidation
} = require("../validations/validation");
const validationMiddleware = require("../middlewares/validationMiddleware");
const authenticateToken = require("../middlewares/authenticateToken.js");
const { addStudentPlan } = require("../controllers/studentPlanController.js");
const { sendInvite, getSentInvites, getReceivedInvites, updateInviteStatus } = require("../controllers/inviteController.js");
const { sendMessage, getMessages } = require("../controllers/MessageController.js");



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
router.post("/add-student-plan/:studentId", addStudentPlan);
router.get('/:studentId/profile', authenticateToken, getStudentProfile);
router.put("/:studentId/change-password", validationMiddleware(changePasswordValidation), changePassword);
router.put("/:studentId/update-profile", upload.single("image"), updateProfile);
router.get("/students-list", getAllStudents);

// Invite routes 
router.post('/send', sendInvite); // Send invite
router.get('/sent', getSentInvites); // View sent invites
router.get('/received', getReceivedInvites); // View received invites
router.post('/status', updateInviteStatus); // Update invite status


// chat Routes
router.post('/messages', sendMessage);
router.get('/messages/:studentId/:tutorId', getMessages);


module.exports = router;
