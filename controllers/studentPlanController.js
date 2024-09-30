// Import necessary modules
const Student = require('../models/studentSchema'); // Path to your student model
const StudentPlan = require('../models/studentPlanSchema'); // Path to your student plan model
const { addMonths } = require('../helpers/helpers'); // Importing addMonths function from helper.js

const addStudentPlan = async (req, res) => {
    const studentId = req.params.studentId; // Get student ID from request parameters
    const { planId } = req.body; // Get plan ID from request body (assumed you want to use this)

    try {
        // Find the student by ID
        const student = await Student.findById(studentId);
        // Find the plan by ID (if you want to use it)
        const plan = await StudentPlan.findById(planId);

        // Check if student and plan exist
        if (!student || !plan) {
            return res.status(404).json({ message: 'Student or plan not found' });
        }

        const currentDate = new Date(); // Get the current date
        const nextPlanChangeDate = addMonths(currentDate, plan.durationInMonths); // Set next plan change date based on plan duration

        // Assign the plan and set the start and next change dates
        student.plan = plan._id; // Assuming you want to keep track of the assigned plan
        student.planStartDate = currentDate;
        student.nextPlanChangeDate = nextPlanChangeDate;

        // Save the updated student information
        await student.save();

        // Return success response
        res.status(200).json({ message: 'Plan assigned to student', student });
    } catch (error) {
        // Log the error for debugging
        console.error(error);
        // Handle any errors during the process
        res.status(500).json({ message: 'Error assigning plan', error: error.message });
    }
};
const changeStudentPlan = async (req, res) => {
    const { planId } = req.body;
    const studentId = req.params.studentId;

    try {
        const student = await Student.findById(studentId).populate('plan');
        const plan = await StudentPlan.findById(planId);

        if (!student || !plan) {
            return res.status(404).json({ message: 'Student or plan not found' });
        }

        const currentDate = new Date();

        if (currentDate < student.nextPlanChangeDate) {
            return res.status(403).json({ message: `You can only change plans after ${student.nextPlanChangeDate}.` });
        }

        // Assign new plan and update the dates
        student.plan = plan._id;
        student.planStartDate = currentDate;
        student.nextPlanChangeDate = addMonths(currentDate, 1);

        await student.save();
        res.status(200).json({ message: 'Plan changed successfully', student });
    } catch (error) {
        res.status(500).json({ message: 'Error changing plan', error });
    }
};
const updateStudentPlan = async (req, res) => {
    const { newSchedule } = req.body;
    const studentId = req.params.studentId;

    try {
        const student = await Student.findById(studentId);
        const currentDate = new Date();

        if (currentDate < student.nextPlanChangeDate) {
            return res.status(403).json({ message: `You can only change your schedule after ${student.nextPlanChangeDate}.` });
        }

        // Update the current schedule
        student.currentSchedule = newSchedule;

        // Set the new next change date
        student.nextPlanChangeDate = addMonths(currentDate, 1);

        await student.save();
        res.status(200).json({ message: 'Schedule updated successfully', student });
    } catch (error) {
        res.status(500).json({ message: 'Error updating schedule', error });
    }
};

module.exports = {
    addStudentPlan,
    changeStudentPlan,
    updateStudentPlan
};
