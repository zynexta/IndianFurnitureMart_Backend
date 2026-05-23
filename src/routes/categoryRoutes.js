const express = require('express');
const { 
    getCategories, 
    getAllCategoriesAdmin, 
    createCategory, 
    updateCategory, 
    deleteCategory,
    reorderCategories,
    getCategoryByIdOrSlug
} = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const router = express.Router();

router.get('/', getCategories);
router.get('/admin', protect, admin, getAllCategoriesAdmin);
router.get('/:idOrSlug', getCategoryByIdOrSlug);
router.patch('/reorder', protect, admin, reorderCategories);
router.post('/', protect, admin, upload.single('image'), createCategory);
router.patch('/:id', protect, admin, upload.single('image'), updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;
