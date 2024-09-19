const express = require("express");
const multer = require("multer");
// tutor controllers 
const { tutorRegister, verifyEmail,tutorLogin, } = require("../controllers/tutor_controller")

const router = express.Router();
router.post("/register", tutorRegister);
router.post("/verify-email", verifyEmail);
router.post("/login", tutorLogin);



module.exports = router;