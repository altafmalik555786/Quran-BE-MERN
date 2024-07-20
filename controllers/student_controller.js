const Student = require('../models/studentSchema');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

// Function to send verification email
const sendVerificationEmail = async (email, name) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'Verify Your Email',
        text: `Hello ${name},\n\nPlease verify your email by clicking the link: \nhttp://${process.env.FRONTEND_URL}/verify-email?email=${email}\n\nThank You!\n`
    };

    await transporter.sendMail(mailOptions);
};

// Register student
const studentRegister = async (req, res) => {
    const { name, email, password, termsAgreed } = req.body;
    try {
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const student = new Student({
            name,
            email,
            password: hashedPassword,
            termsAgreed
        });

        await student.save();

        await sendVerificationEmail(email, name);

        res.status(201).send({ message: 'Registration successful, please verify your email.' });
    } catch (error) {
        res.status(400).send(error.message);
    }
};

// Update student timezone
const studentTimezone = async (req, res) => {
    const { studentGender, country, timeZone, city } = req.body;
    const { studentId } = req.params;
    try {
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).send({ message: 'Student not found' });
        }

        student.studentGender = studentGender;
        student.country = country;
        student.timeZone = timeZone;
        student.city = city;

        await student.save();

        res.status(200).send({ message: 'Timezone information updated successfully' });
    } catch (error) {
        res.status(400).send(error.message);
    }
};

// Update student preferences
const studentPreferences = async (req, res) => {
    const { tutorGender, hourlyRate, learningInterests } = req.body;
    const { studentId } = req.params;
    try {
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).send({ message: 'Student not found' });
        }

        student.tutorGender = tutorGender;
        student.hourlyRate = hourlyRate;
        student.learningInterests = learningInterests;

        await student.save();

        res.status(200).send({ message: 'Preferences updated successfully' });
    } catch (error) {
        res.status(400).send(error.message);
    }
};

module.exports = {
    studentRegister,
    studentTimezone,
    studentPreferences
};
