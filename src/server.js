const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();

console.log('--- SYSTEM ENVIRONMENT VALIDATION ---');
console.log(`EMAIL_USER configured: ${!!process.env.EMAIL_USER} (${process.env.EMAIL_USER})`);
console.log(`EMAIL_PASS configured: ${!!process.env.EMAIL_PASS} (Length: ${process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0})`);
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('CRITICAL WARNING: SMTP credentials are not fully configured in .env');
}
console.log('-------------------------------------');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check Route for Uptime Monitoring (e.g. UptimeRobot)
app.get('/', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Indian Furniture Mart Backend is running' });
});
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/enquiries', require('./routes/enquiryRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/about', require('./routes/aboutRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/newsletter', require('./routes/newsletterRoutes'));

// Temporary debug route for email testing
app.get('/api/debug/test-mail', async (req, res) => {
    try {
        const { sendEmail } = require('./utils/emailService');
        const info = await sendEmail({
            email: process.env.EMAIL_USER,
            subject: 'Test Email from Indian Furniture Mart',
            html: '<p>This is a test email to verify SMTP functionality.</p>',
            text: 'This is a test email to verify SMTP functionality.'
        });
        res.status(200).json({ success: true, message: 'Test email sent successfully', info });
    } catch (error) {
        console.error('Test Mail Error:', error);
        res.status(500).json({ success: false, message: 'Test email failed', error: error.message });
    }
});

app.use(notFound);
app.use(errorHandler);

// MongoDB Connection
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
    });
