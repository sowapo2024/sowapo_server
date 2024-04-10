'use strict';
const nodemailer = require('nodemailer');
const convertHTML = require('./html_to_text_helper');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_PROVIDER,
  port: 465,
  secure: true,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface MailObject {
  from?: string;
  to: string;
  subject: string;
  text?: string;
  html: string;
  attachments?: {}[];
}

// async..await is not allowed in global scope, must use a wrapper
async function sender(mailObject: MailObject) {

  console.log(mailObject,"mail Object")
  try {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: mailObject.from || ' The Agape Church <agape@agapeministies.com>', // sender address
      to: mailObject.to, // list of receivers
      subject: mailObject.subject || 'Notification', // Subject line
      text: mailObject.text, // plain text body
      html: mailObject.html, // html body
      attachments: mailObject.attachments,
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.log('transporter error', error);
    throw new Error('Something went wrong');
  }

  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
}

const sendVerification = async ({
  email,
  username,
  OTP,
}: {
  email: string;
  username: string;
  OTP: string;
}) => {
  const html_body: string = await convertHTML(
    './src/utils/mail_templates/sendVerification.html',
    'utf-8',
    { username: username, OTP },
  );
  await sender({ html: html_body, to: email, subject: 'Calvary greetings' });
};

const sendResetPasswordEmail = async ({
  email,
  username,
  OTP,
}: {
  email: string;
  username: string;
  OTP: string;
}) => {
  const html_body: string = await convertHTML(
    './src/utils/mail_templates/sendPasswordOTP.html',
    'utf-8',
    { username: username, OTP },
  );
  await sender({ html: html_body, to: email, subject: 'Forgot password OTP' });
};

// send Donation Reciept
const sendDonationReciept = async ({
  email,
  amount,
}: {
  email: string;
  amount: string;
}) => {

  try {
      const html_body: string = await convertHTML(
    './src/utils/mail_templates/sendDonationReciept.html',
    'utf-8',
    { amount },
  );

  console.log(html_body,"coverted html string")
  await sender({ html: html_body, to: email, subject: 'Donation Recieved' });
  } catch (error) {
    console.log("mailing error :",error)
    throw new Error("error occured while sending mail")
  }

};

// book reciept mail
const sendBookReciept = async ({
  email,
  amount,
  attachments,
}: {
  email: string;
  amount: string;
  attachments: {}[];
}) => {
  try {
      const html_body: string = await convertHTML(
    './src/utils/mail_templates/sendVerification.html',
    'utf-8',
    { amount },
  );
  await sender({
    html: html_body,
    to: email,
    subject: 'Transaction successful',
    attachments: attachments,
  });
  } catch (error) {

    console.log("mailing error :",error)
    throw new Error("error occured while sending mail")
  }

};

module.exports = {
  sender,
  sendBookReciept,
  sendVerification,
  sendDonationReciept,
  sendResetPasswordEmail
};
