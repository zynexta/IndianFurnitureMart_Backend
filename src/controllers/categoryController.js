const Category = require('../models/Category');
const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json(categories);
};

// @desc    Get all categories (Admin)
// @route   GET /api/categories/admin
// @access  Private/Admin
exports.getAllCategoriesAdmin = async (req, res) => {
    const categories = await Category.find({}).sort({ order: 1 });
    res.status(200).json(categories);
};

// @desc    Reorder categories
// @route   PATCH /api/categories/reorder
// @access  Private/Admin
exports.reorderCategories = async (req, res) => {
    const { categories } = req.body;
    
    if (!categories || !Array.isArray(categories)) {
        res.status(400);
        throw new Error('Invalid data format');
    }

    const updatePromises = categories.map(cat => 
        Category.findByIdAndUpdate(cat._id, { order: cat.order })
    );

    await Promise.all(updatePromises);
    
    res.status(200).json({ message: 'Categories reordered successfully' });
};

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        res.status(400);
        throw new Error('Category name is required');
    }

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
        res.status(400);
        throw new Error('Category already exists');
    }

    const imageData = req.file ? {
        url: req.file.path,
        public_id: req.file.filename
    } : {
        url: '',
        public_id: ''
    };

    const category = await Category.create({
        name,
        description,
        image: imageData
    });

    res.status(201).json(category);
};

// @desc    Update a category
// @route   PATCH /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
    const { name, description, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
        res.status(404);
        throw new Error('Category not found');
    }

    category.name = name || category.name;
    category.description = description || category.description;
    
    if (isActive !== undefined) {
        category.isActive = isActive;
    }

    if (req.file) {
        if (category.image && category.image.public_id) {
            try {
                await cloudinary.uploader.destroy(category.image.public_id);
            } catch (err) {
                console.error('Error deleting old image from cloudinary:', err);
            }
        }
        category.image = {
            url: req.file.path,
            public_id: req.file.filename
        };
    }

    const updatedCategory = await category.save();
    res.status(200).json(updatedCategory);
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
        res.status(404);
        throw new Error('Category not found');
    }

    const productsCount = await Product.countDocuments({ category: category._id });
    if (productsCount > 0) {
        res.status(400);
        throw new Error(`Cannot delete category. There are ${productsCount} products associated with it.`);
    }

    if (category.image && category.image.public_id) {
        try {
            await cloudinary.uploader.destroy(category.image.public_id);
        } catch (err) {
            console.error('Error deleting image from cloudinary:', err);
        }
    }

    await category.deleteOne();
    res.status(200).json({ message: 'Category removed' });
};

// @desc    Get category by ID or slug
// @route   GET /api/categories/:idOrSlug
// @access  Public
exports.getCategoryByIdOrSlug = async (req, res) => {
    const { idOrSlug } = req.params;
    let category;
    
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
        category = await Category.findById(idOrSlug);
    } else {
        category = await Category.findOne({ slug: idOrSlug.toLowerCase() });
    }

    if (category) {
        res.status(200).json(category);
    } else {
        res.status(404);
        throw new Error('Category not found');
    }
};
