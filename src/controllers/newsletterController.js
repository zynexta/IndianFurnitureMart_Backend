const Newsletter = require('../models/Newsletter');

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter
// @access  Public
const subscribeNewsletter = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Please provide an email address' });
        }

        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        const existingSubscriber = await Newsletter.findOne({ email });
        if (existingSubscriber) {
            return res.status(400).json({ message: 'Email is already subscribed' });
        }

        const subscriber = await Newsletter.create({ email });

        if (subscriber) {
            return res.status(201).json({
                success: true,
                message: 'Successfully subscribed to the newsletter',
                data: subscriber
            });
        } else {
            return res.status(400).json({ message: 'Invalid subscriber data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all subscribers
// @route   GET /api/newsletter
// @access  Private/Admin
const getSubscribers = async (req, res) => {
    try {
        const subscribers = await Newsletter.find({}).sort('-createdAt');
        res.json(subscribers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete subscriber
// @route   DELETE /api/newsletter/:id
// @access  Private/Admin
const deleteSubscriber = async (req, res) => {
    try {
        const subscriber = await Newsletter.findById(req.params.id);

        if (subscriber) {
            await subscriber.deleteOne();
            res.json({ message: 'Subscriber removed' });
        } else {
            res.status(404).json({ message: 'Subscriber not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    subscribeNewsletter,
    getSubscribers,
    deleteSubscriber
};
