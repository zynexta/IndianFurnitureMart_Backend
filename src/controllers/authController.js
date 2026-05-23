const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/emailService');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.registerUser = async (req, res, next) => {
    let { name, email, password, shopName, phone, role } = req.body;
    
    // Trim inputs
    name = name?.trim();
    email = email?.trim()?.toLowerCase();
    shopName = shopName?.trim();
    phone = phone?.trim();
    
    try {
        // Basic validation
        if (!name || name.trim().length < 3) {
            return res.status(400).json({ message: 'Name must be at least 3 characters long' });
        }

        // Strict email verification formatting rule (reject test@gmail, abc@abc)
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address with a domain (e.g. name@domain.com)' });
        }

        // phone and shopName are optional in this customer-centric architecture

        // Password complexity: min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!password || !passwordRegex.test(password)) {
            return res.status(400).json({ 
                message: 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' 
            });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Generate security token for URL verification
        const token = crypto.randomBytes(32).toString('hex');
        
        console.log(`[AUTH] Generated OTP for user ${email}: ${otp}`);

        // Hash OTP and Token for secure storage
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Admins are automatically verified to prevent lockout
        const isVerified = role === 'admin';

        const user = await User.create({
            name,
            email,
            password,
            shopName,
            phone,
            role: role || 'user',
            isVerified,
            verificationOtp: isVerified ? undefined : hashedOtp,
            verificationOtpExpire: isVerified ? undefined : Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            verificationToken: isVerified ? undefined : hashedToken,
            verificationTokenExpire: isVerified ? undefined : Date.now() + 24 * 60 * 60 * 1000,
            lastVerificationSentAt: Date.now()
        });

        if (user) {
            console.log(`[AUTH] User created in database successfully. ID: ${user._id}`);
            if (isVerified) {
                return res.status(201).json({
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isVerified: true,
                    message: 'Admin account created successfully'
                });
            }

            // Send Verification Email for normal users
            try {
                console.log(`[AUTH] Dispatching verification email to ${user.email}...`);
                await sendVerificationEmail(user.email, otp, token);
                console.log(`[AUTH] Verification email dispatched successfully.`);
                res.status(201).json({
                    message: 'Registration successful. A verification email has been sent.',
                    email: user.email
                });
            } catch (emailError) {
                console.error(`[AUTH] Signup verification email failure for ${user.email}:`, emailError);
                // Keep the account but let them request a resend
                res.status(201).json({
                    message: 'Registration successful, but verification email could not be sent. Please try again.',
                    email: user.email
                });
            }
        }
    } catch (error) {
        next(error);
    }
};

exports.loginUser = async (req, res) => {
    let { email, password } = req.body;
    email = email?.trim()?.toLowerCase();
    try {
        const user = await User.findOne({ email });
        if (user && user.provider === 'local' && (await user.comparePassword(password))) {
            if (user.isBlocked) {
                return res.status(403).json({ message: 'Your account has been blocked. Please contact admin.' });
            }

            // Check email verification status (admins bypass)
            if (user.role !== 'admin' && !user.isVerified) {
                return res.status(403).json({ 
                    message: 'Please verify your email before accessing the mart.',
                    emailVerified: false,
                    email: user.email
                });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                preferences: user.preferences,
                phone: user.phone,
                avatar: user.avatar,
                provider: user.provider,
                token: generateToken(user._id),
            });
        } else if (user && user.provider !== 'local') {
            res.status(400).json({ message: `This account is registered via ${user.provider}. Please use that method.` });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const { sendOTPEmail } = require('../utils/emailService');

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email: email?.trim()?.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'No account found with this email address' });
        }

        if (user.provider !== 'local') {
            return res.status(400).json({ message: `This account is registered via ${user.provider}. Please use that method.` });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Hash OTP (optional but more secure, I'll store it plain for simplicity as it expires fast, or hash it with crypto)
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
        
        user.resetOtp = hashedOtp;
        user.resetOtpExpire = Date.now() + 5 * 60 * 1000; // 5 mins

        await user.save();

        try {
            await sendOTPEmail(user.email, otp);
            res.json({ message: 'OTP sent to your email' });
        } catch (emailError) {
            user.resetOtp = undefined;
            user.resetOtpExpire = undefined;
            await user.save();
            console.error('Email Delivery Error:', emailError);
            return res.status(500).json({ 
                message: `Email delivery failed: ${emailError.message}`,
                error: process.env.NODE_ENV === 'development' ? emailError.stack : undefined
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email: email?.trim()?.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.resetOtp || !user.resetOtpExpire || user.resetOtpExpire < Date.now()) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
        if (hashedOtp !== user.resetOtp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Generate a temporary reset token to allow password reset on the next step
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins
        
        // Clear OTP
        user.resetOtp = undefined;
        user.resetOtpExpire = undefined;

        await user.save();

        res.json({ 
            message: 'OTP verified successfully',
            resetToken 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;
    
    if (!token || !password) {
        return res.status(400).json({ message: 'Token and password are required' });
    }

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired session. Please start again.' });
        }

        // Password complexity check: minimum 8 characters, uppercase, lowercase, number, special character
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                message: 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.' 
            });
        }

        // Set new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.json({ message: 'Password reset successful. You can now login.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify email using OTP
// @route   POST /api/auth/verify-email-otp
// @access  Public
exports.verifyEmailOtp = async (req, res) => {
    let { email, otp } = req.body;
    email = email?.trim()?.toLowerCase();
    otp = otp?.trim();

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and verification code are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        if (!user.verificationOtp || !user.verificationOtpExpire || user.verificationOtpExpire < Date.now()) {
            return res.status(400).json({ message: 'Verification code has expired or is invalid. Please request a new one.' });
        }

        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
        if (hashedOtp !== user.verificationOtp) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        // Mark user as verified
        user.isVerified = true;
        user.verificationOtp = undefined;
        user.verificationOtpExpire = undefined;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;

        await user.save();

        res.json({ message: 'Email verified successfully. You can now login to the mart.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify email using URL Token link
// @route   GET /api/auth/verify-email-link
// @access  Public
exports.verifyEmailLink = async (req, res) => {
    let { email, token } = req.query;
    email = email?.trim()?.toLowerCase();
    token = token?.trim();

    if (!email || !token) {
        return res.status(400).json({ message: 'Email and verification token are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(200).json({ message: 'Email is already verified' });
        }

        if (!user.verificationToken || !user.verificationTokenExpire || user.verificationTokenExpire < Date.now()) {
            return res.status(400).json({ message: 'Verification link is invalid or has expired. Please request a new one.' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        if (hashedToken !== user.verificationToken) {
            return res.status(400).json({ message: 'Invalid verification link' });
        }

        // Mark user as verified
        user.isVerified = true;
        user.verificationOtp = undefined;
        user.verificationOtpExpire = undefined;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;

        await user.save();

        res.json({ message: 'Email verified successfully. You can now login to the mart.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
exports.resendVerification = async (req, res) => {
    let { email } = req.body;
    email = email?.trim()?.toLowerCase();

    if (!email) {
        return res.status(400).json({ message: 'Email address is required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No account found with this email address' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Rate-limiting check: Prevent spam resends (cool-down of 60 seconds)
        const now = Date.now();
        if (user.lastVerificationSentAt && now - user.lastVerificationSentAt < 60000) {
            const waitTime = Math.ceil((60000 - (now - user.lastVerificationSentAt)) / 1000);
            return res.status(429).json({ 
                message: `Please wait ${waitTime} seconds before requesting another code.` 
            });
        }

        // Generate new OTP & Token
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const token = crypto.randomBytes(32).toString('hex');

        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        user.verificationOtp = hashedOtp;
        user.verificationOtpExpire = now + 24 * 60 * 60 * 1000; // 24 hours
        user.verificationToken = hashedToken;
        user.verificationTokenExpire = now + 24 * 60 * 60 * 1000;
        user.lastVerificationSentAt = now;

        await user.save();

        try {
            await sendVerificationEmail(user.email, otp, token);
            res.json({ message: 'Verification email has been resent successfully.' });
        } catch (emailError) {
            console.error('Resend verification email failure:', emailError);
            res.status(500).json({ message: `Verification email failed to send: ${emailError.message}` });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Google Authentication (Signup/Login)
// @route   POST /api/auth/google-login
// @access  Public
exports.googleLogin = async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: 'Google authentication token is required' });
    }

    try {
        let email, name, picture;

        if (token.startsWith('ey')) {
            // Validate JWT ID Token
            const ticket = await googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();
            email = payload.email;
            name = payload.name;
            picture = payload.picture;
        } else {
            // Validate Access Token via Google userinfo API
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error('Failed to retrieve user info from Google');
            }
            const userData = await response.json();
            email = userData.email;
            name = userData.name;
            picture = userData.picture;
        }

        if (!email) {
            return res.status(400).json({ message: 'Google account does not provide an email address' });
        }

        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            // Check if user is blocked
            if (user.isBlocked) {
                return res.status(403).json({ message: 'Your account has been blocked. Please contact admin.' });
            }

            // Link Google account safely if they registered with password
            if (!user.provider || user.provider === 'local') {
                user.provider = 'google';
            }

            // Sync verification status (Google email is already verified)
            if (!user.isVerified) {
                user.isVerified = true;
                user.verificationOtp = undefined;
                user.verificationOtpExpire = undefined;
                user.verificationToken = undefined;
                user.verificationTokenExpire = undefined;
            }

            // Sync profile picture as avatar if they don't have one
            if (picture && !user.avatar) {
                user.avatar = picture;
            }

            await user.save();
        } else {
            // Automatically create a new verified user for Google login
            // Create a randomized strong password for security compliance
            const randomPassword = crypto.randomBytes(16).toString('hex');
            user = await User.create({
                name: name || 'Customer',
                email: email.toLowerCase(),
                password: randomPassword,
                avatar: picture || '',
                provider: 'google',
                isVerified: true
            });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            preferences: user.preferences,
            phone: user.phone,
            avatar: user.avatar,
            provider: user.provider,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Google verification error:', error);
        res.status(400).json({ message: 'Invalid Google signature or token verification failed.' });
    }
};


