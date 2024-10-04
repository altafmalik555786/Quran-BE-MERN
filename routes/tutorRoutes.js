const fs = require('fs');
const path = require('path');
const express = require("express");
const multer = require("multer");
// tutor controllers 
const {
  addSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule,
} = require('../controllers/scheduleController');

const { tutorRegister, verifyEmail, tutorLogin, getAllTutors, editTutorProfile, changeTutorPassword, updateTutorProfile, getTutorById } = require("../controllers/tutor_controller");

const router = express.Router();

// Ensure the uploads folder exists before s// Configure multer

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/tutor"); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Naming convention for files
  },
});
const upload = multer({ storage: storage });


// Tutor Routes
router.post("/register", tutorRegister);
router.post("/verify-email", verifyEmail);
router.post("/login", tutorLogin);
router.put("/:tutorId/change-password", changeTutorPassword);
router.get("/list", getAllTutors);
router.get("/:id", getTutorById);
router.put('/:id/edit', upload.single("image"), editTutorProfile);
// add schedule routes 
router.post('/add-schedule', addSchedule);
router.get('/get-schedule', getSchedules);
router.put('/update-schedule/:id', updateSchedule);
// Route definition for updating tutor profile
router.put('/:tutorId', updateTutorProfile);
router.delete('/delete-schedule/:id', deleteSchedule);

module.exports = router;
