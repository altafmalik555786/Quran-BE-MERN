// controllers/scheduleController.js
const Schedule = require('../models/scheduleModel');
const Tutor = require('../models/tutorSchema'); // Ensure you have the correct path

// Create a new schedule
const addSchedule = async (req, res) => {
    try {
        const { tutorId } = req.params;
        const { startAt, endAt, day } = req.body;

        if (!tutorId) {
            return res.status(400).json({ message: 'Tutor ID is required.' });
        }

        // Verify that the tutor exists
        const tutorExists = await Tutor.findById(tutorId);
        if (!tutorExists) {
            return res.status(404).json({ message: 'Tutor not found.' });
        }

        // Validate day input
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        if (!daysOfWeek.includes(day)) {
            return res.status(400).json({ message: 'Invalid day selected.' });
        }

        // Additional validation can be added here (e.g., time format, startAt < endAt)

        // Check if there is already a schedule for the same tutor, day, and time
        const existingSchedule = await Schedule.findOne({
            tutor: tutorId,
            day: day,
            startAt: startAt,
            endAt: endAt,
        });

        if (existingSchedule) {
            return res.status(400).json({ message: 'Schedule for the same time already exists for this tutor.' });
        }

        // Create and save the new schedule
        const newSchedule = new Schedule({
            tutor: tutorId,
            startAt,
            endAt,
            day
        });
        await newSchedule.save();

        res.status(200).json({ message: 'Schedule created successfully', newSchedule });
    } catch (error) {
        console.error('Error adding schedule:', error);
        res.status(500).json({ message: 'Failed to create schedule', error: error.message });
    }
};

// Get schedules for a specific tutor
const getSchedulesByTutor = async (req, res) => {
    const { tutorId } = req.params;

    try {
        // Find schedules for a specific tutor
        const schedules = await Schedule.find({ tutor: tutorId });

        if (!schedules || schedules.length === 0) {
            return res.status(404).json({ message: 'No schedules found for this tutor' });
        }

        res.status(200).json(schedules);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ message: 'Failed to retrieve schedules', error: error.message });
    }
};


// Update a schedule by ID
const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { tutorId, startAt, endAt, day } = req.body;

        // Optionally, verify that the schedule belongs to the tutor
        const schedule = await Schedule.findById(id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // If you want to ensure that only the owner tutor can update
        if (tutorId && schedule.tutor.toString() !== tutorId) {
            return res.status(403).json({ message: 'You are not authorized to update this schedule.' });
        }

        // Update the schedule fields
        schedule.startAt = startAt || schedule.startAt;
        schedule.endAt = endAt || schedule.endAt;
        schedule.day = day || schedule.day;

        await schedule.save();

        res.status(200).json({ message: 'Schedule updated successfully', schedule });
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ message: 'Failed to update schedule', error: error.message });
    }
};


// Delete a schedule by ID
const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;

        // Optionally, verify that the schedule belongs to the tutor
        const schedule = await Schedule.findById(id);
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        // If you want to ensure that only the owner tutor can delete
        // const { tutorId } = req.body; // Or get from authenticated user
        // if (schedule.tutor.toString() !== tutorId) {
        //     return res.status(403).json({ message: 'You are not authorized to delete this schedule.' });
        // }

        await schedule.remove();

        res.status(200).json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ message: 'Failed to delete schedule', error: error.message });
    }
};

module.exports = {
    addSchedule,
    getSchedulesByTutor,
    updateSchedule,
    deleteSchedule
};