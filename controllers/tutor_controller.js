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
         console.log('tutors list',tutors);
         
        // Check if tutors exist
        if (!tutors || tutors.length === 0) {
            return res.status(404).send({ message: "No tutors found." });
        }

        // Map the tutors to include the correct image URL
        const tutorsWithImages = tutors.map(tutor => {
            const imageUrl = tutor.image ? `${req.protocol}://${req.get('host')}/${tutor.image}` : null;
            return {
                ...tutor.toObject(), // Convert mongoose document to plain object
                image: imageUrl, // Include the image URL in the response
            };
        });

        res.status(200).send({
            message: "Tutors retrieved successfully.",
            tutors: tutorsWithImages, // Return the list of tutors with images
        });
    } catch (error) {
        console.error("Error fetching tutors:", error);
        res.status(500).send({ message: "Server error. Please try again later." });
    }
};


const editTutorProfile = async (req, res) => {
    const { id } = req.params;  // Tutor ID to update
    const { hourlyRate, language, fiqh, sect } = req.body; // Fields to update

    try {
        // Find the tutor by ID
        const tutor = await Tutor.findById(id);
        if (!tutor) {
            return res.status(404).json({ message: "Tutor not found" });
        }

        // Update fields if they exist in the request
        tutor.hourlyRate = hourlyRate || tutor.hourlyRate;
        tutor.language = language || tutor.language;
        tutor.fiqh = fiqh || tutor.fiqh;
        tutor.sect = sect || tutor.sect;

        // Handle image upload if a file is present
        if (req.file) {
            tutor.image = req.file.path.replace(/\\/g, '/'); // Normalize the path for cross-platform compatibility
        }

        // Save the updated tutor profile
        await tutor.save();

        // Respond with the updated tutor profile, including the correct image URL if available
        const imageUrl = tutor.image ? `${req.protocol}://${req.get('host')}/${tutor.image}` : null;

        res.status(200).send({
            message: "Profile updated successfully.",
            tutor: {
                ...tutor.toObject(),
                image: imageUrl,  // Full URL of the image if it exists
            },
        });
    } catch (error) {
        console.error('Error updating tutor profile:', error);
        res.status(500).json({ message: 'Error updating tutor profile', error: error.message });
    }
};







module.exports = {
    tutorRegister,
    verifyEmail,
    tutorLogin,
    getAllTutors,
    editTutorProfile
};
