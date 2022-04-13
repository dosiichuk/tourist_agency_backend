const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // create a transporter - service sending email (for example gmail)
  const transport = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: 2525,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASSWORD,
    },
  });

  //define email options
  const mailOptions = {
    from: 'Nature App <nature@nature.com>',
    to: options.email,
    subject: options.subject,
    text: options.text,
  };
  //send the email
  await transport.sendMail(mailOptions);
};

module.exports = sendEmail;
