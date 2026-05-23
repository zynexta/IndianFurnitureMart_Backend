const User = require('../models/User');
const Enquiry = require('../models/Enquiry');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'user' }).select('-password');
        
        // Calculate total enquiries for each user
        const usersWithEnquiryCount = await Promise.all(users.map(async (user) => {
            const enquiryCount = await Enquiry.countDocuments({ userId: user._id });
            return {
                ...user._doc,
                enquiryCount
            };
        }));

        res.json(usersWithEnquiryCount);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            const enquiries = await Enquiry.find({ userId: user._id })
                .sort({ createdAt: -1 })
                .populate('products.productId', 'name images price');
            
            const totalEnquiries = enquiries.length;
            const pendingEnquiries = enquiries.filter(e => e.status === 'pending').length;
            const confirmedEnquiries = enquiries.filter(e => ['confirmed', 'completed'].includes(e.status)).length;

            res.json({
                user,
                enquiries,
                summary: {
                    totalEnquiries,
                    pendingEnquiries,
                    confirmedEnquiries
                }
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updatePreviousBalance = async (req, res) => {
    try {
        res.json({ message: 'Balance system deprecated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.toggleBlockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.isBlocked = !user.isBlocked;
            await user.save();
            res.json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}`, isBlocked: user.isBlocked });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'User deleted successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get populated profile details for logged in user
// @route   GET /api/users/profile
// @access  Private
exports.getProfileDetails = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('savedItems')
            .populate('recentlyViewed');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile details
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = req.body.name || user.name;
        user.preferences = req.body.preferences !== undefined ? req.body.preferences : user.preferences;
        user.phone = req.body.phone || user.phone;

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            preferences: updatedUser.preferences,
            phone: updatedUser.phone,
            role: updatedUser.role,
            provider: updatedUser.provider
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user password
// @route   PUT /api/users/profile/password
// @access  Private
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.provider !== 'local') {
            return res.status(400).json({ message: 'Social signup accounts cannot change passwords here' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Validate password complexity
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!newPassword || !passwordRegex.test(newPassword)) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters and contain at least one uppercase letter, one lowercase letter, and one number'
            });
        }

        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add address
// @route   POST /api/users/profile/addresses
// @access  Private
exports.addAddress = async (req, res) => {
    try {
        const { fullAddress, city, state, pincode, landmark } = req.body;
        if (!fullAddress || !city || !state || !pincode) {
            return res.status(400).json({ message: 'Please provide all required address fields' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.addresses.push({ fullAddress, city, state, pincode, landmark });
        await user.save();
        res.status(201).json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update address
// @route   PUT /api/users/profile/addresses/:addressId
// @access  Private
exports.updateAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const { fullAddress, city, state, pincode, landmark } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const address = user.addresses.id(addressId);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        address.fullAddress = fullAddress || address.fullAddress;
        address.city = city || address.city;
        address.state = state || address.state;
        address.pincode = pincode || address.pincode;
        address.landmark = landmark !== undefined ? landmark : address.landmark;

        await user.save();
        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete address
// @route   DELETE /api/users/profile/addresses/:addressId
// @access  Private
exports.deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
        await user.save();
        res.json(user.addresses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle wishlist saved item
// @route   POST /api/users/profile/saved-items
// @access  Private
exports.toggleSavedItem = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isSaved = user.savedItems.includes(productId);
        if (isSaved) {
            user.savedItems = user.savedItems.filter(id => id.toString() !== productId);
        } else {
            user.savedItems.push(productId);
        }

        await user.save();
        res.json({ savedItems: user.savedItems, isSaved: !isSaved });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add recently viewed item
// @route   POST /api/users/profile/recently-viewed
// @access  Private
exports.addRecentlyViewed = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Filter out if already in list to avoid duplicates
        user.recentlyViewed = user.recentlyViewed.filter(id => id.toString() !== productId);
        
        // Push to top (index 0)
        user.recentlyViewed.unshift(productId);

        // Slice to maintain max 8 unique items
        if (user.recentlyViewed.length > 8) {
            user.recentlyViewed = user.recentlyViewed.slice(0, 8);
        }

        await user.save();
        res.json(user.recentlyViewed);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
