const mongoose = require('mongoose');

const aboutSchema = new mongoose.Schema({
    bannerImage: {
        url: { type: String, default: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1920' },
        public_id: { type: String, default: '' }
    },
    title: { type: String, default: 'About Indian Furniture Mart' },
    subtitle: { type: String, default: 'Crafting comfortable and beautiful spaces for modern homes.' },
    storyTitle: { type: String, default: 'Our Story' },
    storyText: { type: String, default: 'Indian Furniture Mart started as a small passion project with a simple goal: to make beautiful, high-quality furniture accessible to families. Over the years, we have built a reputation on premium craftsmanship, outstanding design, and the ultimate comfort. We source only the finest teak wood and materials, and work with dedicated craftsmen who understand the natural soul of wood.' },
    founderName: { type: String, default: 'Rajesh Kumar' },
    founderMessage: { type: String, default: 'Our mission is to bring warmth, comfort, and timeless beauty into every home we touch.' },
    founderImage: {
        url: { type: String, default: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800' },
        public_id: { type: String, default: '' }
    },
    gallery: [
        {
            url: { type: String },
            public_id: { type: String }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('About', aboutSchema);
