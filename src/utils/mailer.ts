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

  try {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: mailObject.from || ' SOWAPO app <info@sowapo.com>', // sender address
      to: mailObject.to, // list of receivers
      subject: mailObject.subject || 'Notification', // Subject line
      text: mailObject.text, // plain text body
      html: mailObject.html, // html body
      attachments: mailObject.attachments,
    });
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
  await sender({ html: html_body, to: email, subject: 'Email Verification' });
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


// book reciept mail
const sendCampaignApproval = async ({
  email,
  title,
}: {
  email: string;
  title:string
}) => {
  try {
      const html_body: string = await convertHTML(
    './src/utils/mail_templates/sendCampaignApproval.html',
    'utf-8',
    { title },
  );
  await sender({
    html: html_body,
    to: email,
    subject: 'Campaign Approved',
  });
  } catch (error) {

    console.log("mailing error :",error)
    throw new Error("error occured while sending campaign verification mail")
  }

};

const sendCampaignSuspended = async ({
  email,
  title,
}: {
  email: string;
  title:string
}) => {
  try {
      const html_body: string = await convertHTML(
    './src/utils/mail_templates/sendCampaignSuspended.html',
    'utf-8',
    { title },
  );
  await sender({
    html: html_body,
    to: email,
    subject: 'Campaign Suspended',
  });
  } catch (error) {

    console.log("mailing error :",error)
    throw new Error("error occured while sending campaign supended mail")
  }

};

const sendAcceptProposal = async ({
  email,
  title,
}: {
  email: string;
  title:string
}) => {
  try {
      const html_body: string = await convertHTML(
    './src/utils/mail_templates/sendAcceptProposal.html',
    'utf-8',
    { title },
  );
  await sender({
    html: html_body,
    to: email,
    subject: 'You are hired!!',
  });
  } catch (error) {

    console.log("mailing error :",error)
    throw new Error("error occured while sending campaign supended mail")
  }

};


module.exports = {
  sender,
  sendCampaignApproval,
  sendVerification,
  sendResetPasswordEmail,
  sendCampaignSuspended,
  sendAcceptProposal
};
