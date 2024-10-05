// models/scheduleModel.js
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  startAt: { type: String, required: true },
  endAt: { type: String, required: true },
  day: { type: String, required: true },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',   // Reference to the Tutor model
    required: true
  },
});

const Schedule = mongoose.model('Schedule', scheduleSchema);
module.exports = Schedule;
