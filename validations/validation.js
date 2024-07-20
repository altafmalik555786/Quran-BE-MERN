const Joi = require('joi');

const signUpEmailValidation = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(20).required(),
    termsAgreed: Joi.boolean().required()
});
const changePasswordValidation = Joi.object({
    oldPassword: Joi.string().min(6).required(),
    newPassword: Joi.string().min(6).required(),
});
const updateProfileValidation = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    address: Joi.string().min(3).max(250).optional(),
    cellPhone: Joi.string().min(6).max(20).optional(),
    city: Joi.string().min(3).max(30).optional(),
    dateOfBirth: Joi.date().optional(),
    subjects: Joi.array().items(Joi.string()).optional(),
    language: Joi.string().optional(),
    receiveMessages: Joi.boolean().optional(),
    studentGender: Joi.string().optional(),
    tutorGender: Joi.string().optional(),
    country: Joi.string().optional(),
    timeZone: Joi.string().optional(),
    hourlyRate: Joi.string().optional()

});

module.exports = {
    signUpEmailValidation,
    changePasswordValidation,
    updateProfileValidation
};
