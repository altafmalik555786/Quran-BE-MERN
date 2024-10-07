const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',  // Reference the 'Student' model if you have a separate model
        required: true
    },
    tutorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor',  // Reference the 'Tutor' model if you have a separate model
        required: true
    },
    message: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        enum: ['student', 'tutor'],  // Ensure only valid sender types are allowed
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', MessageSchema);
