const express = require('express');
const { getAboutData, updateAboutData } = require('../controllers/aboutController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getAboutData);

router.put('/', protect, admin, upload.fields([
    { name: 'bannerImage', maxCount: 1 },
    { name: 'founderImage', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
]), updateAboutData);

module.exports = router;
