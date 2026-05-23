const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String
    },
    image: {
        url: String,
        public_id: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Pre-save to create slug if not provided or name is modified
categorySchema.pre('save', function() {
    if (this.isModified('name') || !this.slug) {
        this.slug = this.name.toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-');
    }
});

module.exports = mongoose.model('Category', categorySchema);
