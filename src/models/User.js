const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { 
        type: String, 
        required: function() { return this.provider === 'local'; } 
    },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    shopName: { type: String },
    phone: { type: String },
    avatar: { type: String },
    provider: { type: String, default: 'local' },
    preferences: { type: String, default: '' },
    previousBalance: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationOtp: String,
    verificationOtpExpire: Date,
    verificationToken: String,
    verificationTokenExpire: Date,
    lastVerificationSentAt: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    resetOtp: String,
    resetOtpExpire: Date,
    addresses: [{
        fullAddress: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        landmark: { type: String }
    }],
    savedItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    recentlyViewed: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]
}, { timestamps: true });

userSchema.pre('save', async function() {
    if (!this.isModified('password') || !this.password) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
