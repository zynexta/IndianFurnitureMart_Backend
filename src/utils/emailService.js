const nodemailer = require('nodemailer');

const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('CRITICAL: EMAIL_USER or EMAIL_PASS missing in environment variables');
        throw new Error('Email configuration is incomplete. Please check server environment variables.');
    }

    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        logger: true, // helps with debugging
        debug: true,  // helps with debugging
    });
};

const sendEmail = async (options) => {
    console.log(`[SMTP] Attempting to send email to: ${options.email}`);
    
    const transporter = createTransporter();

    try {
        console.log('[SMTP] Verifying connection configuration...');
        await transporter.verify();
        console.log('[SMTP] Connection verified. Server is ready.');
    } catch (error) {
        console.error('[SMTP] Verification Error:', error);
        throw new Error(`Email service connection failed: ${error.message}`);
    }

    const mailOptions = {
        from: `"Indian Furniture Mart Luxury" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
        text: options.text || 'Please view this email in an HTML-compatible client.',
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('[SMTP] Email sent successfully:', info.messageId);
        console.log('[SMTP] Accepted recipients:', info.accepted);
        console.log('[SMTP] Rejected recipients:', info.rejected);
        console.log('[SMTP] Response from server:', info.response);
        return info;
    } catch (error) {
        console.error('[SMTP] Send Error:', error);
        throw new Error(`Failed to deliver email: ${error.message}`);
    }
};

const sendOTPEmail = async (email, otp) => {
    const subject = 'Password Reset OTP';
    const text = `You have requested to reset your password. Use the following OTP code to proceed: ${otp}. This code is valid for 5 minutes.`;
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1e293b; margin-bottom: 10px; font-size: 28px; font-weight: 800; letter-spacing: 2px;">INDIANFURNITURE</h1>
                <p style="color: #64748b; font-size: 16px;">Premium Furniture & Interiors</p>
            </div>
            <div style="background-color: #f8fafc; padding: 30px; border-radius: 12px; text-align: center; border: 1px solid #f1f5f9;">
                <h2 style="color: #334155; margin-bottom: 20px; font-size: 20px; font-weight: 600;">Password Reset OTP</h2>
                <p style="color: #64748b; margin-bottom: 30px; line-height: 1.6;">You have requested to reset your password. Use the following OTP code to proceed. This code is valid for <strong>5 minutes</strong>.</p>
                <div style="background-color: #ffffff; padding: 20px; border-radius: 12px; border: 2px dashed #cbd5e1; display: inline-block; margin-bottom: 30px;">
                    <span style="font-size: 42px; font-weight: 800; color: #0f172a; letter-spacing: 8px;">${otp}</span>
                </div>
                <p style="color: #94a3b8; font-size: 14px;">If you did not request this, please ignore this email or contact support.</p>
            </div>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
                <p style="color: #94a3b8; font-size: 12px;">&copy; ${new Date().getFullYear()} Indian Furniture Mart. All rights reserved.</p>
            </div>
        </div>
    `;

    await sendEmail({ email, subject, html, text });
};

const sendVerificationEmail = async (email, otp, token) => {
    const subject = 'Verify Your Indian Furniture Mart Account';
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?email=${encodeURIComponent(email)}&token=${token}`;
    const text = `Welcome to Indian Furniture Mart! To activate your account, please use this verification code: ${otp}. Or verify using this link: ${verificationLink}. This code expires in 24 hours.`;
    
    const html = `
        <div style="background-color: #F6F1EB; font-family: 'Georgia', 'Times New Roman', serif; padding: 40px 20px; text-align: center;">
            <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(51,0,32,0.05); border: 1px solid rgba(51,0,32,0.08);">
                <div style="background-color: #330020; padding: 40px 20px; text-align: center;">
                    <h1 style="color: #F6F1EB; font-size: 26px; font-weight: 300; letter-spacing: 4px; margin: 0; text-transform: uppercase;">Indian Furniture Mart</h1>
                    <p style="color: #8A8F68; font-size: 11px; font-family: 'Helvetica', 'Arial', sans-serif; font-weight: bold; letter-spacing: 2px; margin: 10px 0 0 0; text-transform: uppercase;">Premium Furniture & Interiors</p>
                </div>
                <div style="padding: 50px 40px; text-align: center;">
                    <h2 style="color: #330020; font-size: 22px; font-weight: normal; margin-bottom: 20px; font-style: italic;">Verify Your Customer Account</h2>
                    <p style="color: #330020; opacity: 0.8; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 14px; line-height: 1.6; margin-bottom: 40px;">
                        Thank you for registering with us. To complete your account activation and start exploring our collections, please verify your email address.
                    </p>
                    <div style="margin-bottom: 40px;">
                        <a href="${verificationLink}" style="background-color: #330020; color: #F6F1EB; text-decoration: none; padding: 18px 36px; border-radius: 50px; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 13px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; display: inline-block; box-shadow: 0 5px 15px rgba(51,0,32,0.15);">Verify Account</a>
                    </div>
                    <div style="border-top: 1px solid #f1e9e0; margin: 40px 0;"></div>
                    <p style="color: #330020; opacity: 0.6; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Or enter this verification code manually:</p>
                    <div style="background-color: #F6F1EB; padding: 15px 30px; border-radius: 12px; display: inline-block; margin-bottom: 40px; border: 1px solid rgba(51,0,32,0.05);">
                        <span style="font-size: 32px; font-weight: bold; color: #330020; letter-spacing: 6px; font-family: monospace;">${otp}</span>
                    </div>
                    <p style="color: #330020; opacity: 0.5; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12px; line-height: 1.5; text-align: left; background-color: #FAF8F5; padding: 15px 20px; border-radius: 12px; margin-top: 20px;">
                        <strong>Note:</strong> This verification link and code will expire in 24 hours.
                    </p>
                </div>
                <div style="background-color: #FAF8F5; padding: 25px; text-align: center; border-top: 1px solid #f1e9e0;">
                    <p style="color: #330020; opacity: 0.4; font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; margin: 0;">&copy; ${new Date().getFullYear()} Indian Furniture Mart. All rights reserved.</p>
                </div>
            </div>
        </div>
    `;

    await sendEmail({ email, subject, html, text });
};

module.exports = { sendOTPEmail, sendVerificationEmail, sendEmail };
