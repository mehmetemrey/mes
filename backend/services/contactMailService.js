const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
// Send notification email to admin
exports.sendAdminNotification = async (contactData) => {
  try {
    const { name, email, phone, subject, message } = contactData;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return { simulated: true, messageId: 'simulated-dev-id' };
    }

    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME || 'MES Üretim Sistemi'}" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: 'Yeni İletişim Formu Mesajı',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">
            Yeni İletişim Formu Mesajı
          </h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            <p><strong>Gönderen:</strong> ${name}</p>
            <p><strong>E-posta:</strong> ${email}</p>
            <p><strong>Telefon:</strong> ${phone}</p>
            <p><strong>Konu:</strong> ${subject}</p>
            <p><strong>Mesaj:</strong></p>
            <div style="background-color: white; padding: 15px; border-radius: 3px; margin-top: 10px;">
              ${message}
            </div>
          </div>
          <div style="margin-top: 20px; font-size: 12px; color: #666;">
            <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error sending admin notification email:', error);
    throw error;
  }
};

// Send auto-reply email to user
exports.sendUserAutoReply = async (contactData) => {
  try {
    const { name, email } = contactData;

    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'İletişim Formunuz Alındı',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">
            İletişim Formunuz Alındı
          </h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            <p>Sayın ${name},</p>
            <p>İletişim formunuz başarıyla alınmıştır. En kısa sürede size dönüş yapacağız.</p>
            <p>Mesajınız için teşekkür ederiz.</p>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">Saygılarımızla,<br>Messsapp Ekibi</p>
          </div>
          <div style="margin-top: 20px; font-size: 12px; color: #666;">
            <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error sending user auto-reply email:', error);
    throw error;
  }
};

// Send reply email to user (when admin responds)
exports.sendUserReply = async (contactData, adminReply) => {
  try {
    const { name, email, subject } = contactData;

    const mailOptions = {
      from: `"${process.env.MAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Re: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">
            Mesajınıza Yanıt
          </h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
            <p>Sayın ${name},</p>
            <div style="background-color: white; padding: 15px; border-radius: 3px; margin: 15px 0;">
              ${adminReply}
            </div>
          </div>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">Saygılarımızla,<br>Messsapp Ekibi</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Error sending user reply email:', error);
    throw error;
  }
}; 