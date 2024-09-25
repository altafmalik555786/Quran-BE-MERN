const Tutor = require("../models/tutorSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
    generateVerificationCode,
    sendVerificationEmail,
} = require("../utils/studentEmailVerification");

const tutorRegister = async (req, res) => {
    const {
        name,
        email,
        password,
        role = 'tutor', // Default role if not provided
        tutorGender,
        phone,
        country,
        timeZone,
        city,
        hourlyRate,
        subjects
    } = req.body;

    try {
        // Check if the email is already registered
        const existingTutor = await Tutor.findOne({ email });
        if (existingTutor) {
            return res.status(400).send({ message: "This email is already registered." });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const verificationCode = generateVerificationCode();

        // Create a new tutor record with all the fields
        const tutor = new Tutor({
            name,
            email,
            password: hashedPassword,
            tutorGender,
            phone,
            country,
            timeZone,
            city,
            role,
            hourlyRate,
            subjects,
            verificationCode,
            isEmailVerify: false, // Initially false until verified
        });

        await tutor.save();

        // Generate a token for the tutor
        const token = jwt.sign(
            { id: tutor._id, email: tutor.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Send verification email
        await sendVerificationEmail(email, name, verificationCode);

        res.status(200).send({
            message: "Registration successful, please verify your email.",
            token,
            user: {
                id: tutor._id,
                name: tutor.name,
                email: tutor.email,
                role: tutor.role,
                studentGender: tutor.studentGender,
                country: tutor.country,
                timeZone: tutor.timeZone,
                city: tutor.city,
                tutorGender: tutor.tutorGender,
                hourlyRate: tutor.hourlyRate,
                subjects: tutor.subjects,
              },

        });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
};


const verifyEmail = async (req, res) => {
    const { code } = req.body;
    try {
        // Find the tutor by verification code
        const tutor = await Tutor.findOne({ verificationCode: code });
        if (!tutor) {
            return res
                .status(400)
                .send({ message: "Invalid or expired verification code." });
        }

        // Set the email as verified and clear the verification code
        tutor.isEmailVerify = true;
        tutor.verificationCode = undefined;
        await tutor.save();

        res.status(200).send({ message: "Email verified successfully." });
    } catch (error) {
        res.status(400).send({ message: error.message });
    }
};

const tutorLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check if both email and password are provided
        if (!email || !password) {
            return res.status(400).send({ message: "Email and password are required." });
        }

        // Find the tutor by email
        const tutor = await Tutor.findOne({ email });
        if (!tutor) {
            return res.status(400).send({ message: "Invalid email or password." });
        }

        // Check if the password field exists for the tutor
        if (!tutor.password) {
            return res.status(500).send({ message: "Password is not set for this user." });
        }

        // Check if the password is correct
        const isMatch = await bcrypt.compare(password, tutor.password);
        if (!isMatch) {
            return res.status(400).send({ message: "Invalid email or password." });
        }

        // Check if email is verified
        if (!tutor.isEmailVerify) {
            return res.status(400).send({ message: "Please verify your email." });
        }

        // Generate a JWT token
        const token = jwt.sign(
            { id: tutor._id, email: tutor.email, role: tutor.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).send({
            message: "Login successful.",
            role: tutor.role,
            token,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).send({ error: "Server error. Please try again later." });
    }
};



const getAllTutors = async (req, res) => {
    try {
      // Fetch all tutors, excluding sensitive fields like password and verification code
      const tutors = await Tutor.find({}, { password: 0, verificationCode: 0 });
  
      // Check if tutors exist
      if (!tutors || tutors.length === 0) {
        return res.status(404).send({ message: "No tutors found." });
      }
  
      res.status(200).send({
        message: "Tutors retrieved successfully.",
        tutors
      });
    } catch (error) {
      console.error("Error fetching tutors:", error);
      res.status(500).send({ message: "Server error. Please try again later." });
    }
  };

module.exports = {
    tutorRegister,
    verifyEmail,
    tutorLogin,
    getAllTutors,
};
