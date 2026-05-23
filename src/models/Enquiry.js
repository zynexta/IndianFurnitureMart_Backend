const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    whatsApp: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, default: 1 }
    }],
    note: { type: String },
    status: { 
        type: String, 
        enum: ['pending', 'contacted', 'confirmed', 'rejected', 'completed', 'cancelled'], 
        default: 'pending' 
    },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', enquirySchema);
