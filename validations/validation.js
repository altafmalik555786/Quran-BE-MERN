const Joi = require('joi');

const signUpEmailValidation = Joi.object({
    // General information
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('student', 'teacher', 'admin').required(), 
    password: Joi.string().min(4).max(20).required(),
    termsAgreed: Joi.boolean().required(),

    // Timezone information
    studentGender: Joi.string().min(3).max(50).required(),
    country: Joi.string().min(3).max(50).required(),
    timeZone: Joi.string().min(3).max(30).required(),
    city: Joi.string().min(3).max(30).required(),

    // Preferences
    tutorGender: Joi.string().required(),
    hourlyRate: Joi.string().required(),
    subjects: Joi.array().items(Joi.string()).allow('', null),
});

const changePasswordValidation = Joi.object({
    oldPassword: Joi.string().min(4).required(),
    newPassword: Joi.string().min(4).required(),
});
const updateProfileValidation = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    address: Joi.string().min(3).max(250).allow('', null),
    cellPhone: Joi.string().min(6).max(20).allow('', null),
    city: Joi.string().min(3).max(30).allow('', null),
    dateOfBirth: Joi.date().allow('', null),
    subjects: Joi.array().items(Joi.string()).allow('', null),
    language: Joi.string().allow('', null),
    receiveMessages: Joi.boolean().allow('', null),
    studentGender: Joi.string().allow('', null),
    tutorGender: Joi.string().allow('', null),
    country: Joi.string().allow('', null),
    timeZone: Joi.string().allow('', null),
    hourlyRate: Joi.string().allow('', null)
});


module.exports = {
    signUpEmailValidation,
    changePasswordValidation,
    updateProfileValidation,
  
};
