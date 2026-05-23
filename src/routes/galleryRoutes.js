const express = require('express');
const { 
    getGalleryItems, 
    getAdminGalleryItems,
    createGalleryItem, 
    updateGalleryItem, 
    deleteGalleryItem 
} = require('../controllers/galleryController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getGalleryItems);
router.get('/admin', protect, admin, getAdminGalleryItems);
router.post('/', protect, admin, createGalleryItem);
router.put('/:id', protect, admin, updateGalleryItem);
router.delete('/:id', protect, admin, deleteGalleryItem);

module.exports = router;
