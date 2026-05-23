const express = require('express');
const { 
    registerUser, 
    loginUser, 
    getMe, 
    forgotPassword, 
    verifyOtp, 
    resetPassword,
    verifyEmailOtp,
    verifyEmailLink,
    resendVerification,
    googleLogin
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { registerLimiter, loginLimiter, resendLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// Public auth routes with rate-limiting
router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/google-login', loginLimiter, googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// New Verification routes
router.post('/verify-email-otp', verifyEmailOtp);
router.get('/verify-email-link', verifyEmailLink);
router.post('/resend-verification', resendLimiter, resendVerification);

router.get('/me', protect, getMe);

module.exports = router;
