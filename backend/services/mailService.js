const User = require('../models/User');
const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Send mail to specific users
exports.sendMailToUsers = async (userIds, subject, content, attachments = []) => {
  try {
    // Get user emails
    const users = await User.find({ _id: { $in: userIds } }).select('email firstName lastName');
    
    if (!users.length) {
      throw new Error('No users found');
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.log(`[MailService] Local dev simulation - Subject: "${subject}", Recipients: ${users.length}`);
      return {
        success: true,
        total: users.length,
        sent: users.length,
        failed: 0
      };
    }

    const emailPromises = users.map(user => {
      const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME || 'MES Üretim Sistemi'}" <${process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@mes-system.local'}>`,
        to: user.email,
        subject: subject,
        html: content,
        attachments
      };

      return transporter.sendMail(mailOptions);
    });

    const results = await Promise.allSettled(emailPromises);
    
    // Log failed emails
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to send email to ${users[index].email}:`, result.reason);
      }
    });

    return {
      success: true,
      total: users.length,
      sent: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    };
  } catch (error) {
    console.error('Error sending emails:', error);
    throw error;
  }
};

// Send mail to all users
exports.sendMailToAllUsers = async (subject, content, attachments = []) => {
  try {
    const users = await User.find().select('email firstName lastName');
    return this.sendMailToUsers(users.map(u => u._id), subject, content, attachments);
  } catch (error) {
    console.error('Error sending emails to all users:', error);
    throw error;
  }
};

// Send mail to users by role
exports.sendMailToUsersByRole = async (roles, subject, content, attachments = []) => {
  try {
    const users = await User.find({ roles: { $in: roles } }).select('email firstName lastName');
    return this.sendMailToUsers(users.map(u => u._id), subject, content, attachments);
  } catch (error) {
    console.error('Error sending emails to users by role:', error);
    throw error;
  }
};

// Send mail to users by department
exports.sendMailToUsersByDepartment = async (departments, subject, content, attachments = []) => {
  try {
    const users = await User.find({ department: { $in: departments } }).select('email firstName lastName');
    return this.sendMailToUsers(users.map(u => u._id), subject, content, attachments);
  } catch (error) {
    console.error('Error sending emails to users by department:', error);
    throw error;
  }
};

// Send mail to users by custom filter
exports.sendMailToUsersByFilter = async (filter, subject, content, attachments = []) => {
  try {
    const users = await User.find(filter).select('email name');
    return this.sendMailToUsers(users.map(u => u._id), subject, content, attachments);
  } catch (error) {
    console.error('Error sending emails to users by filter:', error);
    throw error;
  }
}; 