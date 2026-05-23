const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const testSmtp = async () => {
    console.log('Testing SMTP connection...');
    console.log('User:', process.env.EMAIL_USER);
    console.log('Pass Length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
    
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        logger: true,
        debug: true,
    });

    try {
        console.log('Verifying...');
        await transporter.verify();
        console.log('Verify SUCCESS!');
        
        console.log('Sending email...');
        const info = await transporter.sendMail({
            from: `"Test User" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: 'Test connection',
            text: 'Hello world'
        });
        console.log('Send SUCCESS!', info);
    } catch (err) {
        console.error('Error:', err);
    }
    process.exit(0);
};

testSmtp();
