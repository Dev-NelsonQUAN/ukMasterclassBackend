const nodemailer = require('nodemailer');

// Setup transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  debug: true,
  logger: true,
});

// Core email sender
const sendMail = async (email, subject, html) => {
  try {
    const mailOptions = {
      from: `"UK Masterclass" <${process.env.GMAIL_USER}>`,
      to: email,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Reusable HTML wrapper
const wrapHtml = (title, content, color = '#333') => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: ${color}; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
          h1 { color: ${color}; }
          p { margin-bottom: 15px; }
          .footer { margin-top: 20px; font-size: 0.8em; color: #777; }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>${title}</h1>
          ${content}
          <div class="footer">
              This is an automated email. Please do not reply.
          </div>
      </div>
  </body>
  </html>
`;

// Registration confirmation email
exports.sendRegistrationSuccessEmail = async ({ email, firstName, lastName }) => {
  const subject = 'Registration Successful!';
  const content = `
    <p>Dear ${firstName} ${lastName},</p>
    <p>Thank you for successfully registering for the UK Masterclass application portal. We're excited you've taken the first step!</p>
    <p>Your application is currently under review. Please ensure you have completed all the necessary sections and uploaded the required documents.</p>
    <p>We will notify you via email regarding the status of your application. Please keep an eye on your inbox for updates.</p>
    <p>Best regards,<br>The UK Masterclass Team</p>
  `;
  const html = wrapHtml(subject, content, '#007bff');
  return sendMail(email, subject, html);
};

// Application status email
exports.sendApplicationStatusEmail = async ({ email, status, rejectionReason, firstName, lastName }) => {
  let subject = '';
  let content = '';
  let color = '#333';

  if (status === 'approved') {
    subject = 'Your UK Masterclass Application - Approved!';
    content = `
      <p>Dear ${firstName} ${lastName},</p>
      <p>Congratulations! Your application has been approved for the UK Masterclass.</p>
      <p>We will be in touch shortly with the next steps and further information about the program.</p>
      <p>Thank you for your interest. We look forward to welcoming you!</p>
      <p>Best regards,<br>The UK Masterclass Team</p>
    `;
    color = '#28a745';
  } else if (status === 'rejected') {
    subject = 'Your UK Masterclass Application - Rejected';
    content = `
      <p>Dear ${firstName} ${lastName},</p>
      <p>Thank you for your interest in the UK Masterclass. After careful review, we regret to inform you that your application has not been successful at this time.</p>
      ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : '<p>No specific reason was provided.</p>'}
      <p>We received many qualified applications and the selection process was competitive.</p>
      <p>We wish you all the best in your future endeavors.</p>
      <p>Sincerely,<br>The UK Masterclass Team</p>
    `;
    color = '#dc3545';
  } else if (status === 'pending') {
    subject = 'Your UK Masterclass Application - Status Pending';
    content = `
      <p>Dear ${firstName} ${lastName},</p>
      <p>Your application is still under review. Please ensure all documents are uploaded correctly.</p>
      <p>You will be notified once a decision is made.</p>
      <p>Best regards,<br>The UK Masterclass Team</p>
    `;
    color = '#ffc107';
  } else {
    console.log('Unknown status — email not sent.');
    return false;
  }

  const html = wrapHtml(subject, content, color);
  return sendMail(email, subject, html);
};


// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.GMAIL_USER,
//         pass: process.env.GMAIL_PASS
//     },
//     debug: true,
//     logger: true
// });

// const sendMail = async (email, subject, html) => {
//     try {
//         const mailOptions = {
//             from: `"UK Masterclass" <${process.env.GMAIL_USER}>`,
//             to: email,
//             subject: subject,
//             html: html
//         };

//         const info = await transporter.sendMail(mailOptions);
//         console.log('Email sent:', info.response);
//         return true;
//     } catch (error) {
//         console.error('Error sending email:', error);
//         return false;
//     }
// };

// exports.sendRegistrationSuccessEmail = async (user) => {
//     const { email, firstName, lastName } = user;
//     const subject = 'Registration Successful!';
//     const html = `
//         <!DOCTYPE html>
//         <html lang="en">
//         <head>
//             <meta charset="UTF-8">
//             <meta name="viewport" content="width=device-width, initial-scale=1.0">
//             <title>${subject}</title>
//             <style>
//                 body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//                 .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
//                 h1 { color: #007bff; }
//                 p { margin-bottom: 15px; }
//                 .footer { margin-top: 20px; font-size: 0.8em; color: #777; }
//             </style>
//         </head>
//         <body>
//             <div class="container">
//                 <h1>${subject}</h1>
//                 <p>Dear ${firstName} ${lastName},</p>
//                 <p>Thank you for successfully registering for the UK Masterclass application portal. We're excited you've taken the first step!</p>
//                 <p>Your application is currently under review. Please ensure you have completed all the necessary sections and uploaded the required documents.</p>
//                 <p>We will notify you via email regarding the status of your application. Please keep an eye on your inbox for updates.</p>
//                 <p>Best regards,</p>
//                 <p>The UK Masterclass Team</p>
//                 <div class="footer">
//                     This is an automated email. Please do not reply.
//                 </div>
//             </div>
//         </body>
//         </html>
//     `;
//     return sendMail(email, subject, html);
// };

// exports.sendApplicationStatusEmail = async (user) => {
//     const { email, status, rejectionReason, firstName, lastName } = user;
//     let subject = '';
//     let html = '';

//     if (status === 'approved') {
//         subject = 'Your UK Masterclass Application - Approved!';
//         html = `
//             <!DOCTYPE html>
//             <html lang="en">
//             <head>
//                 <meta charset="UTF-8">
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                 <title>${subject}</title>
//                 <style>
//                     body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//                     .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
//                     h1 { color: #28a745; }
//                     p { margin-bottom: 15px; }
//                     .footer { margin-top: 20px; font-size: 0.8em; color: #777; }
//                 </style>
//             </head>
//             <body>
//                 <div class="container">
//                     <h1>${subject}</h1>
//                     <p>Dear ${firstName} ${lastName},</p>
//                     <p>Congratulations! We are pleased to inform you that your application for the UK Masterclass has been approved.</p>
//                     <p>We will be in touch shortly with details about the next steps and further information regarding the program.</p>
//                     <p>Thank you for your interest and we look forward to welcoming you.</p>
//                     <p>Best regards,</p>
//                     <p>The UK Masterclass Team</p>
//                     <div class="footer">
//                         This is an automated email. Please do not reply.
//                     </div>
//                 </div>
//             </body>
//             </html>
//         `;
//     } else if (status === 'rejected') {
//         subject = 'Your UK Masterclass Application - Rejected';
//         html = `
//             <!DOCTYPE html>
//             <html lang="en">
//             <head>
//                 <meta charset="UTF-8">
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                 <title>${subject}</title>
//                 <style>
//                     body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
//                     .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
//                     h1 { color: #dc3545; }
//                     p { margin-bottom: 15px; }
//                     .footer { margin-top: 20px; font-size: 0.8em; color: #777; }
//                 </style>
//             </head>
//             <body>
//                 <div class="container">
//                     <h1>${subject}</h1>
//                     <p>Dear ${firstName} ${lastName},</p>
//                     <p>Thank you for your interest in the UK Masterclass. After careful review, we regret to inform you that your application has not been successful at this time.</p>
//                     ${rejectionReason ? `<p>The reason(s) for this decision are: ${rejectionReason}</p>` : '<p>No specific reason was provided.</p>'}
//                     <p>We received a large number of highly qualified applications, and the selection process was very competitive.</p>
//                     <p>We appreciate you taking the time to apply and wish you the best in your future endeavors.</p>
//                     <p>Sincerely,</p>
//                     <p>The UK Masterclass Team</p>
//                     <div class="footer">
//                         This is an automated email. Please do not reply.
//                     </div>
//                 </div>
//             </body>
//             </html>
//         `;
//     } else {
//         console.log('No email sent: Application status is pending or unknown.');
//         return false;
//     }

//     return sendMail(email, subject, html);
// };
