const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
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
    password: {
        type: String,
        required: true
    },
    tutorGender: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },

    isEmailVerify: {
        type: Boolean,
        default: true
    },

    country: {
        type: String,
        required: true
    },
    verificationCode: {
        type: String,
        required: false
    },
    timeZone: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },


    hourlyRate: {
        type: String,
        required: true
    },
    subjects: {
        type: [String],
        required: false,
        default: []
    },
    role: {
        type: String,
        required: false,
        default: 'tutor'
    },
    receiveMessages: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Tutor = mongoose.model('Tutor', tutorSchema);
module.exports = Tutor;
