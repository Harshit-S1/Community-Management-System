const express = require('express');
const router = express.Router();
const flatController = require('../controllers/flatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, flatController.getAllFlats);
router.post('/', protect, flatController.createFlat);
router.delete('/:id', protect, flatController.deleteFlat);

module.exports = router;