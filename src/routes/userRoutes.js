const express = require('express');
const { 
    getAllUsers, 
    getUserDetails, 
    updatePreviousBalance, 
    toggleBlockUser, 
    deleteUser,
    getProfileDetails,
    updateProfile,
    updatePassword,
    addAddress,
    updateAddress,
    deleteAddress,
    toggleSavedItem,
    addRecentlyViewed
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

// Customer Profile Routes (Private to logged in user)
router.get('/profile', protect, getProfileDetails);
router.put('/profile', protect, updateProfile);
router.put('/profile/password', protect, updatePassword);
router.post('/profile/addresses', protect, addAddress);
router.put('/profile/addresses/:addressId', protect, updateAddress);
router.delete('/profile/addresses/:addressId', protect, deleteAddress);
router.post('/profile/saved-items', protect, toggleSavedItem);
router.post('/profile/recently-viewed', protect, addRecentlyViewed);

// Admin User Management Routes
router.get('/', protect, admin, getAllUsers);
router.get('/:id', protect, admin, getUserDetails);
router.put('/:id/balance', protect, admin, updatePreviousBalance);
router.patch('/:id/block', protect, admin, toggleBlockUser);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
