const nodemailer = require("nodemailer");

// generate 6 digint code function
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
// send verification email fuction
const sendVerificationEmail = async (email, name, code) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: email,
    subject: "Verify Your Email",
    html: `
      <html>
      <body>
        <h1>Hi! ${name}</h1>
        <p>Welcome to Qquranic</p>
        <p style="color:dimgray;">Enter following code to confirm your email</p>
        <h2 style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background-color: #28a745; text-decoration: none; border-radius: 5px; text-align: center;letter-spacing: 16px;">${code}</h2>
        <p>Thank you!</p>
      </body>
      </html>`,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = { generateVerificationCode, sendVerificationEmail };
