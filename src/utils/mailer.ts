'use strict';
const nodemailer = require('nodemailer');
const convertHTML = require('./html_to_text_helper');
const postmark = require('postmark');

// Initialize the Postmark client with your server API token
const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_KEY);

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
  attachments?: { filename: string; content: string; mimetype: string }[];
}

// Function to send an email using Postmark
async function sender(mailObject: MailObject) {
  try {
    const email = {
      From: mailObject.from || 'ayomikundev@sowapo.com',
      To: mailObject.to,
      Subject: mailObject.subject || 'Alert',
      HtmlBody: mailObject.html,
      TextBody: mailObject.text,
      Attachments: mailObject.attachments?.map((attachment) => ({
        Name: attachment.filename,
        Content: attachment.content,
        ContentType: attachment.mimetype,
      })),
    };

    // Send the email using Postmark
    await client.sendEmail(email);
    // await transporter.sendMail(email)
  } catch (error) {
    console.log('Postmark error', error);
    throw new Error('Something went wrong');
  }
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
