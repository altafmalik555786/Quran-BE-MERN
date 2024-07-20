const express = require('express');
const {
    studentRegister,
    studentTimezone,
    studentPreferences
} = require('../controllers/student_controller');
const { signUpEmailValidation } = require('../validations/validation');
const validationMiddleware = require('../middlewares/validationMiddleware');

const router = express.Router();
// Student Routes 
router.post('/register', validationMiddleware(signUpEmailValidation), studentRegister);
router.post('/:studentId/timezone', studentTimezone);
router.post('/:studentId/preferences', studentPreferences);

module.exports = router;
