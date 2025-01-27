const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Şifre kurulum e-postası gönder
const sendPasswordSetupEmail = async (email, token) => {
    const setupUrl = `${process.env.FRONTEND_URL || 'http://localhost:8000'}/set-password/${token}`;
    
    const mailOptions = {
        from: '"MES Üretim Sistemi" <noreply@mes-system.local>',
        to: email,
        subject: 'MES Sistemi - Şifre Belirleme',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Şifre Oluşturma</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #f4f6f8;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f8;">
                    <tr>
                        <td style="padding: 30px 0; text-align: center;">
                            <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden;">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%); padding: 30px; text-align: center; color: #ffffff;">
                                        <h2 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">MES PORTAL</h2>
                                        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">ÜRETİM YÜRÜTME SİSTEMİ</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 40px 30px; text-align: center;">
                                        <h1 style="color: #1f1f1f; font-size: 22px; margin: 0 0 16px 0;">Hesabınız Oluşturuldu</h1>
                                        <p style="color: #595959; font-size: 15px; line-height: 1.6; margin: 0 0 32px 0;">
                                            MES sistemine erişim sağlamak için lütfen aşağıdaki butona tıklayarak parolanızı belirleyin.
                                        </p>
                                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="background-color: #1677ff; border-radius: 6px; text-align: center;">
                                                    <a href="${setupUrl}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">
                                                        Şifremi Belirle
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        <p style="color: #8c8c8c; font-size: 13px; margin: 32px 0 0 0;">
                                            Bu bağlantı güvenliğiniz gereği 24 saat boyunca geçerlidir.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 20px; background-color: #fafafa; border-top: 1px solid #f0f0f0; text-align: center;">
                                        <p style="color: #8c8c8c; font-size: 12px; margin: 0;">
                                            Bu e-posta MES Otomasyon Sistemi tarafından otomatik olarak gönderilmiştir.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `
    };

    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log(`[EmailService] Dev simulation setup URL: ${setupUrl}`);
            return true;
        }
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.warn('E-posta gönderilemedi, geliştirme modunda bağlantı loglandı:', setupUrl);
        return true;
    }
};

// Şifre değiştirme kodu e-postası gönder
const sendPasswordChangeCodeEmail = async (email, code) => {
    try {
        const mailOptions = {
            from: '"MES Üretim Sistemi" <noreply@mes-system.local>',
            to: email,
            subject: 'MES Sistemi - Şifre Değiştirme Doğrulama Kodu',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Şifre Değiştirme</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; background-color: #f4f6f8;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f8;">
                        <tr>
                            <td style="padding: 30px 0; text-align: center;">
                                <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden;">
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%); padding: 30px; text-align: center; color: #ffffff;">
                                            <h2 style="margin: 0; font-size: 24px; font-weight: 700;">MES PORTAL</h2>
                                            <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">GÜVENLİK VE DOĞRULAMA</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 40px 30px; text-align: center;">
                                            <h1 style="color: #1f1f1f; font-size: 22px; margin: 0 0 16px 0;">Şifre Değiştirme Talebi</h1>
                                            <p style="color: #595959; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                                                Şifrenizi güncellemek için aşağıdaki tek kullanımlık doğrulama kodunu giriniz:
                                            </p>
                                            <div style="background-color: #f0f7ff; border: 1px solid #bae0ff; padding: 16px 32px; border-radius: 8px; margin: 0 auto 24px auto; display: inline-block;">
                                                <h2 style="color: #1677ff; margin: 0; font-size: 32px; letter-spacing: 6px; font-weight: 700;">${code}</h2>
                                            </div>
                                            <p style="color: #8c8c8c; font-size: 13px; margin: 0;">
                                                Bu kod 10 dakika boyunca geçerlidir. Talebi siz yapmadıysanız bu mesajı dikkate almayınız.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `
        };

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log(`[EmailService] Dev simulation verification code: ${code}`);
            return true;
        }

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.warn('E-posta gönderilemedi, geliştirme modunda kod loglandı:', code);
        return true;
    }
};

module.exports = {
    sendPasswordSetupEmail,
    sendPasswordChangeCodeEmail
}; 