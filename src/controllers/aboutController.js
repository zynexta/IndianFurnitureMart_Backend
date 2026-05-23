const About = require('../models/About');
const { cloudinary } = require('../config/cloudinary');

// Seed default About data if none exists
const seedDefaultAbout = async () => {
    let about = await About.findOne({});
    if (!about) {
        about = await About.create({
            title: 'About Indian Furniture Mart',
            subtitle: 'Crafting comfortable and beautiful spaces for modern homes.',
            storyTitle: 'Our Story',
            storyText: 'Indian Furniture Mart started as a small passion project with a simple goal: to make beautiful, high-quality furniture accessible to families. Over the years, we have built a reputation on premium craftsmanship, outstanding design, and the ultimate comfort. We source only the finest teak wood and materials, and work with dedicated craftsmen who understand the natural soul of wood.',
            founderName: 'Rajesh Kumar',
            founderMessage: 'Our mission is to bring warmth, comfort, and timeless beauty into every home we touch.',
            bannerImage: {
                url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1920',
                public_id: ''
            },
            founderImage: {
                url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
                public_id: ''
            },
            gallery: []
        });
    }
    return about;
};

// @desc    Get About details
// @route   GET /api/about
// @access  Public
exports.getAboutData = async (req, res, next) => {
    try {
        const about = await seedDefaultAbout();
        res.status(200).json(about);
    } catch (error) {
        next(error);
    }
};

// @desc    Update About details
// @route   PUT /api/about
// @access  Private/Admin
exports.updateAboutData = async (req, res, next) => {
    try {
        let about = await seedDefaultAbout();

        const { title, subtitle, storyTitle, storyText, founderName, founderMessage } = req.body;

        about.title = title || about.title;
        about.subtitle = subtitle || about.subtitle;
        about.storyTitle = storyTitle || about.storyTitle;
        about.storyText = storyText || about.storyText;
        about.founderName = founderName || about.founderName;
        about.founderMessage = founderMessage || about.founderMessage;

        // Handle file uploads
        if (req.files) {
            // 1. Banner Image
            if (req.files['bannerImage'] && req.files['bannerImage'].length > 0) {
                const file = req.files['bannerImage'][0];
                if (about.bannerImage && about.bannerImage.public_id) {
                    try {
                        await cloudinary.uploader.destroy(about.bannerImage.public_id);
                    } catch (err) {
                        console.error('Failed to destroy bannerImage in cloudinary', err);
                    }
                }
                about.bannerImage = {
                    url: file.path,
                    public_id: file.filename
                };
            }

            // 2. Founder Image
            if (req.files['founderImage'] && req.files['founderImage'].length > 0) {
                const file = req.files['founderImage'][0];
                if (about.founderImage && about.founderImage.public_id) {
                    try {
                        await cloudinary.uploader.destroy(about.founderImage.public_id);
                    } catch (err) {
                        console.error('Failed to destroy founderImage in cloudinary', err);
                    }
                }
                about.founderImage = {
                    url: file.path,
                    public_id: file.filename
                };
            }

            // 3. Add to Gallery
            if (req.files['gallery'] && req.files['gallery'].length > 0) {
                const newGalleryItems = req.files['gallery'].map(file => ({
                    url: file.path,
                    public_id: file.filename
                }));
                about.gallery = [...about.gallery, ...newGalleryItems];
            }
        }

        // Handle existing gallery image removals if specified
        if (req.body.removedGalleryIds) {
            let removedIds = [];
            try {
                removedIds = JSON.parse(req.body.removedGalleryIds);
            } catch (e) {
                removedIds = Array.isArray(req.body.removedGalleryIds) ? req.body.removedGalleryIds : [req.body.removedGalleryIds];
            }

            if (removedIds && removedIds.length > 0) {
                const toRemove = about.gallery.filter(item => removedIds.includes(item.public_id || item._id?.toString()));
                for (const img of toRemove) {
                    if (img.public_id) {
                        try {
                            await cloudinary.uploader.destroy(img.public_id);
                        } catch (err) {
                            console.error('Failed to destroy gallery image in cloudinary', err);
                        }
                    }
                }
                about.gallery = about.gallery.filter(item => !removedIds.includes(item.public_id || item._id?.toString()));
            }
        }

        const updatedAbout = await about.save();
        res.status(200).json(updatedAbout);
    } catch (error) {
        next(error);
    }
};
