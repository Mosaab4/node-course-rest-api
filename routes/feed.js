const express = require('express');

const feedController = require('../controllers/feed');

const router = express.Router();

router.get('/posts', feedController.getPosts);

// POST /feed/post
router.post('/post', feedController.createPost);

module.exports = router;