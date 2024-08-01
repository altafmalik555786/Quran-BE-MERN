const Student = require("../models/studentSchema");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  generateVerificationCode,
  sendVerificationEmail,
} = require("../utils/studentEmailVerification");

const studentRegister = async (req, res) => {
  const {
    name,
    email,
    password,
    termsAgreed,
    role,
    studentGender,
    country,
    timeZone,
    city,
    tutorGender,
    hourlyRate,
    subjects,
  } = req.body;

  try {
    // Check if the email is already registered
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res
        .status(400)
        .send({ message: "This email is already registered." });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationCode = generateVerificationCode();

    // Create a new student record with all the fields
    const student = new Student({
      name,
      email,
      password: hashedPassword,
      termsAgreed,
      role,
      verificationCode,
      studentGender,
      country,
      timeZone,
      city,
      tutorGender,
      hourlyRate,
      subjects,
    });

    await student.save();
    const token = jwt.sign(
      { id: student._id, email: student.email, role: student.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    await sendVerificationEmail(email, name, verificationCode);

    res.status(200).send({
      message: "Registration successful, please verify your email.",
      token
    });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

const verifyEmail = async (req, res) => {
  const { code } = req.body;
  try {
    // Find the student by verification code
    const student = await Student.findOne({ verificationCode: code });
    if (!student) {
      return res
        .status(400)
        .send({ message: "Invalid or expired verification code." });
    }

    // Set the email as verified and clear the verification code
    student.isEmailVerify = true;
    student.verificationCode = undefined;
    await student.save();

    res.status(200).send({ message: "Email verified successfully." });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

const studentLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Find the student by email
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(400).send({ message: "Invalid email or password." });
    }

    // Check if the password is correct
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).send({ message: "your password invalid." });
    }

    // Check if email is verified
    if (!student.isEmailVerify) {
      return res.status(400).send({ message: "Please verify your email." });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: student._id, email: student.email, role: student.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).send({
      message: "Login successful.",
      role: student.role,
      token,
    });
  } catch (error) {
    res.status(500).send({ error: "Server error. Please try again later." });
  }
};

// Update student timezone
const studentTimezone = async (req, res) => {
  const { studentGender, country, timeZone, city } = req.body;
  const { studentId } = req.params;
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).send({ message: "Student not found" });
    }
    student.studentGender = studentGender;
    student.country = country;
    student.timeZone = timeZone;
    student.city = city;
    await student.save();
    res
      .status(200)
      .send({ message: "Timezone information updated successfully" });
  } catch (error) {
    res.status(400).send(error.message);
  }
};
// Update student preferences
const studentPreferences = async (req, res) => {
  const { tutorGender, hourlyRate, subjects } = req.body;
  const { studentId } = req.params;
  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).send({ message: "Student not found" });
    }

    student.tutorGender = tutorGender;
    student.hourlyRate = hourlyRate;
    student.subjects = subjects;

    await student.save();

    res.status(200).send({ message: "Preferences updated successfully" });
  } catch (error) {
    res.status(400).send(error.message);
  }
};
// change student password
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { studentId } = req.params;

  try {
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).send({ message: "Student not found" });
    }

    // Check if the old password matches
    const isMatch = await bcrypt.compare(oldPassword, student.password);
    if (!isMatch) {
      return res.status(400).send({ message: "Old password is incorrect" });
    }
    const isNewPasswordSame = await bcrypt.compare(
      newPassword,
      student.password
    );
    if (isNewPasswordSame) {
      return res.status(400).send({
        message: "New password cannot be the same as the old password",
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the student's password
    student.password = hashedPassword;
    await student.save();

    res.status(200).send({ message: "Password updated successfully" });
  } catch (error) {
    res.status(400).send(error.message);
  }
};
// update student profile
const updateProfile = async (req, res) => {
  const { studentId } = req.params;
  const {
    name,
    email,
    cellPhone,
    dateOfBirth,
    language,
    studentGender,
    country,
    timeZone,
    city,
    address,
    tutorGender,
    hourlyRate,
    subjects,
    receiveMessages,
  } = req.body;

  try {
    // Find the student by ID
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).send({ message: "Student not found" });
    }

    // Update student details
    student.name = name || student.name;
    student.email = email || student.email;
    student.cellPhone = cellPhone || student.cellPhone;
    student.dateOfBirth = dateOfBirth || student.dateOfBirth;
    student.language = language || student.language;
    student.studentGender = studentGender || student.studentGender;
    student.country = country || student.country;
    student.timeZone = timeZone || student.timeZone;
    student.city = city || student.city;
    student.address = address || student.address;
    student.tutorGender = tutorGender || student.tutorGender;
    student.hourlyRate = hourlyRate || student.hourlyRate;
    student.subjects = subjects || student.subjects;
    student.receiveMessages =
      receiveMessages !== undefined ? receiveMessages : student.receiveMessages;

    // Handle image upload
    if (req.file) {
      student.image = req.file.path; // Update the image path if a new image is uploaded
    }

    // Save the updated student
    await student.save();

    res.status(200).send({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

module.exports = {
  studentRegister,
  studentTimezone,
  studentPreferences,
  changePassword,
  updateProfile,
  studentLogin,
  verifyEmail,
};
