const express = require('express');
const router = express.Router();
const { subscribeNewsletter, getSubscribers, deleteSubscriber } = require('../controllers/newsletterController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(subscribeNewsletter)
    .get(protect, admin, getSubscribers);

router.route('/:id')
    .delete(protect, admin, deleteSubscriber);

module.exports = router;
