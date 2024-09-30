// controllers/scheduleController.js
const Schedule = require('../models/scheduleModel');

// Create a new schedule
const addSchedule = async (req, res) => {
    try {
        const scheduleData = req.body;
        const { startAt, endAt, day } = scheduleData;

        // Get today's date and the current time
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set time to midnight for date comparison

        // Get the date for the selected day (assuming day is in "YYYY-MM-DD" format)
        const selectedDate = new Date(today);
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const dayIndex = daysOfWeek.indexOf(day);

        if (dayIndex === -1) {
            return res.status(400).json({ message: 'Invalid day selected.' });
        }

        // Calculate the date for the selected day of the week
        selectedDate.setDate(today.getDate() + (dayIndex - today.getDay() + 7) % 7); // Ensures it gets the next occurrence of the selected day

        // Check if the selected date is in the past
        if (selectedDate < today) {
            return res.status(400).json({ message: 'Cannot add schedule for a past date.' });
        }

        // Check if startAt and endAt are the same
       

        // Check if there is already a schedule for the same day and time
        const existingSchedule = await Schedule.findOne({
            day: day,
            startAt: startAt,
            endAt: endAt,
        });

        if (existingSchedule) {
            return res.status(400).json({ message: 'Schedule for the same time already exists.' });
        }

        // Create and save the new schedule
        const newSchedule = new Schedule(scheduleData);
        await newSchedule.save();

        res.status(200).json({ message: 'Schedule created successfully', newSchedule });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create schedule', error: error.message });
    }
};



// Get all schedules
const getSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.find();
        res.status(200).json(schedules);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve schedules', error: error.message });
    }
};

// Update a schedule by ID
const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedSchedule = await Schedule.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedSchedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.status(200).json({ message: 'Schedule updated successfully', updatedSchedule });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update schedule', error: error.message });
    }
};

// Delete a schedule by ID
const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedSchedule = await Schedule.findByIdAndDelete(id);
        if (!deletedSchedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.status(200).json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete schedule', error: error.message });
    }
};

// Export the controller functions
module.exports = { addSchedule, getSchedules, updateSchedule, deleteSchedule };
