const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    // Mart Address
    martName: { type: String, default: 'Indian Furniture Mart' },
    street: { type: String, default: '14, Imperial Design Way, Sector 5' },
    city: { type: String, default: 'New Delhi' },
    state: { type: String, default: 'Delhi' },
    pincode: { type: String, default: '110001' },

    // Phone Numbers
    phoneMart: { type: String, default: '+91 11 4050 6070' },
    phoneSupport: { type: String, default: '+91 98765 43210' },
    phoneWhatsapp: { type: String, default: '+91 98765 43210' },

    // Emails
    emailSupport: { type: String, default: 'curator@indianfurniture.com' },
    emailMart: { type: String, default: 'mart@indianfurniture.com' },

    // Business Hours
    hoursWeekdays: { type: String, default: '9:00 AM – 8:00 PM' },
    hoursSunday: { type: String, default: 'Closed' },

    // Maps Embed Link
    googleMapsUrl: { type: String, default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.996160537351!2d77.21833891508253!3d28.629881182419515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfd246c0e5aed%3A0xe5a3c6dfd2f7881e!2sConnaught%20Place%2C%20New%20Delhi%2C%20Delhi!5e0!3m2!1sen!2sin!4v1622384732101!5m2!1sen!2sin' },

    // Social Media Links
    socialInstagram: { type: String, default: 'https://instagram.com/indianfurniture' },
    socialFacebook: { type: String, default: 'https://facebook.com/indianfurniture' },
    socialWhatsapp: { type: String, default: 'https://wa.me/919876543210' },
    socialYoutube: { type: String, default: 'https://youtube.com/indianfurniture' },

    // Footer Specific Settings
    footerLogo: { type: String, default: 'Indian Furniture Mart' },
    footerDescription: { type: String, default: 'Artisanal furniture of unparalleled lineage. Hand-curated in India for the world\'s most distinguished living spaces.' },
    footerCopyrightText: { type: String, default: '© 2026 Indian Furniture Mart. Crafted in Solidarity with Heritage.' },
    footerShowNewsletter: { type: Boolean, default: true },
    footerCategories: { type: [String], default: ['Living Room', 'Bedroom', 'Dining Room', 'Heritage Works'] }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
