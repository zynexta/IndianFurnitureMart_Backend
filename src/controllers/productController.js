const mongoose = require('mongoose');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Category = require('../models/Category');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
    try {
        const { category } = req.query;
        const filter = {};
        if (category) {
            if (category.match(/^[0-9a-fA-F]{24}$/)) {
                filter.category = category;
            } else {
                const foundCategory = await Category.findOne({ slug: category.toLowerCase() });
                if (foundCategory) {
                    filter.category = foundCategory._id;
                } else {
                    // Fallback to a non-existent ObjectId to return an empty list gracefully
                    filter.category = new mongoose.Types.ObjectId();
                }
            }
        }
        const products = await Product.find(filter).populate('category').sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res, next) => {
    try {
        const products = await Product.find({
            isIconic: true
        }).populate('category').sort({ homePriority: -1, createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
};

// @desc    Get trending products
// @route   GET /api/products/trending
// @access  Public
exports.getTrendingProducts = async (req, res, next) => {
    try {
        const products = await Product.find({
            isTrending: true
        }).populate('category').sort({ homePriority: -1, createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        next(error);
    }
};

// @desc    Get product by id or slug
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        let product;
        
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            product = await Product.findById(id).populate('category');
        } else {
            product = await Product.findOne({ slug: id }).populate('category');
        }

        if (product) {
            res.status(200).json(product);
        } else {
            res.status(404);
            throw new Error('Product not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
    try {
        const { 
            name, 
            price, 
            originalPrice, 
            category, 
            description, 
            stock, 
            isTrending, 
            isIconic, 
            isFeatured,
            isBulkPricingAvailable,
            homePriority 
        } = req.body;
        
        if (!name || !price || !category || !description) {
            res.status(400);
            throw new Error('Please provide all required fields (name, price, category, description)');
        }

        if (Number(price) <= 0) {
            res.status(400);
            throw new Error('Price must be a number greater than 0');
        }

        const trendingVal = isTrending === 'true' || isTrending === true;
        const iconicVal = isIconic === 'true' || isIconic === true;
        const featuredVal = isFeatured === 'true' || isFeatured === true;

        let selectedAttrs = 0;
        if (trendingVal) selectedAttrs++;
        if (iconicVal) selectedAttrs++;
        if (featuredVal) selectedAttrs++;

        if (selectedAttrs > 2) {
            res.status(400);
            throw new Error('A product can have a maximum of two collection attributes.');
        }

        if (!req.files || req.files.length === 0) {
            res.status(400);
            throw new Error('At least one product image is required');
        }

        const imageObjects = req.files.map(file => ({
            url: file.path,
            public_id: file.filename
        }));

        const product = await Product.create({
            name,
            price,
            originalPrice: originalPrice || price,
            category,
            images: imageObjects,
            image: imageObjects[0].url,
            description,
            stock: stock || 0,
            isTrending: isTrending === 'true' || isTrending === true,
            isIconic: isIconic === 'true' || isIconic === true,
            isFeatured: isFeatured === 'true' || isFeatured === true,
            isBulkPricingAvailable: isBulkPricingAvailable === 'true' || isBulkPricingAvailable === true,
            homePriority: Number(homePriority) || 0
        });

        res.status(201).json(product);
    } catch (error) {
        next(error);
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
    try {
        const { 
            name, 
            price, 
            originalPrice, 
            category, 
            stock, 
            description, 
            isTrending, 
            isIconic, 
            isFeatured,
            isBulkPricingAvailable,
            homePriority 
        } = req.body;
        
        if (price && Number(price) <= 0) {
            res.status(400);
            throw new Error('Price must be greater than 0');
        }

        const product = await Product.findById(req.params.id);
        
        if (product) {
            const finalTrending = isTrending !== undefined ? (isTrending === 'true' || isTrending === true) : product.isTrending;
            const finalIconic = isIconic !== undefined ? (isIconic === 'true' || isIconic === true) : product.isIconic;
            const finalFeatured = isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : product.isFeatured;

            let selectedAttrs = 0;
            if (finalTrending) selectedAttrs++;
            if (finalIconic) selectedAttrs++;
            if (finalFeatured) selectedAttrs++;

            if (selectedAttrs > 2) {
                res.status(400);
                throw new Error('A product can have a maximum of two collection attributes.');
            }

            product.name = name || product.name;
            product.price = price || product.price;
            product.originalPrice = originalPrice !== undefined ? originalPrice : product.originalPrice;
            product.category = category || product.category;
            product.stock = stock !== undefined ? stock : product.stock;
            product.description = description || product.description;
            product.isTrending = isTrending !== undefined ? (isTrending === 'true' || isTrending === true) : product.isTrending;
            product.isIconic = isIconic !== undefined ? (isIconic === 'true' || isIconic === true) : product.isIconic;
            product.isFeatured = isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : product.isFeatured;
            product.isBulkPricingAvailable = isBulkPricingAvailable !== undefined ? (isBulkPricingAvailable === 'true' || isBulkPricingAvailable === true) : product.isBulkPricingAvailable;
            product.homePriority = homePriority !== undefined ? Number(homePriority) : product.homePriority;

            let finalImages = [...product.images];

            if (req.body.existingImages !== undefined) {
                try {
                    const parsedExistingImages = JSON.parse(req.body.existingImages);
                    const parsedExistingIds = parsedExistingImages.map(img => img.public_id);
                    
                    const removedImages = product.images.filter(img => img.public_id && !parsedExistingIds.includes(img.public_id));
                    
                    for (const img of removedImages) {
                        try {
                            await cloudinary.uploader.destroy(img.public_id);
                        } catch (err) {
                            console.error('Failed to delete old image from Cloudinary:', img.public_id, err);
                        }
                    }
                    finalImages = parsedExistingImages;
                } catch (e) {
                    console.error("Error parsing existingImages", e);
                }
            }

            if (req.files && req.files.length > 0) {
                const newImageObjects = req.files.map(file => ({
                    url: file.path,
                    public_id: file.filename
                }));
                finalImages = [...finalImages, ...newImageObjects];
            }

            product.images = finalImages;
            if (finalImages.length > 0) {
                product.image = finalImages[0].url;
            } else {
                product.image = '';
            }

            const updatedProduct = await product.save();
            res.status(200).json(updatedProduct);
        } else {
            res.status(404);
            throw new Error('Product not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            if (product.images && product.images.length > 0) {
                for (const img of product.images) {
                    try {
                        if (img.public_id) {
                            await cloudinary.uploader.destroy(img.public_id);
                        }
                    } catch (error) {
                        console.error('Error deleting image from Cloudinary:', img.public_id, error);
                    }
                }
            }

            await product.deleteOne();
            res.status(200).json({ message: 'Product removed' });
        } else {
            res.status(404);
            throw new Error('Product not found');
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Add a product review
// @route   POST /api/products/:id/reviews
// @access  Public (Guest allowed)
exports.addProductReview = async (req, res, next) => {
    try {
        const { rating, comment, name } = req.body;
        const productId = req.params.id;

        if (!rating || !comment) {
            res.status(400);
            throw new Error('Please provide rating and comment');
        }

        const product = await Product.findById(productId);

        if (!product) {
            res.status(404);
            throw new Error('Product not found');
        }

        const review = await Review.create({
            product: productId,
            name: name || 'Guest Client',
            rating: Number(rating),
            comment,
            isVerified: false // Admin can set this later or based on logic
        });

        // Recalculate average rating
        const allReviews = await Review.find({ product: productId, isHidden: { $ne: true } });
        product.totalReviews = allReviews.length;
        if (product.totalReviews > 0) {
            const sum = allReviews.reduce((acc, item) => item.rating + acc, 0);
            product.averageRating = sum / product.totalReviews;
        } else {
            product.averageRating = 0;
        }

        await product.save();

        res.status(201).json({ message: 'Review added', review });
    } catch (error) {
        next(error);
    }
};

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
exports.getProductReviews = async (req, res, next) => {
    try {
        const productId = req.params.id;
        const { sort } = req.query; // 'newest' or 'highest'
        
        let sortObj = { createdAt: -1 };
        if (sort === 'highest') {
            sortObj = { rating: -1, createdAt: -1 };
        }

        const reviews = await Review.find({ 
            product: productId,
            isHidden: { $ne: true }
        }).sort(sortObj);

        res.status(200).json(reviews);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a product review
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private/Admin
exports.deleteProductReview = async (req, res, next) => {
    try {
        const { id, reviewId } = req.params;

        const review = await Review.findById(reviewId);

        if (!review) {
            res.status(404);
            throw new Error('Review not found');
        }

        await review.deleteOne();

        // Recalculate average rating
        const product = await Product.findById(id);
        if (product) {
            const allReviews = await Review.find({ product: id, isHidden: { $ne: true } });
            product.totalReviews = allReviews.length;
            if (product.totalReviews > 0) {
                const sum = allReviews.reduce((acc, item) => item.rating + acc, 0);
                product.averageRating = sum / product.totalReviews;
            } else {
                product.averageRating = 0;
            }
            await product.save();
        }

        res.status(200).json({ message: 'Review removed' });
    } catch (error) {
        next(error);
    }
};
