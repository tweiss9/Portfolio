/* eslint-disable linebreak-style */
const nodemailer = require("nodemailer");
const emailSender = process.env.EMAIL_SENDER;
const emailSenderPassword = process.env.EMAIL_SENDER_PASSWORD;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: emailSender,
    pass: emailSenderPassword,
  },
});

transporter.verify().then(console.log).catch(console.error);

const sendEmail = async (name, email, message) => {
  return new Promise((resolve, reject) => {
    try {
      const subject = `Portfolio Website from ${name}`;
      const emailBody = `Email: ${email}\nDescription: ${message}`;

      const mailOptions = {
        from: emailSender,
        to: emailSender,
        subject: subject,
        text: emailBody,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
          reject(error);
        } else {
          console.log("Email sent successfully!");
          resolve(info);
        }
      });
    } catch (error) {
      console.error("Error sending email:", error);
      reject(error);
    }
  });
};

module.exports = {sendEmail};
