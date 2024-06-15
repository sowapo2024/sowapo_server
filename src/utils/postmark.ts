'use strict';
const postmark = require('postmark');
const convertHTML = require('./html_to_text_helper');

// Initialize the Postmark client with your server API token
const client = new postmark.ServerClient(process.env.POSTMARK_API_TOKEN);

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
      From: mailObject.from || 'info@sowapo.com',
      To: mailObject.to,
      Subject: mailObject.subject || 'Notification',
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

// send Donation Receipt
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

    console.log(html_body, 'converted html string');
    await sender({ html: html_body, to: email, subject: 'Donation Received' });
  } catch (error) {
    console.log('mailing error :', error);
    throw new Error('error occurred while sending mail');
  }
};

// book receipt mail
const sendBookReciept = async ({
  email,
  amount,
  attachments,
}: {
  email: string;
  amount: string;
  attachments?: { filename: string; content: string; mimetype: string }[];
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
    console.log('mailing error :', error);
    throw new Error('error occurred while sending mail');
  }
};

module.exports = {
  sender,
  sendBookReciept,
  sendVerification,
  sendDonationReciept,
  sendResetPasswordEmail,
};
