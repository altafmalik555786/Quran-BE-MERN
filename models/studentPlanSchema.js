const mongoose = require('mongoose');

const studentPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ['Basic', 'Standard', 'Premium'],
        unique: true
    },
    price: {
        type: Number,
        required: true
    },
    durationInMonths: {
        type: Number,
        required: true
    },
    maxInvites: {
        type: Number,  // Maximum number of tutor invitations allowed in this plan
        required: true
    },
    features: {
        type: [String],  // Array of features included in the plan (e.g., video lessons, screen sharing)
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const StudentPlan = mongoose.model('StudentPlan', studentPlanSchema);
module.exports = StudentPlan;
