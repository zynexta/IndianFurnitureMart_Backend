const express = require('express');
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getFeaturedProducts, getTrendingProducts, addProductReview, getProductReviews, deleteProductReview } = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const router = express.Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/trending', getTrendingProducts);
router.get('/:id', getProductById);
router.post('/', protect, admin, upload.array('images', 5), createProduct);
router.put('/:id', protect, admin, upload.array('images', 5), updateProduct);
router.delete('/:id', protect, admin, deleteProduct);

// Review routes
router.route('/:id/reviews')
    .post(addProductReview)
    .get(getProductReviews);

router.route('/:id/reviews/:reviewId')
    .delete(protect, admin, deleteProductReview);

module.exports = router;
