const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

router.post('/announcements', protect, communityController.createAnnouncement);
router.get('/announcements', protect, communityController.getAnnouncements);
router.post('/polls', protect, communityController.createPoll);
router.get('/polls', protect, communityController.getPolls);
router.post('/polls/vote', protect, communityController.votePoll);

module.exports = router;