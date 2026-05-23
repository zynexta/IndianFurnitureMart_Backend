const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    image: {
        url: { type: String, required: true },
        public_id: { type: String, required: true }
    },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
    type: { type: String, enum: ['partner', 'interior', 'collaboration'], default: 'partner' }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
