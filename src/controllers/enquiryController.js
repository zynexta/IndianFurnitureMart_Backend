const Enquiry = require('../models/Enquiry');

exports.createEnquiry = async (req, res, next) => {
    const { products, note, customerName, phone, whatsApp, email, address, city, state, pincode } = req.body;
    try {
        if (!products || !Array.isArray(products) || products.length === 0) {
            res.status(400);
            throw new Error('Please add at least one product to your enquiry');
        }

        if (!customerName || !phone || !address || !city || !state || !pincode) {
            res.status(400);
            throw new Error('Name, Phone/Mobile, Address, City, State, and Pincode are required.');
        }

        const hasInvalidQty = products.some(p => !p.quantity || p.quantity < 1);
        if (hasInvalidQty) {
            res.status(400);
            throw new Error('All products must have a quantity of at least 1');
        }

        const enquiry = new Enquiry({
            userId: req.user._id,
            customerName,
            phone,
            whatsApp: whatsApp || phone,
            email: email || req.user.email,
            address,
            city,
            state,
            pincode,
            products,
            note
        });
        const createdEnquiry = await enquiry.save();
        res.status(201).json(createdEnquiry);
    } catch (error) {
        next(error);
    }
};

exports.getUserEnquiries = async (req, res, next) => {
    try {
        const enquiries = await Enquiry.find({ userId: req.user._id }).populate('products.productId');
        res.json(enquiries);
    } catch (error) {
        next(error);
    }
};

exports.getAllEnquiries = async (req, res, next) => {
    try {
        const enquiries = await Enquiry.find({}).populate('userId', 'name email preferences shopName').populate('products.productId');
        res.json(enquiries);
    } catch (error) {
        next(error);
    }
};

exports.updateEnquiryStatus = async (req, res, next) => {
    const { status } = req.body;
    try {
        const enquiry = await Enquiry.findById(req.params.id);
        if (enquiry) {
            enquiry.status = status;
            const updatedEnquiry = await enquiry.save();
            res.json(updatedEnquiry);
        } else {
            res.status(404);
            throw new Error('Enquiry not found');
        }
    } catch (error) {
        next(error);
    }
};

exports.deleteEnquiry = async (req, res, next) => {
    try {
        const enquiry = await Enquiry.findById(req.params.id);
        if (enquiry) {
            await enquiry.deleteOne();
            res.json({ message: 'Enquiry removed' });
        } else {
            res.status(404);
            throw new Error('Enquiry not found');
        }
    } catch (error) {
        next(error);
    }
};

exports.cancelEnquiry = async (req, res, next) => {
    try {
        const enquiry = await Enquiry.findById(req.params.id);
        if (!enquiry) {
            res.status(404);
            throw new Error('Enquiry not found');
        }

        // Verify the enquiry belongs to the user making the request
        if (enquiry.userId.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to cancel this enquiry');
        }

        if (enquiry.status === 'confirmed' || enquiry.status === 'completed') {
            res.status(400);
            throw new Error(`Cannot cancel enquiry in ${enquiry.status} status`);
        }

        enquiry.status = 'cancelled';
        const updatedEnquiry = await enquiry.save();
        res.json(updatedEnquiry);
    } catch (error) {
        next(error);
    }
};
