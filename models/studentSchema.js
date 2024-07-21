const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    isEmailVerify: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        required: true
    },
    termsAgreed: {
        type: Boolean,
        required: true
    },
    cellPhone: {
        type: String,
        required: false
    },
    dateOfBirth: {
        type: String,
        required: false
    },
    image: {
        type: String, // URL or path to image
        required: false
    },
    language: {
        type: String,
        required: false
    },
    studentGender: {
        type: String,
        required: false
    },
    country: {
        type: String,
        required: false
    },
    timeZone: {
        type: String,
        required: false
    },
    city: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    },
    tutorGender: {
        type: String,
        required: false
    },
    hourlyRate: {
        type: String,
        required: false
    },
    subjects: {
        type: [String], // e.g., ['Recitation', 'Hifz', 'Arabic', 'Tajweed']
        required: false,
        default: []
    },
    receiveMessages: { // New field
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;
