const Invite = require('../models/inviteSchema');

// Send an invite
exports.sendInvite = async (req, res) => {
    try {
        console.log('Request body:', req.body); // Log the request body
        const { tutorId, studentId } = req.body; // Get both tutor ID and student ID from the request body

        console.log('Student ID:', studentId); // Log the student ID
        console.log('Tutor ID:', tutorId); // Log the tutor ID

        // Check if the invite already exists
        const existingInvite = await Invite.findOne({ tutor: tutorId, student: studentId });
        if (existingInvite) {
            return res.status(400).json({ message: "Invite already sent" });
        }

        // Create a new invite
        const invite = new Invite({
            tutor: tutorId,
            student: studentId
        });

        await invite.save();
        res.status(201).json({ message: "Invite sent successfully", invite });
    } catch (error) {
        console.error('Error sending invite:', error); // Log the error
        res.status(500).json({ message: "Server error", error });
    }
};




// View sent invites (for the student)
exports.getSentInvites = async (req, res) => {
    try {
        const studentId = req.user._id;  // Assuming the student is logged in
        const invites = await Invite.find({ student: studentId }).populate('tutor', 'name subjects hourlyRate');

        res.json(invites);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// View received invites (for the tutor)
exports.getReceivedInvites = async (req, res) => {
    try {
        const tutorId = req.user._id;  // Assuming the tutor is logged in
        const invites = await Invite.find({ tutor: tutorId }).populate('student', 'name email');

        res.json(invites);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Update invite status (accept or reject)
exports.updateInviteStatus = async (req, res) => {
    try {
        const { inviteId, status } = req.body; // Status is either 'accepted' or 'rejected'

        const invite = await Invite.findById(inviteId);
        if (!invite) {
            return res.status(404).json({ message: "Invite not found" });
        }

        invite.status = status;
        await invite.save();

        res.json({ message: "Invite status updated", invite });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};
