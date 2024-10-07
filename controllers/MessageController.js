const Message = require('../models/MessageSchema');

// Function to send a new message
exports.sendMessage = async (req, res) => {
    const { studentId, tutorId, message, sender } = req.body;

    try {
        const newMessage = new Message({
            studentId,
            tutorId,
            message,
            sender,
        });

        await newMessage.save();

        res.status(200).json({ message: 'Message sent successfully', newMessage });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message', details: error });
    }
};

// Function to get conversation history between student and tutor
exports.getMessages = async (req, res) => {
    const { studentId, tutorId } = req.params;

    try {
        const messages = await Message.find({
            studentId,
            tutorId
        }).sort({ timestamp: 1 });  // Sort messages by timestamp in ascending order

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve messages', details: error });
    }
};
