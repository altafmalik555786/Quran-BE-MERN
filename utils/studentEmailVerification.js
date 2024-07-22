const nodemailer = require('nodemailer');
// Function to send verification email
const sendVerificationEmail = async (email, name) => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: email,
        subject: 'Verify Your Email',
        text: `Hello ${name},\n\nPlease verify your email by clicking the link: \nhttp://${process.env.FRONTEND_URL}/verify-email?email=${email}\n\nThank You!\n`
    };
    await transporter.sendMail(mailOptions);
};
module.exports = sendVerificationEmail;
